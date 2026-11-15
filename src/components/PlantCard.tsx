import type { Plant } from '../data/types'
import { getSpecies } from '../data/species'
import { computeSchedule, computeStatus, relativeDay } from '../services/care'
import { StatusBadge } from './StatusBadge'
import { asset } from '../utils/asset'

export function PlantCard({ plant, onClick }: { plant: Plant; onClick: () => void }) {
  const species = getSpecies(plant.speciesId)
  const schedule = computeSchedule(plant, species)
  const { status, label } = computeStatus(plant, species)
  const ratio = Math.min(1, Math.max(0.04, schedule.waterRatio))

  return (
    <button
      type="button"
      onClick={onClick}
      className="press group block w-full text-left"
      aria-label={`${plant.nickname} 详情`}
    >
      <div className="relative overflow-hidden rounded-[18px] bg-[#efece2]">
        <div className="aspect-[4/5] w-full">
          <img
            src={asset(plant.image)}
            alt={plant.nickname}
            className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.04]"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2">
          <StatusBadge status={status} label={label} />
          {schedule.overdue && (
            <span className="rounded-full bg-white/80 px-1.5 py-[3px] text-[9px] font-medium text-[#93372A] backdrop-blur">
              {Math.abs(schedule.daysToWater)} 天未浇
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/38 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2.5">
          <span className="text-[12px] font-medium text-white/95 drop-shadow-sm">{species.name}</span>
        </div>
      </div>

      <div className="mt-2 px-0.5">
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-ink">{plant.nickname}</h3>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-3">
          浇水 · {relativeDay(schedule.nextWater)}
        </p>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#ece7db]">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{
              width: `${ratio * 100}%`,
              background:
                status === 'alert' ? '#C0553F' : status === 'watch' ? '#D9A441' : '#3E7C5A',
            }}
          />
        </div>
      </div>
    </button>
  )
}
