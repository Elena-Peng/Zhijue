export type CareType = 'water' | 'fertilize' | 'light'

export type ToxicLevel = 'safe' | 'mild' | 'high'

/** 品种养护模板（对应 PRD 14.1「养护模板」） */
export interface Species {
  id: string
  name: string
  alias?: string
  latin: string
  family: string
  image: string
  difficulty: 1 | 2 | 3
  light: string
  water: string
  /** 默认浇水周期（天） */
  waterEveryDays: number
  /** 默认施肥周期（天） */
  fertilizeEveryDays: number
  temp: string
  humidity: string
  toxic: string
  toxicLevel: ToxicLevel
  propagation: string
  summary: string
  tips: string[]
  tags: string[]
}

export interface DiaryEntry {
  id: string
  /** ISO 时间 */
  at: string
  note: string
  milestone?: string
  image?: string
  heightCm?: number
}

/** 温室状态（对应 PRD 7.3 状态模型） */
export type PlantStatus = 'healthy' | 'watch' | 'alert'

export interface Plant {
  id: string
  speciesId: string
  nickname: string
  image: string
  /** 入库时间 ISO */
  addedAt: string
  lastWateredAt: string
  lastFertilizedAt: string
  /** 人工/病害标记 */
  issue: 'none' | 'watch' | 'alert'
  issueNote?: string
  diary: DiaryEntry[]
  reminderOn: boolean
}

export interface CareLog {
  id: string
  plantId: string
  type: CareType
  at: string
  /** reminder 打卡 / manual 手动 */
  source: 'reminder' | 'manual'
}

export interface Settings {
  nickname: string
  reminderOn: boolean
  reminderTime: string
  quietStart: string
  quietEnd: string
}

import type { CommunityState } from './community'

export interface AppState {
  version: number
  plants: Plant[]
  logs: CareLog[]
  settings: Settings
  /** 识图历史（PRD F01：重识别 / 误识别反馈） */
  history: IdentifyRecord[]
  /** 社区（发布 / 评论 / 关注 / 点赞 / 收藏） */
  community: CommunityState
}

/** 一次识别记录 */
export interface IdentifyRecord {
  id: string
  at: string
  mode: 'plant' | 'disease'
  /** 主图（压缩后的 dataURL 或品种图） */
  image: string
  /** 补充图张数（全株 / 局部 / 背面） */
  extraCount: number
  topName: string
  topConfidence: number
  speciesId?: string
  /** 是否已加入温室 */
  added: boolean
  /** 用户反馈：误识别 */
  feedback: 'none' | 'wrong'
}

export interface IdentifyCandidate {
  speciesId: string
  name: string
  latin: string
  image: string
  confidence: number
  brief: string
}

export interface IdentifyOutcome {
  candidates: IdentifyCandidate[]
  /** 低于 0.6 时前端引导重拍/手动选择（PRD 7.1） */
  needRetake: boolean
  tookMs: number
  /** 这段结论由哪些画面证据支撑（本地视觉特征） */
  basis?: string[]
  engine?: 'local-vision' | 'remote-model'
}

export interface DiseaseCondition {
  id: string
  name: string
  probability: number
  urgency: 'high' | 'medium' | 'low'
  cause: string
  steps: string[]
  prevention: string[]
}

export interface DiseaseOutcome {
  conditions: DiseaseCondition[]
  urgency: 'high' | 'medium' | 'low'
  disclaimer: string
  basis?: string[]
  engine?: 'local-vision' | 'remote-model'
  tookMs?: number
}
