import { useRef, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { identifyService } from '../services/identify'
import { fileToDataUrl } from '../utils/image'
import { formatDate } from '../services/care'
import { getSpecies, SPECIES } from '../data/species'
import { useToast } from '../components/Toast'
import { BottomSheet } from '../components/BottomSheet'
import { CameraSheet } from '../components/CameraSheet'
import type { DiseaseOutcome, IdentifyRecord, IdentifyOutcome } from '../data/types'
import {
  AlertIcon,
  CameraIcon,
  ChevronLeftIcon,
  CloseIcon,
  DropletIcon,
  GalleryIcon,
  InfoIcon,
  LeafIcon,
  PlusIcon,
  ScanIcon,
  SparkleIcon,
  SunIcon,
  TempIcon,
} from '../components/icons'
import { asset } from '../utils/asset'

type Mode = 'plant' | 'disease'
type Stage = 'idle' | 'loading' | 'result'

/** 多图采集的固定机位（PRD F01：全株 + 局部 + 正反面） */
const ANGLE_LABELS = ['全株', '局部', '背面'] as const

interface Shot {
  url: string
  label: string
}

export function Identify() {
  const navigate = useNavigate()
  const toast = useToast()
  const { addPlant, setIssue, plants, history, recordIdentify, updateIdentify } = useGarden()
  const [params] = useSearchParams()
  const initialMode = (params.get('mode') === 'disease' ? 'disease' : 'plant') as Mode
  const linkedPlantId = params.get('plantId') ?? undefined

  const [mode, setMode] = useState<Mode>(initialMode)
  const [shots, setShots] = useState<Shot[]>([])
  const [stage, setStage] = useState<Stage>('idle')
  const [plantResult, setPlantResult] = useState<IdentifyOutcome | null>(null)
  const [diseaseResult, setDiseaseResult] = useState<DiseaseOutcome | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [selected, setSelected] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [nickname, setNickname] = useState('')
  const [recordId, setRecordId] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)

  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const preview = shots[0]?.url ?? null

  const reset = () => {
    setShots([])
    setStage('idle')
    setPlantResult(null)
    setDiseaseResult(null)
    setAttempt(0)
    setSelected(0)
    setRecordId(null)
  }

  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    const room = 3 - shots.length
    if (room <= 0) {
      toast('最多补 3 张：全株、局部、背面')
      return
    }
    const list = Array.from(files).slice(0, room)
    try {
      const urls = await Promise.all(list.map((f) => fileToDataUrl(f)))
      setShots((prev) => {
        const merged = [...prev, ...urls.map((url) => ({ url, label: '' }))]
        return merged.map((s, i) => ({ ...s, label: ANGLE_LABELS[i] ?? '补充' }))
      })
      setStage('idle')
      setPlantResult(null)
      setDiseaseResult(null)
      setAttempt(0)
      setSelected(0)
      setRecordId(null)
    } catch (err) {
      toast(err instanceof Error ? err.message : '图片读取失败')
    }
  }

  const addFromDataUrl = (url: string) => {
    if (shots.length >= 3) {
      toast('最多补 3 张：全株、局部、背面')
      return
    }
    setShots((prev) => {
      const merged = [...prev, { url, label: '' }]
      return merged.map((s, i) => ({ ...s, label: ANGLE_LABELS[i] ?? '补充' }))
    })
    setStage('idle')
    setPlantResult(null)
    setDiseaseResult(null)
    setAttempt(0)
    setSelected(0)
    setRecordId(null)
  }

  const removeShot = (index: number) => {
    setShots((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.map((s, i) => ({ ...s, label: ANGLE_LABELS[i] ?? '补充' }))
    })
    setStage('idle')
    setPlantResult(null)
    setDiseaseResult(null)
  }

  const run = async (overrideImages?: string[]) => {
    const images = overrideImages ?? shots.map((s) => s.url)
    if (!images.length) return
    setStage('loading')
    try {
      const t0 = Date.now()
      if (mode === 'plant') {
        const res = await identifyService.identifyPlant(images, attempt)
        setPlantResult(res)
        setSelected(0)
        const top = res.candidates[0]
        if (top) {
          setRecordId(
            recordIdentify({
              mode: 'plant',
              image: images[0],
              extraCount: images.length - 1,
              topName: top.name,
              topConfidence: top.confidence,
              speciesId: top.speciesId,
            }),
          )
        }
      } else {
        const res = await identifyService.identifyDisease(images)
        setDiseaseResult(res)
        const top = res.conditions[0]
        if (top) {
          setRecordId(
            recordIdentify({
              mode: 'disease',
              image: images[0],
              extraCount: images.length - 1,
              topName: top.name,
              topConfidence: top.probability,
            }),
          )
        }
      }
      // 本地分析通常 <100ms，给扫描动画留一点时间，避免结果「闪」出来
      const elapsed = Date.now() - t0
      if (elapsed < 650) await new Promise((r) => setTimeout(r, 650 - elapsed))
      setStage('result')
    } catch {
      toast('识别失败，请重试')
      setStage('idle')
    }
  }

  const rerunFromHistory = (rec: IdentifyRecord) => {
    setMode(rec.mode)
    setShots([{ url: rec.image, label: ANGLE_LABELS[0] }])
    setPlantResult(null)
    setDiseaseResult(null)
    setRecordId(rec.id)
    void run([rec.image])
  }

  const currentSpecies = plantResult?.candidates[selected]
    ? getSpecies(plantResult.candidates[selected].speciesId)
    : null

  const confirmAdd = () => {
    if (!currentSpecies || !preview) return
    const id = addPlant({
      speciesId: currentSpecies.id,
      nickname: nickname.trim() || currentSpecies.name,
      image: preview,
    })
    if (recordId) updateIdentify(recordId, { added: true })
    setSheetOpen(false)
    toast('已加入温室')
    navigate(`/plant/${id}`)
  }

  const markDisease = () => {
    if (linkedPlantId) {
      setIssue(linkedPlantId, 'alert', diseaseResult?.conditions[0]?.name)
      toast('已标记为异常，并生成处理待办')
      navigate(`/plant/${linkedPlantId}`)
    } else {
      toast('已保存诊断记录')
      reset()
    }
  }

  return (
    <div className="pb-[104px]">
      <header className="sticky top-0 z-20 bg-[rgba(250,246,238,0.92)] px-4 pb-3 pt-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-2 shadow-sm"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <div className="text-center">
            <h1 className="text-[16px] font-semibold tracking-tight text-ink">
              {mode === 'plant' ? '拍照识植物' : '病害诊断'}
            </h1>
            <p className="mt-0.5 text-[10.5px] tracking-wider text-ink-3">F01 / F04</p>
          </div>
          <div className="h-9 w-9" />
        </div>

        <div className="mt-3 flex rounded-full bg-[#eee9dd] p-1">
          {(['plant', 'disease'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m)
                setStage('idle')
                setPlantResult(null)
                setDiseaseResult(null)
              }}
              className={`flex-1 rounded-full py-1.5 text-[12px] font-medium transition-colors ${
                mode === m ? 'bg-white text-moss shadow-sm' : 'text-ink-3'
              }`}
            >
              {m === 'plant' ? '识别品种' : '识别病害'}
            </button>
          ))}
        </div>
      </header>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files)
          e.target.value = ''
        }}
      />

      {/* 拍摄区 */}
      <section className="px-4">
        {!preview ? (
          <div className="relative overflow-hidden rounded-[26px] border border-dashed border-[#cdc7b8] bg-white/60 px-6 py-10">
            <div className="flex flex-col items-center text-center">
              <div
                className="grid h-16 w-16 place-items-center rounded-full text-white"
                style={{
                  background: 'linear-gradient(160deg,#4c8f6a,#2f6047)',
                  boxShadow: '0 14px 26px -16px rgba(47,96,71,0.8)',
                }}
              >
                <CameraIcon size={28} />
              </div>
              <p className="mt-4 text-[14px] font-medium text-ink">
                {mode === 'plant' ? '拍一张，就知道它怎么养' : '对准异常叶片，看看出了什么问题'}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-3">
                尽量让叶片占满画面，光线均匀<br />识别结果仅供参考，请结合实物判断
              </p>
              <div className="mt-5 flex w-full gap-2.5">
                <button
                  type="button"
                  onClick={() => setCameraOpen(true)}
                  className="press flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moss py-2.5 text-[12.5px] font-medium text-white"
                >
                  <CameraIcon size={15} />
                  拍照
                </button>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="press flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#dcd6c8] bg-white py-2.5 text-[12.5px] text-ink-2"
                >
                  <GalleryIcon size={15} />
                  相册
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative overflow-hidden rounded-[26px] bg-[#e8e3d7]">
            <div className="relative aspect-[4/3] w-full">
              <img src={asset(preview)} alt="待识别图片" className="h-full w-full object-cover" />
              {stage === 'loading' && (
                <>
                  <div className="absolute inset-0 bg-[rgba(24,36,28,0.34)]" />
                  <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                    <div
                      className="scan-line absolute inset-x-0 h-[34%]"
                      style={{
                        background:
                          'linear-gradient(180deg,rgba(159,214,178,0) 0%,rgba(159,214,178,0.34) 100%)',
                        borderBottom: '1px solid rgba(214,240,224,0.9)',
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                    <ScanIcon size={26} className="breath" />
                    <p className="text-[12.5px] font-medium">正在采样叶色与纹理…</p>
                    <p className="text-[10.5px] text-white/60">
                      本地分析 · {shots.length} 张 · 约 1 秒
                    </p>
                  </div>
                </>
              )}
              {stage !== 'loading' && (
                <div className="absolute right-2.5 top-2.5 flex gap-1.5">
                  <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] text-white backdrop-blur">
                    {shots.length > 1 ? `${shots.length} 张 · ${shots[0].label}` : shots[0]?.label}
                  </span>
                  <button
                    type="button"
                    onClick={reset}
                    className="press rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] text-white backdrop-blur"
                  >
                    重选
                  </button>
                </div>
              )}
            </div>

            {/* 多角度补充 */}
            {(stage === 'idle' || shots.length > 1) && (
              <div className="flex items-center gap-2 px-3 pb-1 pt-3">
                {shots.map((s, i) => (
                  <div key={`${s.url.slice(0, 24)}-${i}`} className="relative">
                    <img
                      src={asset(s.url)}
                      alt={s.label}
                      className="h-[52px] w-[52px] rounded-xl border border-white/60 object-cover"
                    />
                    <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-black/45 py-[1px] text-center text-[8.5px] text-white">
                      {s.label}
                    </span>
                    {stage !== 'loading' && (
                      <button
                        type="button"
                        onClick={() => removeShot(i)}
                        aria-label={`移除${s.label}图`}
                        className="press absolute -right-1.5 -top-1.5 grid h-[17px] w-[17px] place-items-center rounded-full bg-white text-ink-2 shadow"
                      >
                        <CloseIcon size={9} />
                      </button>
                    )}
                  </div>
                ))}
                {stage !== 'loading' && shots.length < 3 && (
                  <button
                    type="button"
                    onClick={() => galleryRef.current?.click()}
                    className="press flex h-[52px] w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-[#d8d2c4] bg-white/60 text-ink-3"
                  >
                    <PlusIcon size={14} />
                    <span className="text-[8.5px] leading-none">补一张</span>
                  </button>
                )}
                <p className="ml-auto max-w-[120px] text-right text-[9.5px] leading-snug text-ink-3">
                  {shots.length < 3 ? '补充局部或背面，识别更稳' : '已拍满 3 个角度'}
                </p>
              </div>
            )}

            {stage === 'idle' && (
              <div className="flex gap-2 p-3">
                <button
                  type="button"
                  onClick={() => void run()}
                  className="press flex flex-1 items-center justify-center gap-1.5 rounded-full bg-moss py-2.5 text-[12.5px] font-medium text-white"
                >
                  <SparkleIcon size={15} />
                  {mode === 'plant' ? '开始识别' : '开始诊断'}
                  {shots.length > 1 && (
                    <span className="tabular text-[11px] text-white/70">· {shots.length} 张</span>
                  )}
                </button>
              </div>
            )}
            {stage === 'loading' && <div className="h-3" />}
          </div>
        )}
      </section>

      {/* 结果 */}
      {stage === 'result' && mode === 'plant' && plantResult && currentSpecies && (
        <section className="mt-4 px-4">
          {plantResult.needRetake && (
            <div className="mb-3 flex items-start gap-2 rounded-[18px] border border-[#EEDFBE] bg-[#FBF2DE] px-3.5 py-3">
              <InfoIcon size={15} className="mt-[1px] text-[#8A6415]" />
              <div className="flex-1">
                <p className="text-[11.5px] font-semibold text-[#8A6415]">这次没认准（最接近的只有 {Math.round((plantResult.candidates[0]?.confidence ?? 0) * 100)}%）</p>
                <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#8b7a55]">
                  画面里的特征和库内 9 个品种都不太吻合，多半是还没收录的品种。让叶片占满画面、光线均匀再拍一次，或在下方候选里手动纠正。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAttempt((a) => a + 1)
                    void run()
                  }}                  className="press mt-2 rounded-full border border-[#e2cfa2] bg-white/70 px-2.5 py-1 text-[10.5px] text-[#8A6415]"
                >
                  换个角度重拍
                </button>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-4 pb-4 pt-4">
              <p className="text-[10px] tracking-[0.16em] text-ink-3">识别结果 · 用时 {plantResult.tookMs}ms</p>
              <div className="mt-1.5 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-[21px] font-semibold leading-tight tracking-tight text-ink">
                    {plantResult.needRetake ? '没认准' : currentSpecies.name}
                  </h2>
                  <p className="mt-0.5 truncate text-[11.5px] italic text-ink-3">
                    {plantResult.needRetake ? `最接近：${currentSpecies.name} · ${currentSpecies.latin}` : currentSpecies.latin}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-ink-3">{plantResult.needRetake ? '相似度' : '匹配度'}</p>
                  <p className="tabular text-[19px] font-semibold leading-none text-leaf">
                    {plantResult.needRetake
                      ? '不确定'
                      : Math.round((plantResult.candidates[selected]?.confidence ?? 0) * 100)}
                    {!plantResult.needRetake && <span className="text-[11px] font-normal">%</span>}
                  </p>
                </div>
              </div>

              <div className="mt-3 h-[4px] w-full overflow-hidden rounded-full bg-[#ece7db]">
                <div
                  className="h-full rounded-full bg-leaf transition-[width] duration-700"
                  style={{ width: `${(plantResult.candidates[selected]?.confidence ?? 0) * 100}%` }}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <Chip icon={<SunIcon size={11} />} text={currentSpecies.light.split('，')[0]} />
                <Chip icon={<DropletIcon size={11} />} text={`约 ${currentSpecies.waterEveryDays} 天浇水`} />
                <Chip icon={<TempIcon size={11} />} text={currentSpecies.temp.split('，')[0]} />
              </div>

              <p className="mt-3 text-[11.5px] leading-relaxed text-ink-2">{currentSpecies.summary}</p>

              {plantResult.basis && (
                <div className="mt-3 rounded-2xl bg-[#f7f4ea] px-3 py-2.5">
                  <p className="text-[10px] font-semibold tracking-wide text-ink-3">
                    判断依据（本地视觉）
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {plantResult.basis.map((b) => (
                      <li key={b} className="flex gap-1.5 text-[10.5px] leading-relaxed text-ink-2">
                        <span className="text-leaf">·</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setNickname(currentSpecies.name)
                setSheetOpen(true)
              }}
              className="press flex w-full items-center justify-center gap-1.5 bg-moss py-3 text-[13px] font-medium text-white"
            >
              <LeafIcon size={15} />
              加入温室
            </button>
          </div>

          <div className="mt-4">
            <p className="mb-2 px-1 text-[11.5px] text-ink-3">其他可能</p>
            <div className="space-y-2">
              {plantResult.candidates.slice(1).map((c, i) => (
                <button
                  key={c.speciesId}
                  type="button"
                  onClick={() => setSelected(i + 1)}
                  className={`press flex w-full items-center gap-3 rounded-[18px] border bg-white/70 px-3 py-2.5 text-left ${
                    selected === i + 1 ? 'border-leaf/50' : 'border-line/80'
                  }`}
                >
                  <img src={asset(c.image)} alt={c.name} className="h-10 w-10 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-ink">{c.name}</p>
                    <p className="truncate text-[10.5px] italic text-ink-3">{c.latin}</p>
                  </div>
                  <span className="tabular text-[11.5px] text-ink-2">{Math.round(c.confidence * 100)}%</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-4 px-2 text-center text-[10px] leading-relaxed text-ink-3">
            以上结论由本地视觉统计得出，未上传你的照片；结果仅供参考，请结合实物判断
          </p>
        </section>
      )}

      {stage === 'result' && mode === 'disease' && diseaseResult && (
        <section className="mt-4 px-4">
          <div
            className="rounded-[22px] px-4 py-3.5"
            style={{
              background:
                diseaseResult.urgency === 'high'
                  ? 'linear-gradient(150deg,#C0553F,#93372A)'
                  : diseaseResult.urgency === 'medium'
                    ? 'linear-gradient(150deg,#D9A441,#B07C1F)'
                    : 'linear-gradient(150deg,#4c8f6a,#2f6047)',
            }}
          >
            <div className="flex items-center gap-2 text-white">
              <AlertIcon size={16} />
              <p className="text-[13px] font-semibold">
                紧急程度：{diseaseResult.urgency === 'high' ? '高 · 建议 48 小时内处理' : diseaseResult.urgency === 'medium' ? '中 · 本周内处理' : '低 · 观察即可'}
              </p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/80">
              共匹配到 {diseaseResult.conditions.length} 种可能病因，按概率从高到低排列
              {diseaseResult.tookMs ? ` · 本地分析 ${diseaseResult.tookMs}ms` : ''}
            </p>
          </div>

          {diseaseResult.basis && (
            <div className="mt-3 rounded-2xl border border-line/80 bg-white/70 px-3.5 py-2.5">
              <p className="text-[10px] font-semibold tracking-wide text-ink-3">画面证据</p>
              <ul className="mt-1.5 space-y-1">
                {diseaseResult.basis.map((b) => (
                  <li key={b} className="flex gap-1.5 text-[10.5px] leading-relaxed text-ink-2">
                    <span className="text-leaf">·</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-3 space-y-3">
            {diseaseResult.conditions.map((c, i) => (
              <div key={c.id} className="card px-4 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f1efe6] text-[11px] font-semibold text-ink-2">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] font-semibold text-ink">{c.name}</p>
                  </div>
                  <span className="tabular shrink-0 text-[12px] font-semibold text-leaf">
                    {Math.round(c.probability * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#ece7db]">
                  <div className="h-full rounded-full bg-leaf/70" style={{ width: `${c.probability * 100}%` }} />
                </div>
                <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-2">{c.cause}</p>

                <div className="mt-3 rounded-2xl bg-[#f7f4ea] px-3 py-2.5">
                  <p className="text-[10.5px] font-semibold tracking-wide text-ink-3">处理步骤</p>
                  <ol className="mt-1.5 space-y-1">
                    {c.steps.map((s, idx) => (
                      <li key={s} className="flex gap-1.5 text-[11px] leading-relaxed text-ink-2">
                        <span className="tabular shrink-0 text-[10px] text-ink-3">{idx + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="mt-2 text-[10.5px] leading-relaxed text-ink-3">
                  预防：{c.prevention.join('；')}
                </p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={markDisease}
            className="press mt-4 w-full rounded-full bg-moss py-3 text-[13px] font-medium text-white"
          >
            {linkedPlantId
              ? `标记「${plants.find((p) => p.id === linkedPlantId)?.nickname ?? '这盆'}」为异常`
              : '保存诊断记录'}
          </button>

          <p className="mt-3 px-2 text-center text-[10px] leading-relaxed text-ink-3">
            {diseaseResult.disclaimer}
          </p>
        </section>
      )}

      {/* 常见品种速查（未选图时） */}
      {!preview && stage === 'idle' && (
        <>
          <section className="mt-6 px-4">
            <div className="mb-2.5 flex items-baseline justify-between px-1">
              <h2 className="text-[15px] font-semibold tracking-tight text-ink">常见品种速查</h2>
              <button
                type="button"
                onClick={() => navigate('/discover')}
                className="text-[11px] text-ink-3"
              >
                全部百科
              </button>
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
              {SPECIES.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate(`/species/${s.id}`)}
                  className="press w-[112px] shrink-0 overflow-hidden rounded-[16px] border border-line/80 bg-white/75 text-left"
                >
                  <img src={asset(s.image)} alt={s.name} className="h-[88px] w-full object-cover" loading="lazy" />
                  <div className="px-2 py-1.5">
                    <p className="text-[11.5px] font-medium text-ink">{s.name}</p>
                    <p className="text-[9.5px] text-ink-3">约 {s.waterEveryDays} 天浇水</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 px-4">
            <div className="rounded-[22px] border border-line/80 bg-white/55 px-4 py-3.5">
              <p className="text-[11.5px] font-semibold text-ink">拍得准一点，识别更稳</p>
              <ul className="mt-2 space-y-1.5">
                {[
                  '让叶片占画面 60% 以上，避免逆光',
                  '拍病害时对准斑点区域，不要整株远景',
                  '一次只识别一盆，避免背景干扰',
                ].map((tip, i) => (
                  <li key={tip} className="flex gap-1.5 text-[10.5px] leading-relaxed text-ink-2">
                    <span className="tabular shrink-0 text-ink-3">0{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}

      {/* 识图历史 */}
      {stage === 'idle' && history.length > 0 && (
        <section className="mt-6 px-4">
          <div className="mb-2.5 flex items-baseline justify-between px-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">识图历史</h2>
            <span className="text-[10.5px] text-ink-3">最近 {Math.min(history.length, 5)} 次</span>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((rec) => (
              <div
                key={rec.id}
                className="flex items-center gap-3 rounded-[18px] border border-line/80 bg-white/70 px-3 py-2.5"
              >
                <img src={asset(rec.image)} alt="" className="h-12 w-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[12.5px] font-medium text-ink">{rec.topName}</p>
                    <span className="tabular text-[10.5px] text-leaf">
                      {Math.round(rec.topConfidence * 100)}%
                    </span>
                    {rec.added && (
                      <span className="rounded-full bg-[#e8f2eb] px-1.5 py-[1px] text-[9px] text-moss">
                        已入库
                      </span>
                    )}
                    {rec.feedback === 'wrong' && (
                      <span className="rounded-full bg-[#f9e2dc] px-1.5 py-[1px] text-[9px] text-[#93372A]">
                        已纠错
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[10px] text-ink-3">
                    {formatDate(rec.at)} · {rec.mode === 'plant' ? '品种' : '病害'}
                    {rec.extraCount > 0 ? ` · ${rec.extraCount + 1} 张` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => rerunFromHistory(rec)}
                    className="press rounded-full border border-line bg-white px-2.5 py-1 text-[10px] text-ink-2"
                  >
                    重识别
                  </button>
                  <button
                    type="button"
                    disabled={rec.feedback === 'wrong'}
                    onClick={() => {
                      updateIdentify(rec.id, { feedback: 'wrong' })
                      toast('已记录误识别，会用于改进匹配')
                    }}
                    className="press rounded-full border border-line bg-white px-2.5 py-1 text-[10px] text-ink-3 disabled:opacity-40"
                  >
                    纠错
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CameraSheet
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(url) => {
          setCameraOpen(false)
          addFromDataUrl(url)
        }}
        onFallback={() => cameraRef.current?.click()}
      />

      <BottomSheet open={sheetOpen} title="加入温室" onClose={() => setSheetOpen(false)}>
        {currentSpecies && (
          <div>
            <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-2.5">
              <img src={asset(preview ?? currentSpecies.image)} alt="" className="h-14 w-14 rounded-xl object-cover" />
              <div>
                <p className="text-[13px] font-medium text-ink">{currentSpecies.name}</p>
                <p className="text-[10.5px] text-ink-3">
                  自动带入养护模板 · 约 {currentSpecies.waterEveryDays} 天浇一次
                </p>
              </div>
            </div>

            <p className="mb-1.5 mt-4 text-[11.5px] text-ink-3">给它起个名字</p>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={12}
              className="w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-leaf/40"
              placeholder={currentSpecies.name}
            />

            <button
              type="button"
              onClick={confirmAdd}
              className="press mt-4 w-full rounded-full bg-moss py-3 text-[13px] font-medium text-white"
            >
              确认加入
            </button>
            <p className="mt-2 text-center text-[10px] text-ink-3">
              加入后按品种习性自动生成浇水与施肥排期
            </p>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

function Chip({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-1 rounded-full bg-[#f2f0e6] px-2 py-[4px] text-[10px] text-ink-2">
      <span className="text-leaf">{icon}</span>
      {text}
    </span>
  )
}
