import { SPECIES } from '../data/species'
import { DISEASE_LIBRARY } from '../data/diseases'
import type { DiseaseOutcome, IdentifyOutcome } from '../data/types'
import { analyzeImages, describeFeatures, type ImageFeatures } from './vision'

/**
 * 识图服务（本地可运行版）
 * 真流程：图片 → canvas 采样 → 主体裁剪内的颜色/纹理特征 → 与品种画像做高斯匹配 → 候选排序。
 * 匹配度由「绝对相似度」与「领先第二名的差距」共同决定，相似度不够就明确说没认准，而不是硬给一个高分。
 * 以后接真实视觉模型，只需在这里替换为网络请求，返回结构不变。
 */

interface SpeciesProfile {
  hue: number
  light: number
  sat: number
  fill: number
  aspect: number
  yellow: number
  bright: number
  green: number
  brown: number
  greenEdge: number
  subject: number
}

/**
 * 品种画像：由 scripts/calibrate.py 在 public/images 的参考图上量出来，
 * 与 vision.ts 的采样算法完全一致（96×96、主体外接框外扩 8%、HSL 阈值相同）。
 */
const PROFILES: Record<string, SpeciesProfile> = {
  // 深绿大叶，色相最偏绿，黄化少
  monstera: { hue: 120.6, light: 0.28, sat: 0.29, fill: 0.29, aspect: 1.12, yellow: 0.01, bright: 0.05, green: 0.25, brown: 0.12, greenEdge: 0.058, subject: 0.23 },
  // 黄绿明亮，藤蔓成片
  pothos: { hue: 96.3, light: 0.41, sat: 0.43, fill: 0.31, aspect: 0.97, yellow: 0.06, bright: 0.04, green: 0.26, brown: 0.08, greenEdge: 0.077, subject: 0.25 },
  // 灰绿偏粉，横向铺开、饱和度最低
  succulent: { hue: 77.7, light: 0.42, sat: 0.23, fill: 0.18, aspect: 1.32, yellow: 0.06, bright: 0.24, green: 0.14, brown: 0.14, greenEdge: 0.08, subject: 0.1 },
  // 竖向细长、条纹多，黄绿过渡明显
  snake: { hue: 84.8, light: 0.28, sat: 0.38, fill: 0.31, aspect: 0.85, yellow: 0.42, bright: 0.1, green: 0.22, brown: 0.06, greenEdge: 0.088, subject: 0.1 },
  // 横向铺开、褐色基质多
  fiddle: { hue: 89.6, light: 0.23, sat: 0.35, fill: 0.15, aspect: 0.61, yellow: 0.03, bright: 0.14, green: 0.12, brown: 0.25, greenEdge: 0.061, subject: 0.09 },
  // 深绿紧凑 + 白花，明度低、饱和度高
  'peace-lily': { hue: 89.5, light: 0.23, sat: 0.43, fill: 0.45, aspect: 0.67, yellow: 0.1, bright: 0.0, green: 0.37, brown: 0.07, greenEdge: 0.062, subject: 0.28 },
  // 竖条状厚叶、表面平滑，白盆占比大
  aloe: { hue: 92.1, light: 0.43, sat: 0.23, fill: 0.14, aspect: 1.22, yellow: 0.0, bright: 0.59, green: 0.11, brown: 0.01, greenEdge: 0.122, subject: 0.09 },
  // 墨绿厚叶、明度最低
  rubber: { hue: 110.2, light: 0.14, sat: 0.37, fill: 0.26, aspect: 0.97, yellow: 0.0, bright: 0.4, green: 0.17, brown: 0.03, greenEdge: 0.043, subject: 0.04 },
  // 叶细长成簇、明度最高
  spider: { hue: 96.3, light: 0.62, sat: 0.48, fill: 0.28, aspect: 0.99, yellow: 0.26, bright: 0.05, green: 0.26, brown: 0.04, greenEdge: 0.099, subject: 0.26 },
}

const DEFAULT_PROFILE: SpeciesProfile = {
  hue: 100,
  light: 0.35,
  sat: 0.35,
  fill: 0.25,
  aspect: 1,
  yellow: 0.08,
  bright: 0.1,
  green: 0.2,
  brown: 0.12,
  greenEdge: 0.08,
  subject: 0.2,
}

const WEIGHT: Record<keyof SpeciesProfile, number> = {
  hue: 0.16,
  light: 0.12,
  sat: 0.12,
  fill: 0.08,
  aspect: 0.08,
  yellow: 0.1,
  bright: 0.06,
  green: 0.07,
  brown: 0.07,
  greenEdge: 0.05,
  subject: 0.09,
}

/** 各维度容差：色相最宽容，纹理/褐色最严格 */
const SIGMA: Record<keyof SpeciesProfile, number> = {
  hue: 12,
  light: 0.1,
  sat: 0.09,
  fill: 0.14,
  aspect: 0.3,
  yellow: 0.1,
  bright: 0.1,
  green: 0.09,
  brown: 0.08,
  greenEdge: 0.03,
  subject: 0.1,
}

