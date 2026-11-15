import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, DiaryEntry, IdentifyRecord, Plant, Settings } from '../data/types'
import {
  POSTS,
  type CommunityState,
  type Post,
} from '../data/community'
import { getSpecies } from '../data/species'
import { gardenRepository } from '../services/repository'
import { createInitialState } from '../services/seed'
import { collectTodayTasks, computeStats, type CareTask, type GardenStats } from '../services/care'

interface AddPlantInput {
  speciesId: string
  nickname: string
  image?: string
  addedAt?: string
}

interface GardenContextValue {
  ready: boolean
  state: AppState
  plants: Plant[]
  tasks: CareTask[]
  stats: GardenStats
  history: IdentifyRecord[]
  addPlant: (input: AddPlantInput) => string
  carePlant: (plantId: string, type: 'water' | 'fertilize') => void
  addDiary: (plantId: string, entry: Omit<DiaryEntry, 'id'>) => void
  setIssue: (plantId: string, issue: Plant['issue'], note?: string) => void
  renamePlant: (plantId: string, nickname: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  removePlants: (ids: string[]) => void
  recordIdentify: (record: Omit<IdentifyRecord, 'id' | 'at' | 'feedback' | 'added'>) => string
  updateIdentify: (id: string, patch: Partial<Pick<IdentifyRecord, 'feedback' | 'added'>>) => void
  /** 社区：种子内容 + 我的内容合并后的全量列表 */
  community: CommunityState
  posts: Post[]
  addPost: (input: Omit<Post, 'id' | 'likes' | 'comments' | 'following'>) => string
  toggleFollow: (author: string) => void
  toggleLikePost: (id: string) => void
  toggleCollectPost: (id: string) => void
  addComment: (postId: string, text: string) => void
  resetGarden: () => void
}

const GardenContext = createContext<GardenContextValue | null>(null)

const uid = () => Math.random().toString(36).slice(2, 10)

export function GardenProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    gardenRepository.load().then((loaded) => {
      if (!alive) return
      setState(loaded)
      setReady(true)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    void gardenRepository.save(state)
  }, [state, ready])

  const addPlant = useCallback((input: AddPlantInput) => {
    const species = getSpecies(input.speciesId)
    const now = new Date()
    const plant: Plant = {
      id: `p-${uid()}`,
      speciesId: input.speciesId,
      nickname: input.nickname.trim() || species.name,
      image: input.image || species.image,
      addedAt: input.addedAt ?? now.toISOString(),
      lastWateredAt: now.toISOString(),
      lastFertilizedAt: now.toISOString(),
      issue: 'none',
      reminderOn: true,
      diary: [
        {
          id: uid(),
          at: now.toISOString(),
          note: `从识图加入温室，开始记录「${input.nickname.trim() || species.name}」的成长。`,
          milestone: '入住温室',
          image: input.image || species.image,
        },
      ],
    }
    setState((prev) => ({ ...prev, plants: [plant, ...prev.plants] }))
    return plant.id
  }, [])

  const carePlant = useCallback((plantId: string, type: 'water' | 'fertilize') => {
    const at = new Date().toISOString()
    setState((prev) => ({
      ...prev,
      plants: prev.plants.map((p) =>
        p.id === plantId
          ? {
              ...p,
              lastWateredAt: type === 'water' ? at : p.lastWateredAt,
              lastFertilizedAt: type === 'fertilize' ? at : p.lastFertilizedAt,
              issue: 'none',
              issueNote: undefined,
              // PRD F05 轻量联动：打卡自动生成一条成长记录
              diary: [
                {
                  id: uid(),
                  at,
                  note:
                    type === 'water'
                      ? '浇水打卡完成，土壤湿度重新开始计时。'
                      : '施肥打卡完成，薄肥勤施，别贪多。',
                  milestone: type === 'water' ? '浇水打卡' : '施肥打卡',
                },
                ...p.diary,
              ],
            }
          : p,
      ),
      logs: [...prev.logs, { id: uid(), plantId, type, at, source: 'reminder' }],
    }))
  }, [])

