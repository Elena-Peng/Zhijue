import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TOPICS } from '../data/community'
import { useGarden } from '../store/GardenProvider'
import { useToast } from '../components/Toast'
import { fileToDataUrl } from '../utils/image'
import { getSpecies } from '../data/species'
import { CameraIcon, ChevronLeftIcon } from '../components/icons'
import { asset } from '../utils/asset'

const CITIES = ['杭州', '上海', '成都', '深圳', '北京', '广州', '南京', '武汉', '其他']
const TOPIC_OPTS = TOPICS.filter((t) => t !== '全部')

export function Publish() {
  const navigate = useNavigate()
  const toast = useToast()
  const { plants, addPost } = useGarden()
  const [params] = useSearchParams()
  const plantId = params.get('plantId')
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [image, setImage] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [topic, setTopic] = useState('观叶图鉴')
  const [city, setCity] = useState('杭州')

  // 从植物详情「晒到社区」进来：预填照片与文案
  useEffect(() => {
    if (!plantId) return
    const plant = plants.find((p) => p.id === plantId)
    if (!plant) return
    const species = getSpecies(plant.speciesId)
    const days = Math.max(
      1,
      Math.floor((Date.now() - new Date(plant.addedAt).getTime()) / 86400000) + 1,
    )
    setImage((cur) => cur ?? plant.image)
    setCaption((cur) => cur || `${plant.nickname} · ${species.name}，入伙第 ${days} 天，长势记录一下`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId, plants])

  const pick = async (files: FileList | null) => {
    if (!files?.length) return
    try {
      const url = await fileToDataUrl(files[0])
      setImage(url)
    } catch {
      toast('图片读取失败')
    }
  }

  const canPublish = !!image && caption.trim().length > 0

  const publish = () => {
    if (!canPublish) {
      toast('加一张图、写一句话再发布吧')
      return
    }
    const id = addPost({
      author: '我',
      avatarTone: '#2F6047',
      caption: caption.trim(),
      image: image!,
      aspect: '4 / 5',
      topic,
      city,
    })
    toast('已发布到社区')
    navigate(`/post/${id}`)
  }

  return (
    <div className="pb-[104px]">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-[rgba(250,246,238,0.92)] px-4 pb-3 pt-5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-2 shadow-sm"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[16px] font-semibold tracking-tight text-ink">发布动态</h1>
        <button
          type="button"
          onClick={publish}
          disabled={!canPublish}
          className="press rounded-full bg-moss px-4 py-1.5 text-[12.5px] font-medium text-white disabled:opacity-40"
        >
          发布
        </button>
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
        className="hidden"
        onChange={(e) => {
          void pick(e.target.files)
          e.target.value = ''
        }}
      />

      <section className="px-4 pt-2">
        {/* 图片 */}
        {image ? (
          <div className="relative overflow-hidden rounded-[22px] border border-line/80">
            <div className="relative aspect-[4/5] w-full">
              <img src={asset(image)} alt="待发布" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImage(null)}
                className="press absolute right-2.5 top-2.5 rounded-full bg-black/35 px-2.5 py-1 text-[10.5px] text-white backdrop-blur"
              >
                重选
              </button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => galleryRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') galleryRef.current?.click()
            }}
            className="press flex w-full cursor-pointer flex-col items-center gap-2 rounded-[22px] border border-dashed border-[#cdc7b8] bg-white/60 px-6 py-8 text-center"
          >
            <span
              className="grid h-14 w-14 place-items-center rounded-full text-white"
              style={{ background: 'linear-gradient(160deg,#4c8f6a,#2f6047)' }}
            >
              <CameraIcon size={24} />
            </span>
            <p className="text-[13.5px] font-medium text-ink">添加一张植物照片</p>
            <p className="text-[11px] text-ink-3">点此从相册选择，或直接</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                cameraRef.current?.click()
              }}
              className="rounded-full border border-[#ded8c9] bg-white px-3.5 py-1.5 text-[11.5px] text-ink-2"
            >
              拍一张
            </button>
          </div>
        )}

        {/* 文案 */}
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          rows={3}
          maxLength={140}
          placeholder="这一刻，植物怎么样？分享你的养护心得或长势～"
          className="mt-3 w-full resize-none rounded-[18px] border border-line bg-white px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-leaf/40"
        />
        <p className="mt-1 text-right text-[10px] text-ink-3">{caption.length}/140</p>

        {/* 话题 */}
        <p className="mb-2 mt-4 px-1 text-[11.5px] text-ink-3">选择话题</p>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {TOPIC_OPTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={`press shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] ${
                topic === t ? 'border-moss bg-moss text-white' : 'border-[#ded8c9] bg-white/60 text-ink-2'
              }`}
            >
              #{t}
            </button>
          ))}
        </div>

        {/* 城市 */}
        <p className="mb-2 mt-5 px-1 text-[11.5px] text-ink-3">所在城市（用于同城流）</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`press rounded-full border px-3 py-1.5 text-[11.5px] ${
                city === c ? 'border-leaf/40 bg-[#EDF2EA] text-moss' : 'border-[#ded8c9] bg-white/60 text-ink-2'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={publish}
          disabled={!canPublish}
          className="press mt-7 w-full rounded-full bg-moss py-3 text-[13.5px] font-medium text-white disabled:opacity-40"
        >
          发布到社区
        </button>
        <p className="mt-2 text-center text-[10.5px] text-ink-3">发布后会在「推荐」与「同城」流中展示</p>
      </section>
    </div>
  )
}
