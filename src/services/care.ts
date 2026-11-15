import type { CareLog, Plant, Settings, Species } from '../data/types'
import { getSpecies } from '../data/species'

export const DAY = 86_400_000

export function dayIndex(input: Date | string | number): number {
  const d = new Date(input)
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / DAY)
}

export function addDays(input: Date | string | number, days: number): Date {
  const d = new Date(input)
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function daysUntil(target: Date | string, from: Date = new Date()): number {
  return dayIndex(target) - dayIndex(from)
}

export function daysSince(input: Date | string, from: Date = new Date()): number {
  return dayIndex(from) - dayIndex(input)
}

export function formatDate(input: Date | string): string {
  const d = new Date(input)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatFullDate(input: Date | string): string {
  const d = new Date(input)
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 · 周${week}`
}

export function relativeDay(input: Date | string): string {
  const diff = daysUntil(input)
  if (diff === 0) return '今天'
  if (diff === 1) return '明天'
  if (diff === 2) return '后天'
  if (diff > 0) return `${diff} 天后`
  if (diff === -1) return '逾期 1 天'
  return `逾期 ${Math.abs(diff)} 天`
}

export interface CareSchedule {
  nextWater: Date
  nextFertilize: Date
  daysToWater: number
  daysToFertilize: number
  /** 当前浇水周期进度 0–1 */
  waterRatio: number
  overdue: boolean
}

export function computeSchedule(plant: Plant, species: Species, now = new Date()): CareSchedule {
  const nextWater = addDays(plant.lastWateredAt, species.waterEveryDays)
  const nextFertilize = addDays(plant.lastFertilizedAt, species.fertilizeEveryDays)
  const daysToWater = daysUntil(nextWater, now)
  const daysToFertilize = daysUntil(nextFertilize, now)
  const elapsed = Math.max(0, daysSince(plant.lastWateredAt, now))
  const ratio = Math.min(1, elapsed / species.waterEveryDays)
  return {
    nextWater,
    nextFertilize,
    daysToWater,
    daysToFertilize,
    waterRatio: ratio,
    overdue: daysToWater < 0,
  }
}

/** PRD 7.3 状态模型：健康 / 需注意 / 异常 */
export function computeStatus(plant: Plant, species: Species, now = new Date()): {
  status: 'healthy' | 'watch' | 'alert'
  label: string
} {
  if (plant.issue === 'alert') return { status: 'alert', label: '异常' }
  const s = computeSchedule(plant, species, now)
  if (plant.issue === 'watch' || s.daysToWater <= 1) return { status: 'watch', label: '需注意' }
  return { status: 'healthy', label: '健康' }
}

export type TaskType = 'water' | 'fertilize'

export interface CareTask {
  id: string
  plantId: string
  nickname: string
  speciesId: string
  image: string
  type: TaskType
  daysLate: number
}

/** 今日待办：当天到期或已逾期且开启提醒的植物 */
export function collectTodayTasks(plants: Plant[], now = new Date()): CareTask[] {
  const tasks: CareTask[] = []
  for (const plant of plants) {
    if (!plant.reminderOn) continue
    const species = getSpecies(plant.speciesId)
    const s = computeSchedule(plant, species, now)
    if (s.daysToWater <= 0) {
      tasks.push({
        id: `${plant.id}-water`,
        plantId: plant.id,
        nickname: plant.nickname,
        speciesId: plant.speciesId,
        image: plant.image,
        type: 'water',
        daysLate: -s.daysToWater,
      })
    }
    if (s.daysToFertilize <= 0) {
      tasks.push({
        id: `${plant.id}-fertilize`,
        plantId: plant.id,
        nickname: plant.nickname,
        speciesId: plant.speciesId,
        image: plant.image,
        type: 'fertilize',
        daysLate: -s.daysToFertilize,
      })
    }
  }
  return tasks.sort((a, b) => b.daysLate - a.daysLate)
}

export interface GardenStats {
  plants: number
  days: number
  careCount: number
  diaryCount: number
  survivalRate: number
}

export function computeStats(plants: Plant[], logs: CareLog[], now = new Date()): GardenStats {
  const days = plants.length
    ? Math.max(...plants.map((p) => Math.max(1, daysSince(p.addedAt, now))))
    : 0
  const healthy = plants.filter((p) => computeStatus(p, getSpecies(p.speciesId), now).status !== 'alert').length
  return {
    plants: plants.length,
    days,
    careCount: logs.length,
    diaryCount: plants.reduce((sum, p) => sum + p.diary.length, 0),
    survivalRate: plants.length ? Math.round((healthy / plants.length) * 100) : 100,
  }
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

export const getGreeting = greeting

export const DEFAULT_SETTINGS: Settings = {
  nickname: '晓娇',
  reminderOn: true,
  reminderTime: '09:30',
  quietStart: '22:00',
  quietEnd: '08:00',
}
