import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { useToast } from '../components/Toast'
import { PlantCard } from '../components/PlantCard'
import { FanGardenCard } from '../components/PlantFan'
import {
  CheckIcon,
  ChevronRightIcon,
  DropletIcon,
  LeafIcon,
  PlusIcon,
  SearchIcon,
  SparkleIcon,
  TrashIcon,
} from '../components/icons'
import { computeStatus, formatFullDate, getGreeting } from '../services/care'
import { getSpecies } from '../data/species'
import type { PlantStatus } from '../data/types'
import { asset } from '../utils/asset'

export function Greenhouse() {
  const { plants, tasks, carePlant, stats, state, removePlants } = useGarden()
  const navigate = useNavigate()
  const toast = useToast()
  const now = new Date()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [view, setView] = useState<'fan' | 'grid'>('fan')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'all' | PlantStatus>('all')
  const [manage, setManage] = useState(false)
  const [picked, setPicked] = useState<string[]>([])

  const counts = plants.reduce(
    (acc, p) => {
      const s = computeStatus(p, getSpecies(p.speciesId), now).status
      acc[s] += 1
      return acc
    },
    { healthy: 0, watch: 0, alert: 0 },
  )

  const subtitle = tasks.length
    ? `有 ${tasks.length} 件事等你，浇完再安心出门`
    : plants.length
      ? `阳台上的 ${plants.length} 位朋友，状态都不错`
      : '温室还空着，从第一盆开始吧'

  // 搜索 + 状态筛选（PRD F03 搜索与分组）
  const visible = useMemo(() => {
    const q = query.trim()
    return plants.filter((p) => {
      const species = getSpecies(p.speciesId)
      const status = computeStatus(p, species, now).status
      const hitQuery = !q || p.nickname.includes(q) || species.name.includes(q) || species.latin.includes(q)
      const hitStatus = filter === 'all' || status === filter
      return hitQuery && hitStatus
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants, query, filter])

  // 默认聚焦最需要照顾的一盆，其次是最新入库的一盆（跟随筛选结果）
  const currentId = useMemo(() => {
    if (activeId && visible.some((p) => p.id === activeId)) return activeId
    const urgent = tasks[0]?.plantId
    if (urgent && visible.some((p) => p.id === urgent)) return urgent
    return visible[visible.length - 1]?.id ?? ''
  }, [activeId, visible, tasks])

  const togglePick = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const pickedTasks = tasks.filter((t) => picked.includes(t.plantId))

  const handleBatchCare = () => {
    if (!pickedTasks.length) {
      toast('选中的植物今天没有到期养护')
      return
    }
    pickedTasks.forEach((t) => carePlant(t.plantId, t.type))
    toast(`已为 ${new Set(pickedTasks.map((t) => t.plantId)).size} 盆完成打卡`)
    setPicked([])
  }

  const handleBatchRemove = () => {
    if (!picked.length) return
    removePlants(picked)
    toast(`已移出 ${picked.length} 盆（记录同步清除）`)
    setPicked([])
    setManage(false)
  }

  const handleAll = () => {
    if (!tasks.length) return
    tasks.forEach((t) => carePlant(t.plantId, t.type))
    toast(`已完成 ${tasks.length} 项养护`)
  }

  return (
    <div className="pb-[104px]">
      {/* 顶部问候 */}
      <header className="relative overflow-hidden px-5 pb-4 pt-6">
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-60 blur-2xl"
          style={{ background: 'radial-gradient(circle,#cfdfd0 0%,rgba(207,223,208,0) 70%)' }}
        />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="tabular text-[10.5px] font-medium tracking-[0.16em] text-ink-3">
              {formatFullDate(now)}
            </p>
            <h1 className="mt-2 text-[27px] font-semibold leading-[1.15] tracking-tight text-ink">
              {getGreeting(now)}，{state.settings.nickname}
            </h1>
            <p className="mt-1.5 text-[12.5px] text-ink-2">{subtitle}</p>
          </div>
          <div
            className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/60 text-leaf shadow-sm backdrop-blur"
            aria-hidden="true"
          >
            <LeafIcon size={20} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-2">
          <Count label="健康" value={counts.healthy} color="#3E7C5A" />
          <span className="h-[3px] w-[3px] rounded-full bg-[#d5cfc1]" />
          <Count label="需注意" value={counts.watch} color="#D9A441" />
          <span className="h-[3px] w-[3px] rounded-full bg-[#d5cfc1]" />
          <Count label="异常" value={counts.alert} color="#C0553F" />
        </div>
      </header>

      {/* 搜索 / 视图 / 批量管理 */}
      <section className="px-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5">
            <SearchIcon size={13} className="text-ink-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索名字或品种"
              className="w-full bg-transparent text-[11.5px] text-ink outline-none placeholder:text-ink-3"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="清空搜索"
                className="press text-[10px] text-ink-3"
              >
                清空
              </button>
            )}
          </div>

          <div className="flex rounded-full bg-[#eee9dd] p-[3px]">
            {(
              [
                ['fan', '转盘'],
                ['grid', '卡片'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded-full px-2.5 py-[3px] text-[10.5px] transition-colors ${
                  view === key ? 'bg-white text-moss shadow-sm' : 'text-ink-3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setManage((m) => !m)
              setPicked([])
            }}
            className={`press rounded-full border px-2.5 py-[5px] text-[10.5px] ${
              manage ? 'border-leaf bg-[#e8f2eb] text-moss' : 'border-line bg-white/70 text-ink-3'
            }`}
          >
            {manage ? '完成' : '管理'}
          </button>
        </div>

        <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
          {(
            [
              ['all', '全部'],
              ['healthy', '健康'],
              ['watch', '需注意'],
              ['alert', '异常'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] transition-colors ${
                filter === key
                  ? 'bg-moss text-white'
                  : 'border border-line bg-white/60 text-ink-2'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-1 shrink-0 self-center text-[10px] text-ink-3">
            {visible.length} / {plants.length} 盆
          </span>
        </div>
      </section>

      {/* 温室主体：转盘 / 卡片墙 */}
      <section className="px-4">
        {plants.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eff3ed] text-leaf">
              <LeafIcon size={26} />
            </div>
            <p className="mt-3 text-[14px] font-medium text-ink">温室还是空的</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
              拍一张照片，认出它、记住它，<br />从此不用凭感觉浇水。
            </p>
            <button
              type="button"
              onClick={() => navigate('/identify')}
              className="press mt-4 rounded-full bg-moss px-5 py-2 text-[12px] font-medium text-white"
            >
              去识别第一盆
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="card flex flex-col items-center px-6 py-8 text-center">
            <p className="text-[13px] font-medium text-ink">没有匹配的植物</p>
            <p className="mt-1 text-[11.5px] text-ink-3">换个关键词，或把筛选切回「全部」</p>
          </div>
        ) : view === 'fan' && !manage ? (
          <FanGardenCard
            plants={visible}
            activeId={currentId}
            reminderTime={state.settings.reminderTime}
            onSelect={setActiveId}
            onAdd={() => navigate('/identify')}
            onOpen={(id) => navigate(`/plant/${id}`)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5">
            {visible.map((plant) => {
              const active = picked.includes(plant.id)
              return (
                <div key={plant.id} className="relative">
                  <div
                    className={active ? 'rounded-[18px] ring-2 ring-leaf/60 ring-offset-2 ring-offset-[#faf6ee]' : ''}
                  >
                    <PlantCard
                      plant={plant}
                      onClick={() =>
                        manage ? togglePick(plant.id) : navigate(`/plant/${plant.id}`)
                      }
                    />
                  </div>
                  {manage && (
                    <span
                      className={`pointer-events-none absolute -left-1 -top-1 grid h-6 w-6 place-items-center rounded-full border ${
                        active
                          ? 'border-leaf bg-leaf text-white'
                          : 'border-line bg-white/90 text-ink-3'
                      }`}
                    >
                      <CheckIcon size={11} />
                    </span>
                  )}
                </div>
              )
            })}
            {!manage && (
              <button
                type="button"
                onClick={() => navigate('/identify')}
                className="press mb-1 flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-[18px] border border-dashed border-[#cdc7b8] bg-white/45 text-ink-3"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-leaf shadow-sm">
                  <PlusIcon size={18} />
                </span>
                <span className="text-[12px] font-medium">添加植物</span>
                <span className="text-[10px] text-ink-3">拍照识别</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 批量操作条 */}
      {manage && (
        <div className="sticky bottom-[92px] z-30 mx-4 mt-4 rounded-2xl border border-line bg-white/92 px-3 py-2.5 shadow-[0_16px_32px_-22px_rgba(28,38,32,.5)] backdrop-blur">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setPicked(picked.length === visible.length ? [] : visible.map((p) => p.id))
              }
              className="press shrink-0 rounded-full border border-line px-2.5 py-1 text-[10.5px] text-ink-2"
            >
              {picked.length === visible.length ? '取消全选' : '全选'}
            </button>
            <p className="tabular min-w-0 flex-1 truncate text-[11px] text-ink-2">
              已选 <span className="font-semibold text-ink">{picked.length}</span> 盆
              {pickedTasks.length > 0 && ` · ${pickedTasks.length} 项到期`}
            </p>
            <button
              type="button"
              disabled={!pickedTasks.length}
              onClick={handleBatchCare}
              className="press flex items-center gap-1 rounded-full bg-moss px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
            >
              <DropletIcon size={12} />
              打卡
            </button>
            <button
              type="button"
              disabled={!picked.length}
              onClick={handleBatchRemove}
              className="press flex items-center gap-1 rounded-full border border-[#e3c8c1] bg-[#fdf1ee] px-3 py-1.5 text-[11px] text-[#93372A] disabled:opacity-40"
            >
              <TrashIcon size={12} />
              移出
            </button>
          </div>
        </div>
      )}

      {/* 今日待办 */}
      <section className="mt-5 px-4">
        <div
          className="grain relative overflow-hidden rounded-[24px] px-4 pb-3.5 pt-4 text-white"
          style={{
            background: 'linear-gradient(158deg,#4b8a67 0%,#35704f 46%,#2c5b43 100%)',
            boxShadow: '0 18px 36px -24px rgba(47,96,71,0.75)',
          }}
        >
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <SparkleIcon size={15} className="text-white/85" />
              <span className="text-[13px] font-semibold tracking-wide">今日待办</span>
            </div>
            <span className="rounded-full bg-white/15 px-2 py-[3px] text-[10.5px] font-medium tabular">
              {tasks.length ? `${tasks.length} 项` : '已清空'}
            </span>
          </div>

          {tasks.length > 0 ? (
            <div className="mt-3 space-y-1">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 rounded-2xl bg-white/10 px-2.5 py-2 backdrop-blur-sm"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/18">
                    <DropletIcon size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{task.nickname}</p>
                    <p className="text-[10.5px] text-white/70">
                      {task.type === 'water' ? '浇水' : '施肥'} ·{' '}
                      {task.daysLate > 0 ? `逾期 ${task.daysLate} 天` : '今天到期'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      carePlant(task.plantId, task.type)
                      toast(`${task.nickname} 已${task.type === 'water' ? '浇水' : '施肥'}`)
                    }}
                    className="press rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-moss"
                  >
                    打卡
                  </button>
                </div>
              ))}
              {tasks.length > 3 && (
                <p className="pl-1 pt-1 text-[10.5px] text-white/60">还有 {tasks.length - 3} 项待办</p>
              )}
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-3">
              <LeafIcon size={16} className="text-white/70" />
              <p className="text-[11.5px] text-white/80">今天没有待办，去看看新叶吧</p>
            </div>
          )}

          {tasks.length > 0 && (
            <button
              type="button"
              onClick={handleAll}
              className="press mt-3 w-full rounded-full border border-white/25 bg-white/12 py-2 text-[12px] font-medium text-white backdrop-blur"
            >
              全部打卡 · {tasks.length} 项
            </button>
          )}
        </div>
      </section>

      {/* 养护提示 */}
      <section className="mt-5 px-4">
        <button
          type="button"
          onClick={() => navigate('/discover')}
          className="press relative block w-full overflow-hidden rounded-[24px] text-left"
        >
          <img src={asset('/images/balcony.jpg')} alt="阳台植物角" className="h-[132px] w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(22,36,28,0.78)] via-[rgba(22,36,28,0.28)] to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10.5px] tracking-[0.14em] text-white/70">本周养护提示</p>
            <p className="mt-1 text-[14px] font-medium leading-snug text-white">
              入冬后把浇水周期拉长 1.5 倍，<br />先摸土，再决定要不要浇
            </p>
          </div>
        </button>
      </section>

      <button
        type="button"
        onClick={() => navigate('/discover')}
        className="press mx-4 mt-4 flex w-[calc(100%-32px)] items-center justify-between rounded-2xl border border-line bg-white/60 px-4 py-3 text-left"
      >
        <div>
          <p className="text-[12.5px] font-medium text-ink">养护百科</p>
          <p className="mt-0.5 text-[10.5px] text-ink-3">6 个常见品种的光照、水分与毒性</p>
        </div>
        <ChevronRightIcon size={15} />
      </button>

      <p className="mt-6 text-center text-[10.5px] tracking-[0.2em] text-ink-3">
        {stats.careCount} 次养护 · 已陪伴 {stats.days} 天
      </p>
    </div>
  )
}

function Count({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: color }} />
      <span>{label}</span>
      <span className="tabular font-semibold text-ink">{value}</span>
    </span>
  )
}
