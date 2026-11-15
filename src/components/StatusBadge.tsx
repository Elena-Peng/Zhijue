import type { PlantStatus } from '../data/types'

const MAP: Record<PlantStatus, { label: string; color: string; bg: string; dot: string }> = {
  healthy: { label: '健康', color: '#2F6047', bg: 'rgba(232,242,235,0.92)', dot: '#3E7C5A' },
  watch: { label: '需注意', color: '#8A6415', bg: 'rgba(250,240,214,0.94)', dot: '#D9A441' },
  alert: { label: '异常', color: '#93372A', bg: 'rgba(249,226,220,0.94)', dot: '#C0553F' },
}

export function StatusBadge({
  status,
  label,
  size = 'sm',
}: {
  status: PlantStatus
  label?: string
  size?: 'sm' | 'md'
}) {
  const s = MAP[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium backdrop-blur ${
        size === 'sm' ? 'px-2 py-[3px] text-[10px]' : 'px-2.5 py-1 text-[11px]'
      }`}
      style={{ background: s.bg, color: s.color }}
    >
      <span className="h-[5px] w-[5px] rounded-full" style={{ background: s.dot }} />
      {label ?? s.label}
    </span>
  )
}
