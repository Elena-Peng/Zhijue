import { useRef, useState } from 'react'
import type { Plant, PlantStatus } from '../data/types'
import { getSpecies } from '../data/species'
import { computeSchedule, computeStatus, formatDate, relativeDay } from '../services/care'
import { StatusBadge } from './StatusBadge'
import { DropletIcon, PlusIcon } from './icons'
import { asset } from '../utils/asset'

/** 扇盘几何：圆心在画布底边中点，向上张开半圆；只排 3 个位（左 / 中 / 右） */
const W = 398
const H = 258
const CX = W / 2
const CY = H
const R_FAN = 202
const R_BAND_IN = 204
const R_BAND_OUT = 224
/** 中间位半径（主植株），两侧位半径 */
const R_CENTER = 164
const R_SIDE = 172
const STEP = 52

const STATUS_COLOR: Record<PlantStatus, string> = {
  healthy: '#3E7C5A',
  watch: '#D9A441',
  alert: '#C0553F',
}

const rad = (deg: number) => (deg * Math.PI) / 180
const px = (a: number, r: number) => CX + r * Math.sin(rad(a))
const py = (a: number, r: number) => CY - r * Math.cos(rad(a))

/** 环形扇区路径（a1→a2 顺时针），r0=0 时为实心扇形 */
function sector(a1: number, a2: number, r: number, r0 = 0): string {
  if (r0 === 0) {
    return `M ${CX} ${CY} L ${px(a1, r)} ${py(a1, r)} A ${r} ${r} 0 0 1 ${px(a2, r)} ${py(a2, r)} Z`
  }
  return `M ${px(a1, r)} ${py(a1, r)} A ${r} ${r} 0 0 1 ${px(a2, r)} ${py(a2, r)} L ${px(a2, r0)} ${py(
    a2,
    r0,
  )} A ${r0} ${r0} 0 0 0 ${px(a1, r0)} ${py(a1, r0)} Z`
}

interface PlantFanProps {
  plants: Plant[]
  activeId: string
  onSelect: (id: string) => void
  onOpen: (id: string) => void
  onAdd: () => void
}