function gauss(x: number, target: number, sigma: number): number {
  const d = (x - target) / sigma
  return Math.exp(-0.5 * d * d)
}

function scoreProfile(f: ImageFeatures, p: SpeciesProfile): number {
  let sum = 0
  for (const k of Object.keys(WEIGHT) as (keyof SpeciesProfile)[]) {
    sum += WEIGHT[k] * gauss(f[k], p[k], SIGMA[k])
  }
  return sum
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** 软化的相对排名：温度越低，第一名越突出 */
function softmax(values: number[], t: number): number[] {
  const m = Math.max(...values)
  const exps = values.map((v) => Math.exp((v - m) / t))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export const identifyService = {
  async identifyPlant(images: string[], attempt = 0): Promise<IdentifyOutcome> {
    const started = Date.now()
    const features = await analyzeImages(images)

    // 主体太小（大多是背景/桌面）时，先提示重拍
    const subjectOk = features.subject >= 0.035
    const plantLike = subjectOk && features.green >= 0.05 && features.greenEdge > 0.012

    const scored = SPECIES.map((s) => ({
      species: s,
      raw: scoreProfile(features, PROFILES[s.id] ?? DEFAULT_PROFILE),
    })).sort((a, b) => b.raw - a.raw)

    const raws = scored.map((s) => s.raw)
    const topRaw = raws[0]
    const secondRaw = raws[1] ?? 0
    const gap = topRaw - secondRaw

    // 绝对强度：相似度本身够不够高（0.58 以下基本等于「都不像」）
    const strength = plantLike ? clamp((topRaw - 0.58) / 0.3, 0, 1) : 0
    const shares = softmax(raws, 0.09)
    // 多角度带来的稳定加成有限，最多 +3%
    const bonus = attempt > 0 ? 0 : Math.min(0.03, (images.length - 1) * 0.015)

    const candidates = scored.slice(0, 3).map((s, i) => {
      const confidence = clamp(strength * shares[i] + bonus, 0.05, 0.92)
      return {
        speciesId: s.species.id,
        name: s.species.name,
        latin: s.species.latin,
        image: s.species.image,
        confidence: Math.round(confidence * 1000) / 1000,
        brief: s.species.summary,
      }
    })

    // 保证候选分数单调，避免第二名反而更高
    for (let i = 1; i < candidates.length; i += 1) {
      if (candidates[i].confidence >= candidates[i - 1].confidence) {
        candidates[i].confidence = Math.max(0.05, candidates[i - 1].confidence - 0.05)
      }
    }

    const confident = plantLike && strength >= 0.45 && gap >= 0.02

    return {
      candidates,
      needRetake: !confident,
      tookMs: Date.now() - started,
      basis: describeFeatures(features),
      engine: 'local-vision',
    }
  },

  async identifyDisease(images: string[]): Promise<DiseaseOutcome> {
    const started = Date.now()
    const f = await analyzeImages(images)

    // 画面「缺陷信号」：黄化、褐斑、暗部、纹理碎化、高光灼伤
    const defect =
      0.45 * f.yellow +
      0.75 * f.brown +
      0.4 * f.dark +
      0.5 * Math.max(0, f.greenEdge - 0.07) +
      0.35 * f.bright

    const evidence: Record<string, number> = {
      overwater: 0.55 * f.dark + 0.5 * f.yellow + 0.35 * f.brown + 0.15 * (1 - f.sat),
      nutrient: 0.9 * f.yellow,
      'leaf-spot': 0.95 * f.brown + 0.5 * Math.max(0, f.greenEdge - 0.08),
      'spider-mite': 0.6 * Math.max(0, f.greenEdge - 0.08) + 0.35 * f.yellow + 0.2 * f.bright,
      sunburn: 0.8 * f.bright + 0.25 * f.brown,
    }

    const totalEvidence = Object.values(evidence).reduce((a, b) => a + b, 0)
    const healthy = defect < 0.12

    const scored = DISEASE_LIBRARY.map((c) => {
      const weight = evidence[c.id] ?? 0.05
      const share = totalEvidence > 0.001 ? weight / totalEvidence : 1 / DISEASE_LIBRARY.length
      // 健康画面下所有病因都被压低，避免误导
      const probability = healthy
        ? clamp(0.05 + share * 0.35, 0.03, 0.3)
        : clamp(0.06 + share * 0.86, 0.03, 0.86)
      return { ...c, probability: Math.round(probability * 1000) / 1000 }
    }).sort((a, b) => b.probability - a.probability)

    const top = scored[0]
    const urgency: DiseaseOutcome['urgency'] =
      top.probability >= 0.4 ? top.urgency : top.probability >= 0.22 ? 'medium' : 'low'

    return {
      conditions: scored,
      urgency,
      disclaimer: healthy
        ? '画面里没看到明显的斑点与黄化，先按正常周期养护；一周后再拍一次做对比。'
        : '本地视觉判断只解释画面能看到的部分，严重病害建议咨询线下花店或植保人员。',
      basis: describeFeatures(f),
      engine: 'local-vision',
      tookMs: Date.now() - started,
    }
  },
}
