/**
 * 本地视觉特征提取（真跑，不依赖网络）
 * 先把画面缩到 96×96，找出「植株主体」的外接框，再只在主体区域内统计颜色与纹理，
 * 这样白墙、桌面、花盆这些背景不会把数据带偏。
 * 品种画像由 scripts/calibrate.py 用同一套算法量参考图得到。
 */

export interface ImageFeatures {
  /** 植株像素的平均色相（0–360，黄绿≈80，深绿≈130） */
  hue: number
  /** 植株像素的平均明度 0–1 */
  light: number
  /** 植株像素的平均饱和度 0–1 */
  sat: number
  /** 主体区域内各类像素占比 */
  green: number
  yellow: number
  brown: number
  dark: number
  bright: number
  /** 植株占外接框的比例（密集大叶 vs 稀疏藤蔓） */
  fill: number
  /** 外接框的高宽比（竖长条 vs 横向铺开） */
  aspect: number
  /** 植株区域内部纹理密度 */
  greenEdge: number
  /** 主体区域纹理密度 */
  edge: number
  /** 植株像素占整幅画面的比例（太小说明没拍准） */
  subject: number
  width: number
  height: number
  sampled: number
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d < 1e-6) return [0, 0, l]
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h *= 60
  if (h < 0) h += 360
  return [h, s, l]
}

const SAMPLE = 96

/** 植株像素：绿色系（含深绿/墨绿叶片），排除极端暗部与高光 */
function isPlant(h: number, s: number, l: number): boolean {
  return h >= 55 && h <= 185 && s > 0.1 && l > 0.04 && l < 0.92
}

