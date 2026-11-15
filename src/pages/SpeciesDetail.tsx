import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { getSpecies, DIFFICULTY_LABEL } from '../data/species'
import { useToast } from '../components/Toast'
import { BottomSheet } from '../components/BottomSheet'
import {
  AlertIcon,
  ChevronLeftIcon,
  DropletIcon,
  LeafIcon,
  SunIcon,
  TempIcon,
  WindIcon,
} from '../components/icons'
import { asset } from '../utils/asset'

export function SpeciesDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { addPlant } = useGarden()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [nickname, setNickname] = useState('')

  const species = getSpecies(id ?? '')

  const confirm = () => {
    const newId = addPlant({
      speciesId: species.id,
      nickname: nickname.trim() || species.name,
      image: species.image,
    })
    setSheetOpen(false)
    toast('已加入温室')
    navigate(`/plant/${newId}`)
  }

  return (
    <div className="pb-[104px]">
      <div className="relative h-[264px] w-full overflow-hidden rounded-b-[32px]">
        <img src={asset(species.image)} alt={species.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,26,20,0.7)] via-transparent to-[rgba(15,26,20,0.18)]" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <span className="rounded-full bg-white/20 px-2 py-[3px] text-[10px] text-white backdrop-blur">
            {DIFFICULTY_LABEL[species.difficulty]}
          </span>
          <h1 className="mt-1.5 text-[24px] font-semibold tracking-tight text-white">{species.name}</h1>
          <p className="mt-0.5 text-[11.5px] text-white/75">
            <span className="italic">{species.latin}</span> · {species.family}
          </p>
        </div>
      </div>

      <section className="px-4 pt-4">
        <p className="text-[12.5px] leading-relaxed text-ink-2">{species.summary}</p>
      </section>

      <section className="mt-4 px-4">
        <div className="card divide-y divide-[#efeadd] px-4 py-1">
          <Row icon={<SunIcon size={15} />} label="光照" value={species.light} />
          <Row icon={<DropletIcon size={15} />} label="水分" value={species.water} />
          <Row icon={<TempIcon size={15} />} label="温度" value={species.temp} />
          <Row icon={<WindIcon size={15} />} label="湿度" value={species.humidity} />
          <Row icon={<LeafIcon size={15} />} label="繁殖" value={species.propagation} />
        </div>
      </section>

      <section
        className="mx-4 mt-3 flex items-start gap-2 rounded-[18px] px-3.5 py-3"
        style={{
          background: species.toxicLevel === 'safe' ? '#EDF4EE' : species.toxicLevel === 'high' ? '#FBEAE2' : '#FBF2DE',
          border: `1px solid ${species.toxicLevel === 'safe' ? '#D3E5D6' : species.toxicLevel === 'high' ? '#EFD3C7' : '#EEDFBE'}`,
        }}
      >
        {species.toxicLevel === 'safe' ? (
          <LeafIcon size={15} className="mt-[1px] text-leaf" />
        ) : (
          <AlertIcon size={15} className="mt-[1px] text-[#93372A]" />
        )}
        <div>
          <p className="text-[11.5px] font-semibold text-ink">毒性提示</p>
          <p className="mt-0.5 text-[10.5px] leading-relaxed text-ink-2">{species.toxic}</p>
        </div>
      </section>

      <section className="mt-5 px-4">
        <h2 className="mb-2 px-1 text-[15px] font-semibold tracking-tight text-ink">养护提醒</h2>
        <div className="space-y-2">
          {species.tips.map((tip, i) => (
            <div key={tip} className="flex gap-2.5 rounded-[16px] bg-white/55 px-3.5 py-2.5">
              <span className="tabular mt-[1px] text-[10px] text-ink-3">0{i + 1}</span>
              <p className="text-[11.5px] leading-relaxed text-ink-2">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="px-4 pt-5">
        <div className="flex items-center justify-between rounded-[18px] border border-line/80 bg-white/70 px-4 py-3">
          <div>
            <p className="text-[11.5px] text-ink-2">默认排期</p>
            <p className="mt-0.5 text-[13px] font-medium text-ink">
              每 {species.waterEveryDays} 天浇水 · 每 {species.fertilizeEveryDays} 天施肥
            </p>
          </div>
          <span className="text-[10px] text-ink-3">可微调</span>
        </div>
      </div>

      <div className="mt-5 px-4">
        <button
          type="button"
          onClick={() => {
            setNickname(species.name)
            setSheetOpen(true)
          }}
          className="press w-full rounded-full bg-moss py-3 text-[13px] font-medium text-white"
        >
          加入温室
        </button>
      </div>

      <BottomSheet open={sheetOpen} title="加入温室" onClose={() => setSheetOpen(false)}>
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-white/80 p-2.5">
          <img src={asset(species.image)} alt="" className="h-14 w-14 rounded-xl object-cover" />
          <div>
            <p className="text-[13px] font-medium text-ink">{species.name}</p>
            <p className="text-[10.5px] text-ink-3">自动带入养护模板 · 约 {species.waterEveryDays} 天浇一次</p>
          </div>
        </div>
        <p className="mb-1.5 mt-4 text-[11.5px] text-ink-3">给它起个名字</p>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={12}
          className="w-full rounded-2xl border border-line bg-white px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-leaf/40"
        />
        <button
          type="button"
          onClick={confirm}
          className="press mt-4 w-full rounded-full bg-moss py-3 text-[13px] font-medium text-white"
        >
          确认加入
        </button>
      </BottomSheet>
    </div>
  )
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="mt-[2px] text-leaf">{icon}</span>
      <span className="w-8 shrink-0 text-[11.5px] text-ink-3">{label}</span>
      <span className="flex-1 text-[11.5px] leading-relaxed text-ink">{value}</span>
    </div>
  )
}
