import type { AppState } from '../data/types'
import { POSTS } from '../data/community'
import { createInitialState } from './seed'

const STORAGE_KEY = 'zhijue.state.v1'

/** 首次启动时，把种子内容里「已关注」的作者写进关注列表 */
const SEED_FOLLOWS = POSTS.filter((p) => p.following).map((p) => p.author)

/**
 * 数据访问层：UI 只依赖这个接口，后续接后端只需替换实现，
 * 数据模型与组件不必改动（对应 PRD 非功能需求「离线可用 + 联网同步」）。
 */
export interface GardenRepository {
  load(): Promise<AppState>
  save(state: AppState): Promise<void>
  clear(): Promise<void>
}

function normalize(raw: unknown): AppState {
  const base = createInitialState()
  if (!raw || typeof raw !== 'object') return base
  const data = raw as Partial<AppState>
  return {
    version: 2,
    plants: Array.isArray(data.plants) ? data.plants : base.plants,
    logs: Array.isArray(data.logs) ? data.logs : base.logs,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    history: Array.isArray(data.history) ? data.history.slice(0, 12) : [],
    community: {
      posts: Array.isArray(data.community?.posts) ? data.community.posts : [],
      comments: data.community?.comments && typeof data.community.comments === 'object'
        ? data.community.comments
        : {},
      follows: Array.isArray(data.community?.follows)
        ? data.community.follows
        : SEED_FOLLOWS,
      likedPosts: Array.isArray(data.community?.likedPosts) ? data.community.likedPosts : [],
      collectedPosts: Array.isArray(data.community?.collectedPosts)
        ? data.community.collectedPosts
        : [],
    },
  }
}

export class LocalGardenRepository implements GardenRepository {
  async load(): Promise<AppState> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const initial = createInitialState()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
        return initial
      }
      return normalize(JSON.parse(raw))
    } catch {
      return createInitialState()
    }
  }

  async save(state: AppState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* 配额不足时静默降级，界面仍可用 */
    }
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/** 预留：配置 VITE_API_BASE 后切换到服务端持久化 */
export class HttpGardenRepository implements GardenRepository {
  constructor(private readonly baseUrl: string) {}

  private get ready(): boolean {
    return Boolean(this.baseUrl)
  }

  async load(): Promise<AppState> {
    if (!this.ready) throw new Error('VITE_API_BASE 未配置')
    const res = await fetch(`${this.baseUrl}/garden`, { credentials: 'include' })
    if (!res.ok) throw new Error(`加载失败 ${res.status}`)
    return normalize(await res.json())
  }

  async save(state: AppState): Promise<void> {
    if (!this.ready) throw new Error('VITE_API_BASE 未配置')
    await fetch(`${this.baseUrl}/garden`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(state),
    })
  }

  async clear(): Promise<void> {
    if (!this.ready) return
    await fetch(`${this.baseUrl}/garden`, { method: 'DELETE', credentials: 'include' })
  }
}

export const gardenRepository: GardenRepository = new LocalGardenRepository()