/** 温室转盘：只显示 3 个位，中间为当前主植株，两侧为相邻植株 */
export function PlantFan({ plants, activeId, onSelect, onOpen, onAdd }: PlantFanProps) {
  const activeIndex = Math.max(0, plants.findIndex((p) => p.id === activeId))
  const [drag, setDrag] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startY = useRef(0)
  const moved = useRef(false)
  const horizontal = useRef(false)

  const statusOf = (p: Plant) => computeStatus(p, getSpecies(p.speciesId)).status
  const total = plants.length
  /** 环形偏移：当前为 0，左右为 ±1；总数为 2 时另一株固定放左侧 */
  const offsetOf = (i: number) => {
    if (total <= 2) return i === activeIndex ? 0 : -1
    const raw = (((i - activeIndex) % total) + total) % total
    return raw > total / 2 ? raw - total : raw
  }
  const angleOf = (i: number) => offsetOf(i) * STEP + drag * 0.5
  const visible = (i: number) => Math.abs(offsetOf(i)) <= 1

  const commit = (dx: number) => {
    const steps = Math.round(dx / 84)
    if (steps !== 0) {
      const next = Math.min(plants.length - 1, Math.max(0, activeIndex - steps))
      if (next !== activeIndex) onSelect(plants[next].id)
    }
    setDrag(0)
  }

  return (
    <div
      className="relative mx-auto select-none"
      style={{ width: W, height: H, touchAction: 'pan-y' }}
      role="group"
      aria-label="温室转盘，左右滑动切换植物"
      onPointerDown={(e) => {
        startX.current = e.clientX
        startY.current = e.clientY
        moved.current = false
        horizontal.current = false
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (!dragging) return
        const dx = e.clientX - startX.current
        const dy = e.clientY - startY.current
        // 竖向滚动优先：竖直位移明显大于水平时不算拖动
        if (!horizontal.current && Math.abs(dx) < 8 && Math.abs(dy) > 10) {
          setDragging(false)
          setDrag(0)
          return
        }
        if (Math.abs(dx) > Math.abs(dy) + 6) horizontal.current = true
        if (Math.abs(dx) > 6) moved.current = true
        setDrag(dx)
      }}
      onPointerUp={() => {
        if (!dragging) return
        setDragging(false)
        if (!horizontal.current) {
          setDrag(0)
          return
        }
        commit(drag)
      }}
      onPointerCancel={() => {
        setDragging(false)
        setDrag(0)
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id="fan-surface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#eef4ea" />
            <stop offset="58%" stopColor="#eaf1e3" />
            <stop offset="100%" stopColor="#f6f2e6" />
          </linearGradient>
        </defs>

        {/* 盘面 */}
        <path d={sector(-90, 90, R_FAN)} fill="url(#fan-surface)" />

        {/* 刻度线 */}
        {Array.from({ length: 13 }, (_, i) => -90 + i * 15).map((a) => (
          <line
            key={a}
            x1={px(a, 44)}
            y1={py(a, 44)}
            x2={px(a, R_FAN - 3)}
            y2={py(a, R_FAN - 3)}
            stroke="#3E7C5A"
            strokeWidth={0.8}
            opacity={0.1}
          />
        ))}

        {/* 扇区隔断：三个位之间 */}
        {[-1, 1].map((slot) => {
          const a = slot * STEP
          return (
            <line
              key={`sep-${slot}`}
              x1={px(a, 56)}
              y1={py(a, 56)}
              x2={px(a, R_FAN - 6)}
              y2={py(a, R_FAN - 6)}
              stroke="#2F6047"
              strokeWidth={1}
              opacity={0.14}
            />
          )
        })}

        {/* 扇区盘片 */}
        {plants.map((p, i) => {
          if (!visible(i)) return null
          const a = angleOf(i)
          const active = i === activeIndex
          return (
            <path
              key={`plate-${p.id}`}
              d={sector(a - STEP / 2 + 1.6, a + STEP / 2 - 1.6, R_FAN - 2, 44)}
              fill={active ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.4)'}
              className={dragging ? '' : 'transition-[fill] duration-500'}
            />
          )
        })}

        {/* 状态弧带 */}
        {plants.map((p, i) => {
          if (!visible(i)) return null
          const a = angleOf(i)
          const active = i === activeIndex
          return (
            <path
              key={`band-${p.id}`}
              d={sector(a - STEP / 2 + 1.2, a + STEP / 2 - 1.2, R_BAND_OUT, R_BAND_IN)}
              fill={STATUS_COLOR[statusOf(p)]}
              opacity={active ? 0.9 : 0.42}
              className={dragging ? '' : 'transition-[opacity] duration-500'}
            />
          )
        })}
      </svg>

      {/* 植株位：中间为当前主植株 */}
      {plants.map((p, i) => {
        if (!visible(i)) return null
        const a = angleOf(i)
        const offset = offsetOf(i)
        const active = offset === 0
        const size = active ? 168 : 104
        const r = active ? R_CENTER : R_SIDE
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (moved.current) return
              if (active) onOpen(p.id)
              else onSelect(p.id)
            }}
            className="absolute rounded-full bg-white transition-all ease-out"
            style={{
              left: px(a, r),
              top: py(a, r),
              width: size,
              height: size,
              padding: active ? 4 : 2,
              transform: `translate(-50%,-50%) rotate(${a * 0.16}deg)`,
              transformOrigin: 'center',
              opacity: active ? 1 : 0.8,
              zIndex: active ? 30 : 20,
              transitionDuration: dragging ? '0ms' : '480ms',
              boxShadow: active
                ? `0 20px 38px -16px rgba(47,96,71,.55), 0 0 0 3px ${STATUS_COLOR[statusOf(p)]}`
                : '0 10px 18px -12px rgba(28,38,32,.45)',
            }}
            aria-label={`${p.nickname}${active ? '（当前）' : ''}`}
            aria-pressed={active}
          >
            <img
              src={asset(p.image)}
              alt=""
              className="h-full w-full rounded-full object-cover"
              draggable={false}
            />
          </button>
        )
      })}

      {/* 新增 */}
      <button
        type="button"
        onClick={onAdd}
        className="press absolute flex items-center justify-center rounded-full bg-moss text-white shadow-[0_12px_24px_-10px_rgba(47,96,71,.8)]"
        style={{ left: CX, top: CY - 30, width: 54, height: 54, transform: 'translate(-50%,-50%)', zIndex: 40 }}
        aria-label="添加植物"
      >
        <PlusIcon size={20} />
      </button>
    </div>
  )
}