export function analyzeCanvas(img: CanvasImageSource, width: number, height: number): ImageFeatures {
  const canvas = document.createElement('canvas')
  canvas.width = SAMPLE
  canvas.height = SAMPLE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('浏览器不支持 canvas 采样')
  ctx.drawImage(img, 0, 0, width, height, 0, 0, SAMPLE, SAMPLE)
  const data = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data

  const total = SAMPLE * SAMPLE
  const hue = new Float32Array(total)
  const sat = new Float32Array(total)
  const lig = new Float32Array(total)
  const mask = new Uint8Array(total)

  let maskCount = 0
  let minX = SAMPLE
  let minY = SAMPLE
  let maxX = -1
  let maxY = -1

  for (let i = 0; i < total; i += 1) {
    const p = i * 4
    const [h, s, l] = rgbToHsl(data[p], data[p + 1], data[p + 2])
    hue[i] = h
    sat[i] = s
    lig[i] = l
    if (isPlant(h, s, l)) {
      mask[i] = 1
      maskCount += 1
      const y = Math.floor(i / SAMPLE)
      const x = i - y * SAMPLE
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  // 主体框：植株外接框外扩 8%，让叶缘与阴影保留在统计范围内
  let rx0 = 0
  let ry0 = 0
  let rx1 = SAMPLE - 1
  let ry1 = SAMPLE - 1
  if (maxX >= 0) {
    const w = maxX - minX + 1
    const h = maxY - minY + 1
    const padX = Math.round(w * 0.08) + 1
    const padY = Math.round(h * 0.08) + 1
    rx0 = Math.max(0, minX - padX)
    ry0 = Math.max(0, minY - padY)
    rx1 = Math.min(SAMPLE - 1, maxX + padX)
    ry1 = Math.min(SAMPLE - 1, maxY + padY)
  }
  const cropArea = (rx1 - rx0 + 1) * (ry1 - ry0 + 1)

  let greenPx = 0
  let yellowPx = 0
  let brownPx = 0
  let darkPx = 0
  let brightPx = 0
  let ghSum = 0
  let glSum = 0
  let gsSum = 0
  let edgeSum = 0
  let edgeCnt = 0
  let greenEdgeSum = 0
  let greenEdgeCnt = 0

  for (let y = ry0; y <= ry1; y += 1) {
    for (let x = rx0; x <= rx1; x += 1) {
      const i = y * SAMPLE + x
      const h = hue[i]
      const s = sat[i]
      const l = lig[i]

      if (mask[i]) {
        greenPx += 1
        ghSum += h
        glSum += l
        gsSum += s
      } else if (h >= 35 && h < 62 && s > 0.15 && l > 0.35) {
        yellowPx += 1
      } else if (s > 0.12 && l < 0.62 && ((h >= 8 && h < 52) || h >= 340 || h < 8)) {
        brownPx += 1
      }

      if (l < 0.22) darkPx += 1
      if (l > 0.86 && s < 0.18) brightPx += 1

      for (const dx of [1, 0]) {
        const nx = x + (dx === 1 ? 1 : 0)
        const ny = y + (dx === 1 ? 0 : 1)
        if (nx > rx1 || ny > ry1) continue
        const j = ny * SAMPLE + nx
        const d = Math.abs(l - lig[j])
        edgeSum += d
        edgeCnt += 1
        if (mask[i] && mask[j]) {
          greenEdgeSum += d
          greenEdgeCnt += 1
        }
      }
    }
  }

  const bbox = maxX >= 0 ? (maxX - minX + 1) * (maxY - minY + 1) : 0

  return {
    hue: greenPx ? ghSum / greenPx : 0,
    light: greenPx ? glSum / greenPx : 0.5,
    sat: greenPx ? gsSum / greenPx : 0,
    green: cropArea ? greenPx / cropArea : 0,
    yellow: cropArea ? yellowPx / cropArea : 0,
    brown: cropArea ? brownPx / cropArea : 0,
    dark: cropArea ? darkPx / cropArea : 0,
    bright: cropArea ? brightPx / cropArea : 0,
    fill: bbox ? greenPx / bbox : 0,
    aspect: maxX >= 0 ? (maxY - minY + 1) / (maxX - minX + 1) : 1,
    greenEdge: greenEdgeCnt ? greenEdgeSum / greenEdgeCnt : 0,
    edge: edgeCnt ? edgeSum / edgeCnt : 0,
    subject: maskCount / total,
    width,
    height,
    sampled: total,
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = src
  })
}

export async function analyzeImage(src: string): Promise<ImageFeatures> {
  const img = await loadImage(src)
  return analyzeCanvas(img, img.naturalWidth || img.width, img.naturalHeight || img.height)
}

/** 多角度合并：植株占比做权重，让「叶片拍得满」的那张更有话语权 */
export async function analyzeImages(srcs: string[]): Promise<ImageFeatures> {
  const list = await Promise.all(srcs.slice(0, 3).map((s) => analyzeImage(s)))
  if (list.length === 1) return list[0]
  const weight = list.map((f) => Math.max(0.12, f.subject))
  const wSum = weight.reduce((a, b) => a + b, 0)
  const mix = (pick: (f: ImageFeatures) => number) =>
    list.reduce((acc, f, i) => acc + pick(f) * weight[i], 0) / wSum
  return {
    hue: mix((f) => f.hue),
    light: mix((f) => f.light),
    sat: mix((f) => f.sat),
    green: mix((f) => f.green),
    yellow: mix((f) => f.yellow),
    brown: mix((f) => f.brown),
    dark: mix((f) => f.dark),
    bright: mix((f) => f.bright),
    fill: mix((f) => f.fill),
    aspect: mix((f) => f.aspect),
    greenEdge: mix((f) => f.greenEdge),
    edge: mix((f) => f.edge),
    subject: mix((f) => f.subject),
    width: list[0].width,
    height: list[0].height,
    sampled: list.reduce((a, f) => a + f.sampled, 0),
  }
}

/** 给用户看的「我到底量到了什么」 */
export function describeFeatures(f: ImageFeatures): string[] {
  const tone = f.hue >= 110 ? '深绿' : f.hue >= 92 ? '中绿' : f.hue >= 62 ? '黄绿' : '非典型绿色'
  const shape =
    f.aspect > 1.35 ? '竖向细长' : f.aspect < 0.8 ? '横向铺开' : f.fill > 0.32 ? '叶片成片' : '较为分散'
  const texture =
    f.greenEdge > 0.09 ? '叶面纹理明显' : f.greenEdge > 0.06 ? '纹理适中' : '叶面平滑'
  return [
    `主色 ${tone} · 植株占画面 ${Math.round(f.subject * 100)}%（色相 ${Math.round(f.hue)}°）`,
    `叶色明度 ${Math.round(f.light * 100)}% · 饱和度 ${Math.round(f.sat * 100)}%`,
    `株型 ${shape} · ${texture}`,
  ]
}