  const addDiary = useCallback((plantId: string, entry: Omit<DiaryEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.map((p) =>
        p.id === plantId ? { ...p, diary: [{ id: uid(), ...entry }, ...p.diary] } : p,
      ),
    }))
  }, [])

  const setIssue = useCallback((plantId: string, issue: Plant['issue'], note?: string) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.map((p) => (p.id === plantId ? { ...p, issue, issueNote: note } : p)),
    }))
  }, [])

  const renamePlant = useCallback((plantId: string, nickname: string) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.map((p) =>
        p.id === plantId ? { ...p, nickname: nickname.trim() || p.nickname } : p,
      ),
    }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const removePlants = useCallback((ids: string[]) => {
    setState((prev) => ({
      ...prev,
      plants: prev.plants.filter((p) => !ids.includes(p.id)),
      logs: prev.logs.filter((l) => !ids.includes(l.plantId)),
    }))
  }, [])

  const recordIdentify = useCallback(
    (record: Omit<IdentifyRecord, 'id' | 'at' | 'feedback' | 'added'>) => {
      const id = uid()
      const entry: IdentifyRecord = {
        ...record,
        id,
        at: new Date().toISOString(),
        feedback: 'none',
        added: false,
      }
      setState((prev) => ({ ...prev, history: [entry, ...prev.history].slice(0, 12) }))
      return id
    },
    [],
  )

  const updateIdentify = useCallback(
    (id: string, patch: Partial<Pick<IdentifyRecord, 'feedback' | 'added'>>) => {
      setState((prev) => ({
        ...prev,
        history: prev.history.map((h) => (h.id === id ? { ...h, ...patch } : h)),
      }))
    },
    [],
  )

  const community = state.community
  const posts = useMemo(() => [...community.posts, ...POSTS], [community.posts])

  const addPost = useCallback(
    (input: Omit<Post, 'id' | 'likes' | 'comments' | 'following'>) => {
      const id = `u${Date.now()}`
      const post: Post = { ...input, id, likes: 0, comments: 0, following: false }
      setState((prev) => ({
        ...prev,
        community: { ...prev.community, posts: [post, ...prev.community.posts] },
      }))
      return id
    },
    [],
  )

  const toggleFollow = useCallback((author: string) => {
    setState((prev) => {
      const has = prev.community.follows.includes(author)
      return {
        ...prev,
        community: {
          ...prev.community,
          follows: has
            ? prev.community.follows.filter((a) => a !== author)
            : [...prev.community.follows, author],
        },
      }
    })
  }, [])

  const toggleLikePost = useCallback((id: string) => {
    setState((prev) => {
      const has = prev.community.likedPosts.includes(id)
      return {
        ...prev,
        community: {
          ...prev.community,
          likedPosts: has
            ? prev.community.likedPosts.filter((x) => x !== id)
            : [...prev.community.likedPosts, id],
        },
      }
    })
  }, [])

  const toggleCollectPost = useCallback((id: string) => {
    setState((prev) => {
      const has = prev.community.collectedPosts.includes(id)
      return {
        ...prev,
        community: {
          ...prev.community,
          collectedPosts: has
            ? prev.community.collectedPosts.filter((x) => x !== id)
            : [...prev.community.collectedPosts, id],
        },
      }
    })
  }, [])

  const addComment = useCallback((postId: string, text: string) => {
    const body = text.trim()
    if (!body) return
    const comment = {
      id: `m${Date.now()}`,
      author: '我',
      avatarTone: '#2F6047',
      text: body,
      likes: 0,
      at: '刚刚',
    }
    setState((prev) => ({
      ...prev,
      community: {
        ...prev.community,
        comments: {
          ...prev.community.comments,
          [postId]: [comment, ...(prev.community.comments[postId] ?? [])],
        },
      },
    }))
  }, [])

  const resetGarden = useCallback(() => {
    void gardenRepository.clear().then(() => {
      const fresh = createInitialState()
      setState(fresh)
    })
  }, [])

  const tasks = useMemo(() => collectTodayTasks(state.plants), [state.plants])
  const stats = useMemo(() => computeStats(state.plants, state.logs), [state.plants, state.logs])

  const value: GardenContextValue = {
    ready,
    state,
    plants: state.plants,
    tasks,
    stats,
    history: state.history,
    addPlant,
    carePlant,
    addDiary,
    setIssue,
    renamePlant,
    updateSettings,
    removePlants,
    recordIdentify,
    updateIdentify,
    community,
    posts,
    addPost,
    toggleFollow,
    toggleLikePost,
    toggleCollectPost,
    addComment,
    resetGarden,
  }

  return <GardenContext.Provider value={value}>{children}</GardenContext.Provider>
}

export function useGarden(): GardenContextValue {
  const ctx = useContext(GardenContext)
  if (!ctx) throw new Error('useGarden 必须在 GardenProvider 内使用')
  return ctx
}
