import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { getSpecies, DIFFICULTY_LABEL } from '../data/species'
import {
  computeSchedule,
  computeStatus,
  daysSince,
  formatDate,
  relativeDay,
} from '../services/care'
import { ProgressRing } from '../components/ProgressRing'
import { StatusBadge } from '../components/StatusBadge'
import { BottomSheet } from '../components/BottomSheet'
import { useToast } from '../components/Toast'
import {
  AlertIcon,
  CameraIcon,
  ChevronLeftIcon,
  DropletIcon,
  PlusIcon,
  SunIcon,
  TempIcon,
  WindIcon,
} from '../components/icons'
import { asset } from '../utils/asset'

const MILESTONES = ['新叶展开', '长高', '换盆', '开花', '修剪扦插']

export function PlantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const { plants, state, carePlant, addDiary, setIssue } = useGarden()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [note, setNote] = useState('')
  const [milestone, setMilestone] = useState<string | undefined>()

  const plant = plants.find((p) => p.id === id)

  if (!plant) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <p className="text-[14px] text-ink-2">这盆植物不在温室里了</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="press mt-4 rounded-full bg-moss px-5 py-2 text-[12px] text-white"
        >
          回到温室
        </button>
      </div>
    )
  }

  const species = getSpecies(plant.speciesId)
  const schedule = computeSchedule(plant, species)
  const { status, label } = computeStatus(plant, species)
  const careCount = state.logs.filter((l) => l.plantId === plant.id).length
  const ageDays = daysSince(plant.addedAt)

  const handleCare = () => {
    carePlant(plant.id, 'water')
    toast(`已为「${plant.nickname}」浇水，下次 ${species.waterEveryDays} 天后`)
  }

  const handleDiary = () => {
    if (!note.trim()) {
      toast('写一句今天的观察吧')
      return
    }
    addDiary(plant.id, {
      at: new Date().toISOString(),
      note: note.trim(),
      milestone,
      image: plant.image,
    })
    setSheetOpen(false)
    setNote('')
    setMilestone(undefined)
    toast('已记入成长日记')
  }

  return (
    <div className="pb-[104px]">
      {/* Hero */}
      <div className="relative h-[292px] w-full overflow-hidden rounded-b-[32px]">
        <img src={asset(plant.image)} alt={plant.nickname} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,26,20,0.72)] via-[rgba(15,26,20,0.16)] to-[rgba(15,26,20,0.22)]" />

        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => navigate(`/identify?mode=disease&plantId=${plant.id}`)}
          aria-label="识别病害"
          className="press absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-[11.5px] text-white backdrop-blur-md"
        >
          <CameraIcon size={14} />
          拍病叶
        </button>

        <div className="absolute inset-x-0 bottom-0 px-5 pb-4">
          <StatusBadge status={status} label={label} size="md" />
          <h1 className="mt-2 text-[25px] font-semibold tracking-tight text-white">{plant.nickname}</h1>
          <p className="mt-0.5 text-[12px] text-white/70">
            {species.name} · <span className="italic">{species.latin}</span>
          </p>
        </div>
      </div>

      {/* 元信息 */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        {[
          { label: '入库', value: ageDays === 0 ? '今天' : `${ageDays}`, unit: ageDays === 0 ? '' : '天' },
          { label: '打卡', value: `${careCount}`, unit: '次' },
          { label: '难度', value: DIFFICULTY_LABEL[species.difficulty], unit: '' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-line/80 bg-white/75 px-3 py-2.5 text-center">
            <p className="text-[10.5px] tracking-wider text-ink-3">{item.label}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">
              {item.value}
              {item.unit && <span className="ml-0.5 text-[10px] font-normal text-ink-3">{item.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* 养护进度 */}
      <section className="mt-4 px-4">
        <div className="card flex items-center gap-4 px-4 py-4">
          <ProgressRing
            value={schedule.waterRatio}
            size={104}
            stroke={7}
            color={status === 'alert' ? '#C0553F' : status === 'watch' ? '#D9A441' : '#3E7C5A'}
          >
            <span className="text-[9.5px] tracking-wider text-ink-3">下次浇水</span>
            <span
              className="mt-0.5 text-[19px] font-semibold leading-none"
              style={{ color: status === 'alert' ? '#93372A' : status === 'watch' ? '#8A6415' : '#2F6047' }}
            >
              {schedule.daysToWater < 0
                ? '该浇了'
                : schedule.daysToWater === 0
                  ? '今天'
                  : `${schedule.daysToWater}天`}
            </span>
            <span className="mt-1 text-[9.5px] text-ink-3">{formatDate(schedule.nextWater)}</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink">土壤湿度节奏</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-2">{species.water}</p>
            <p className="mt-1 text-[10.5px] text-ink-3">
              上次浇水 {formatDate(plant.lastWateredAt)} · {relativeDay(schedule.nextWater)}
            </p>
            <div className="mt-2.5 flex gap-2">
              <button
                type="button"
                onClick={handleCare}
                className="press flex items-center gap-1.5 rounded-full bg-moss px-3.5 py-1.5 text-[11.5px] font-medium text-white"
              >
                <DropletIcon size={13} />
                浇水打卡
              </button>
              <button
                type="button"
                onClick={() => {
                  carePlant(plant.id, 'fertilize')
                  toast('已记录施肥')
                }}
                className="press rounded-full border border-[#dcd6c8] px-3 py-1.5 text-[11.5px] text-ink-2"
              >
                施肥打卡
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 养护要点 */}
      <section className="mt-5 px-4">
        <h2 className="mb-2.5 px-1 text-[15px] font-semibold tracking-tight text-ink">养护要点</h2>
        <div className="grid grid-cols-2 gap-2">
          <Tip icon={<SunIcon size={14} />} label="光照" value={species.light} />
          <Tip icon={<DropletIcon size={14} />} label="水分" value={`约 ${species.waterEveryDays} 天一次`} />
          <Tip icon={<TempIcon size={14} />} label="温度" value={species.temp} />
          <Tip icon={<WindIcon size={14} />} label="湿度" value={species.humidity} />
        </div>

        {species.toxicLevel !== 'safe' && (
          <div
            className="mt-2 flex items-start gap-2 rounded-[18px] px-3.5 py-3"
            style={{
              background: species.toxicLevel === 'high' ? '#FBEAE2' : '#FBF2DE',
              border: `1px solid ${species.toxicLevel === 'high' ? '#EFD3C7' : '#EEDFBE'}`,
            }}
          >
            <AlertIcon size={15} className={species.toxicLevel === 'high' ? 'text-[#93372A]' : 'text-[#8A6415]'} />
            <div>
              <p className="text-[11.5px] font-semibold text-[#7a3a2b]">
                {species.toxicLevel === 'high' ? '对宠物有毒，请放高处' : '对宠物有轻微刺激'}
              </p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-[#8b6558]">{species.toxic}</p>
            </div>
          </div>
        )}
      </section>

      {/* 成长日记 */}
      <section className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">
            成长日记 <span className="ml-1 text-[11px] font-normal text-ink-3">{plant.diary.length} 条</span>
          </h2>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="press flex items-center gap-1 rounded-full border border-[#dcd6c8] bg-white/70 px-2.5 py-1 text-[11px] text-ink-2"
          >
            <PlusIcon size={12} />
            记一笔
          </button>
        </div>

        <div className="relative pl-1">
          {plant.diary.map((entry, i) => (
            <div key={entry.id} className="relative flex gap-3 pb-4">
              <div className="relative flex w-3 shrink-0 justify-center">
                <span
                  className={`mt-1.5 h-2 w-2 rounded-full ${
                    entry.milestone ? 'bg-clay' : 'bg-[#c8d2c9]'
                  }`}
                />
                {i !== plant.diary.length - 1 && (
                  <span className="absolute top-4 h-[calc(100%-8px)] w-[1px] bg-[#e3ddcf]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="tabular text-[11px] text-ink-3">{formatDate(entry.at)}</p>
                  <p className="text-[10px] text-ink-3">
                    第 {daysSince(plant.addedAt, new Date(entry.at)) + 1} 天
                  </p>
                  {entry.milestone && (
                    <span className="rounded-full bg-[#F7EDE6] px-1.5 py-[2px] text-[9.5px] text-clay">
                      {entry.milestone}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{entry.note}</p>
              </div>
              {entry.image && (
                <img
                  src={asset(entry.image)}
                  alt=""
                  className="h-[54px] w-[54px] shrink-0 rounded-xl object-cover"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 状态标记 */}
      {plant.issue !== 'none' && (
        <div className="mt-2 px-4">
          <div className="flex items-center justify-between rounded-[18px] border border-[#EFD3C7] bg-[#FBEAE2] px-3.5 py-3">
            <div>
              <p className="text-[11.5px] font-semibold text-[#93372A]">已标记为异常</p>
              <p className="mt-0.5 text-[10.5px] text-[#8b6558]">{plant.issueNote ?? '等待你确认病害处理方案'}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIssue(plant.id, 'none')
                toast('已恢复为健康状态')
              }}
              className="press rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#93372A]"
            >
              已处理
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 px-4">
        <button
          type="button"
          onClick={() => navigate('/discover')}
          className="press flex w-full items-center justify-between rounded-[18px] border border-line/80 bg-white/70 px-4 py-3"
        >
          <span className="text-[12px] text-ink-2">
            查看「{species.name}」完整养护百科
          </span>
          <span className="text-[11px] text-leaf">去看看</span>
        </button>
      </div>

      <div className="mt-2 px-4">
        <button
          type="button"
          onClick={() => navigate(`/publish?plantId=${plant.id}`)}
          className="press flex w-full items-center justify-between rounded-[18px] border border-[#e4d5c9] bg-[#fbf4ee] px-4 py-3"
        >
          <span className="text-[12px] text-ink-2">把这盆的长势晒到社区</span>
          <span className="text-[11px] text-clay">去发帖</span>
        </button>
      </div>

      <BottomSheet open={sheetOpen} title="记一笔" onClose={() => setSheetOpen(false)}>
        <label className="mb-2 block text-[11.5px] text-ink-3">今天的观察</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="比如：新叶展开了半片，叶色比上周更亮"
          className="w-full resize-none rounded-2xl border border-line bg-white px-3.5 py-3 text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-ink-3 focus:border-leaf/40"
        />
        <p className="mb-2 mt-4 text-[11.5px] text-ink-3">里程碑（选填）</p>
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMilestone(milestone === m ? undefined : m)}
              className={`press rounded-full border px-3 py-1.5 text-[11.5px] ${
                milestone === m
                  ? 'border-clay bg-[#F7EDE6] text-clay'
                  : 'border-[#dcd6c8] bg-white text-ink-2'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleDiary}
          className="press mt-5 w-full rounded-full bg-moss py-3 text-[13px] font-medium text-white"
        >
          保存到成长日记
        </button>
      </BottomSheet>
    </div>
  )
}

function Tip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-line/80 bg-white/75 p-3">
      <div className="flex items-center gap-1.5 text-leaf">
        {icon}
        <span className="text-[10.5px] font-medium tracking-wider text-ink-3">{label}</span>
      </div>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink">{value}</p>
    </div>
  )
}