interface FanGardenCardProps {
  plants: Plant[]
  activeId: string
  reminderTime: string
  onSelect: (id: string) => void
  onAdd: () => void
  onOpen: (id: string) => void
}

/** 首页扇形温室：中间大图即当前植株，扇盘在手机端占满一屏 */
export function FanGardenCard({
  plants,
  activeId,
  reminderTime,
  onSelect,
  onAdd,
  onOpen,
}: FanGardenCardProps) {
  const active = plants.find((p) => p.id === activeId) ?? plants[0]
  const species = getSpecies(active.speciesId)
  const schedule = computeSchedule(active, species)
  const { status, label } = computeStatus(active, species)
  const remain = Math.max(2, Math.min(100, Math.round((1 - schedule.waterRatio) * 100)))

  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[28px]"
      style={{
        background: 'linear-gradient(176deg,#f1f6ec 0%,#f5f3e8 58%,#fbf7ee 100%)',
        boxShadow: '0 24px 48px -34px rgba(47,96,71,.45)',
        minHeight: 'calc(100svh - 356px)',
      }}
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-ink-3">GREENHOUSE</span>
        <p className="text-[10.5px] text-ink-3">
          {plants.length > 1 ? `共 ${plants.length} 盆 · 左右滑动切换` : '只有 1 盆 · 点 ＋ 添新成员'}
        </p>
      </div>

      {/* 扇盘区：占满剩余高度，垂直居中 */}
      <div className="flex flex-1 items-center justify-center">
        <PlantFan
          plants={plants}
          activeId={active.id}
          onSelect={onSelect}
          onOpen={onOpen}
          onAdd={onAdd}
        />
      </div>

      {/* 当前植株信息条 */}
      <div className="px-5 pb-5">
        <div className="flex items-end gap-3">
          <div className="flex w-[48px] shrink-0 flex-col items-center">
            <div className="relative h-[54px] w-[11px] overflow-hidden rounded-full border border-[#dfe4d8] bg-white/80">
              <div
                className="absolute inset-x-[2px] bottom-[2px] rounded-full transition-[height] duration-700"
                style={{
                  height: `${remain}%`,
                  background: 'linear-gradient(180deg,#b7ddce 0%,#4b8a67 100%)',
                }}
              />
            </div>
            <p className="mt-1 text-[10.5px] font-semibold tabular text-ink-2">{remain}%</p>
            <p className="text-[9px] tracking-wide text-ink-3">水量</p>
          </div>

          <button type="button" onClick={() => onOpen(active.id)} className="press min-w-0 flex-1 text-left">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[19px] font-semibold tracking-tight text-ink">{active.nickname}</h2>
              <StatusBadge status={status} label={label} />
            </div>
            <p className="mt-0.5 truncate text-[11px] text-ink-3">{species.name}</p>

            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-ink-2">
              <span className="flex items-center gap-1.5">
                <DropletIcon size={11} className="text-leaf/70" />
                每 {species.waterEveryDays} 天一次
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-[6px] w-[6px] rounded-full bg-[#cdc7b8]" />
                {reminderTime} 提醒
              </span>
            </p>

            <p className="mt-2 inline-flex items-baseline gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[10.5px] text-ink-2">
              <span className="font-semibold text-ink">{relativeDay(schedule.nextWater)}</span>
              <span className="text-ink-3">浇水 · {formatDate(schedule.nextWater)}</span>
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
