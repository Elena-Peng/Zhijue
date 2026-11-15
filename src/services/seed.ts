import type { AppState, Plant } from '../data/types'
import { emptyCommunity } from '../data/community'
import { DEFAULT_SETTINGS } from './care'

const id = () => Math.random().toString(36).slice(2, 9)

function ago(days: number, hour = 10): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

export const SEED_PLANTS: Plant[] = [
  {
    id: 'p-monstera',
    speciesId: 'monstera',
    nickname: '大龟',
    image: '/images/monstera.jpg',
    addedAt: ago(86),
    lastWateredAt: ago(3),
    lastFertilizedAt: ago(12),
    issue: 'none',
    reminderOn: true,
    diary: [
      {
        id: id(),
        at: ago(3),
        note: '擦完叶子，气生根又长了一截，插了根水苔柱给它爬。',
        image: '/images/monstera.jpg',
      },
      {
        id: id(),
        at: ago(21),
        note: '第四片开裂的新叶完全展开了。',
        milestone: '新叶展开',
        image: '/images/monstera.jpg',
        heightCm: 92,
      },
      {
        id: id(),
        at: ago(86),
        note: '从花市带回家，换了个 24cm 的陶盆。',
        milestone: '入住温室',
        image: '/images/monstera.jpg',
        heightCm: 68,
      },
    ],
  },
  {
    id: 'p-pothos',
    speciesId: 'pothos',
    nickname: '小绿萝',
    image: '/images/pothos.jpg',
    addedAt: ago(42),
    lastWateredAt: ago(6),
    lastFertilizedAt: ago(26),
    issue: 'none',
    reminderOn: true,
    diary: [
      {
        id: id(),
        at: ago(14),
        note: '剪了三段藤去水培，已经冒白根了。',
        milestone: '扦插生根',
        image: '/images/pothos.jpg',
      },
      {
        id: id(),
        at: ago(42),
        note: '同事送的，挂在书桌旁的置物架上。',
        milestone: '入住温室',
        image: '/images/pothos.jpg',
      },
    ],
  },
  {
    id: 'p-succulent',
    speciesId: 'succulent',
    nickname: '桃蛋',
    image: '/images/succulent.jpg',
    addedAt: ago(120),
    lastWateredAt: ago(20),
    lastFertilizedAt: ago(55),
    issue: 'none',
    reminderOn: true,
    diary: [
      {
        id: id(),
        at: ago(20),
        note: '浸盆十分钟，叶片饱满起来了，粉边很明显。',
        image: '/images/succulent.jpg',
      },
      {
        id: id(),
        at: ago(120),
        note: '阳台最晒的位置留给它。',
        milestone: '入住温室',
        image: '/images/succulent.jpg',
      },
    ],
  },
  {
    id: 'p-snake',
    speciesId: 'snake',
    nickname: '阿虎',
    image: '/images/snake.jpg',
    addedAt: ago(15),
    lastWateredAt: ago(2),
    lastFertilizedAt: ago(15),
    issue: 'none',
    reminderOn: true,
    diary: [
      {
        id: id(),
        at: ago(15),
        note: '放在玄关，出差两周也不担心。',
        milestone: '入住温室',
        image: '/images/snake.jpg',
      },
    ],
  },
]

export function createInitialState(): AppState {
  return {
    version: 2,
    plants: SEED_PLANTS,
    logs: [
      { id: id(), plantId: 'p-monstera', type: 'water', at: ago(3), source: 'reminder' },
      { id: id(), plantId: 'p-snake', type: 'water', at: ago(2), source: 'manual' },
      { id: id(), plantId: 'p-succulent', type: 'water', at: ago(20), source: 'reminder' },
      { id: id(), plantId: 'p-pothos', type: 'water', at: ago(6), source: 'reminder' },
      { id: id(), plantId: 'p-monstera', type: 'fertilize', at: ago(12), source: 'manual' },
    ],
    settings: DEFAULT_SETTINGS,
    history: [],
    community: emptyCommunity(),
  }
}
