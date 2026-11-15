export interface Post {
  id: string
  author: string
  avatarTone: string
  caption: string
  image: string
  aspect: string
  topic: string
  city: string
  likes: number
  comments: number
  following: boolean
}

export const POSTS: Post[] = [
  {
    id: 'c1',
    author: '苔藓小院',
    avatarTone: '#3E7C5A',
    caption: '龟背竹第二片开背叶，从春天等到冬天，值了',
    image: '/images/monstera.jpg',
    aspect: '4 / 5',
    topic: '观叶图鉴',
    city: '杭州',
    likes: 328,
    comments: 41,
    following: true,
  },
  {
    id: 'c2',
    author: '窗台三平米',
    avatarTone: '#C77B58',
    caption: '阳台角落重新排了个位，光线终于都能照到了',
    image: '/images/balcony.jpg',
    aspect: '1 / 1',
    topic: '阳台改造',
    city: '成都',
    likes: 612,
    comments: 88,
    following: false,
  },
  {
    id: 'c3',
    author: '多肉不肉',
    avatarTone: '#8A6415',
    caption: '入冬前最后一次浸盆，粉边全出来了',
    image: '/images/succulent.jpg',
    aspect: '4 / 5',
    topic: '多肉控',
    city: '上海',
    likes: 245,
    comments: 33,
    following: true,
  },
  {
    id: 'c4',
    author: '阿虎的爸',
    avatarTone: '#5C6B61',
    caption: '出差两周回来，它一点事都没有，耐旱真的省心',
    image: '/images/snake.jpg',
    aspect: '1 / 1',
    topic: '低维护植物',
    city: '深圳',
    likes: 156,
    comments: 19,
    following: false,
  },
  {
    id: 'c5',
    author: '小叶榕',
    avatarTone: '#2F6047',
    caption: '琴叶榕掉叶第 5 天，换到北窗后稳住了，记录一下',
    image: '/images/fiddle.jpg',
    aspect: '3 / 4',
    topic: '急救日记',
    city: '北京',
    likes: 401,
    comments: 64,
    following: true,
  },
  {
    id: 'c6',
    author: '一帆风顺',
    avatarTone: '#8D9A90',
    caption: '白掌又开了一朵，叶子下垂就是提醒我该浇水了',
    image: '/images/peace-lily.jpg',
    aspect: '4 / 5',
    topic: '开花记录',
    city: '广州',
    likes: 289,
    comments: 27,
    following: false,
  },
  {
    id: 'c7',
    author: '绿萝瀑布',
    avatarTone: '#3E7C5A',
    caption: '剪了三段藤去水培，十天冒白根，成就感爆棚',
    image: '/images/pothos.jpg',
    aspect: '3 / 4',
    topic: '扦插交流',
    city: '南京',
    likes: 198,
    comments: 45,
    following: true,
  },
  {
    id: 'c8',
    author: '叶斑观察员',
    avatarTone: '#C0553F',
    caption: '斑点扩散得很快，按菌害方案处理后终于止住了',
    image: '/images/disease-leaf.jpg',
    aspect: '1 / 1',
    topic: '病害求助',
    city: '武汉',
    likes: 133,
    comments: 52,
    following: false,
  },
]

export interface PostComment {
  id: string
  author: string
  avatarTone: string
  text: string
  likes: number
  at: string
}

/** 用户产生的社区数据（持久化在 AppState 里） */
export interface CommunityState {
  /** 我发布的动态 */
  posts: Post[]
  /** 我发出去的评论，按 postId 索引 */
  comments: Record<string, PostComment[]>
  /** 我关注的作者名 */
  follows: string[]
  likedPosts: string[]
  collectedPosts: string[]
}

export function emptyCommunity(): CommunityState {
  return { posts: [], comments: {}, follows: [], likedPosts: [], collectedPosts: [] }
}

/** 帖子详情页评论（演示数据，按 post id 索引） */
export const POST_COMMENTS: Record<string, PostComment[]> = {
  c1: [
    { id: 'm1', author: '窗台三平米', avatarTone: '#C77B58', text: '开背真的需要耐心，我那盆等了快一年', likes: 12, at: '2 小时前' },
    { id: 'm2', author: '多肉不肉', avatarTone: '#8A6415', text: '光照给足，新叶会一片比一片大', likes: 5, at: '1 小时前' },
  ],
  c5: [
    { id: 'm3', author: '小叶榕', avatarTone: '#2F6047', text: '北窗救了我，之前南窗晒得卷边', likes: 18, at: '3 小时前' },
    { id: 'm4', author: '一帆风顺', avatarTone: '#8D9A90', text: '掉叶别慌，稳住位置观察一周', likes: 7, at: '40 分钟前' },
  ],
  c8: [
    { id: 'm5', author: '叶斑观察员', avatarTone: '#C0553F', text: '多菌灵+通风，三天就止住了', likes: 9, at: '5 小时前' },
  ],
}

export const TOPICS = ['全部', '观叶图鉴', '多肉控', '急救日记', '阳台改造', '病害求助']
