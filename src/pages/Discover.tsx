import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SPECIES, DIFFICULTY_LABEL } from '../data/species'
import { ChevronRightIcon, DropletIcon, LeafIcon, SunIcon } from '../components/icons'
import { asset } from '../utils/asset'

const FILTERS = ['全部', '新手友好', '观叶', '多肉', '开花', '有宠家庭'] as const
type Filter = (typeof FILTERS)[number]

const TIPS = [
  {
    title: '浇水之前，先摸土',
    body: '手指插入土中 2cm，干到手背没有凉意再浇，比按日期浇水更可靠。',
  },
  {
    title: '入冬后周期拉长',
    body: '气温低于 15℃ 时，多数植物代谢变慢，浇水间隔可以延长 1.5 倍。',
  },
  {
    title: '黄叶先看位置',
    body: '底部老叶单片发黄是正常代谢；新叶发黄或大面积黄化才需要干预。',
  },
]

export function Discover() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<Filter>('全部')

  const list = useMemo(() => {
    if (filter === '全部') return SPECIES
    if (filter === '新手友好') return SPECIES.filter((s) => s.difficulty === 1)
    if (filter === '有宠家庭') return SPECIES.filter((s) => s.toxicLevel === 'safe')
    return SPECIES.filter((s) => s.tags.includes(filter))
  }, [filter])

  return (
    <div className="pb-[104px]">
      <header className="px-5 pb-2 pt-6">
        <p className="text-[10.5px] font-medium tracking-[0.16em] text-ink-3">DISCOVER</p>
        <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-ink">发现</h1>
        <p className="mt-1 text-[12px] text-ink-2">按品种查养护卡，先看习性，再决定养不养。</p>
      </header>

      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`press shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] transition-colors ${
              filter === f
                ? 'border-moss bg-moss text-white'
                : 'border-[#ded8c9] bg-white/60 text-ink-2'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="mt-4 space-y-2.5 px-4">
        {list.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => navigate(`/species/${s.id}`)}
            className="press card flex w-full items-center gap-3.5 p-2.5 text-left"
          >
            <img src={asset(s.image)} alt={s.name} className="h-[78px] w-[78px] shrink-0 rounded-[16px] object-cover" loading="lazy" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">{s.name}</h3>
                {s.toxicLevel === 'safe' ? (
                  <span className="rounded-full bg-[#EDF4EE] px-1.5 py-[1px] text-[9px] text-leaf">宠物友好</span>
                ) : (
                  <span className="rounded-full bg-[#FBF2DE] px-1.5 py-[1px] text-[9px] text-[#8A6415]">有宠慎养</span>
                )}
              </div>
              <p className="truncate text-[10.5px] italic text-ink-3">{s.latin} · {s.family}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] text-ink-2">
                <span className="flex items-center gap-1 rounded-full bg-[#f3f1e7] px-1.5 py-[2px]">
                  <SunIcon size={10} className="text-leaf" />
                  {s.light.split('，')[0]}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#f3f1e7] px-1.5 py-[2px]">
                  <DropletIcon size={10} className="text-leaf" />
                  {s.waterEveryDays} 天
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#f3f1e7] px-1.5 py-[2px]">
                  {DIFFICULTY_LABEL[s.difficulty]}
                </span>
              </div>
            </div>
            <ChevronRightIcon size={16} className="shrink-0 text-ink-3" />
          </button>
        ))}
      </section>

      <section className="mt-7 px-4">
        <div className="mb-2.5 flex items-center gap-1.5 px-1">
          <LeafIcon size={15} className="text-leaf" />
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">新手三课</h2>
        </div>
        <div className="space-y-2">
          {TIPS.map((tip, i) => (
            <div key={tip.title} className="rounded-[18px] border border-line/80 bg-white/70 px-4 py-3">
              <p className="text-[10.5px] tracking-[0.12em] text-ink-3">0{i + 1}</p>
              <p className="mt-1 text-[13px] font-medium text-ink">{tip.title}</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
