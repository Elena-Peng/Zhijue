import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TOPICS } from '../data/community'
import { useGarden } from '../store/GardenProvider'
import { CommentIcon, HeartIcon, PinIcon, PlusIcon } from '../components/icons'
import { asset } from '../utils/asset'

type Feed = '推荐' | '关注' | '同城'

const FEEDS: Feed[] = ['推荐', '关注', '同城']

export function Community() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { posts: allPosts, community, toggleLikePost } = useGarden()
  const [feed, setFeed] = useState<Feed>('推荐')
  const [topic, setTopic] = useState('全部')

  const mineOnly = params.get('mine') === '1'
  const savedOnly = params.get('saved') === '1'

  const posts = allPosts.filter((p) => {
    if (mineOnly && p.author !== '我') return false
    if (savedOnly && !community.collectedPosts.includes(p.id)) return false
    if (feed === '关注' && !community.follows.includes(p.author)) return false
    if (feed === '同城' && p.city !== '杭州' && p.city !== '上海') return false
    if (topic !== '全部' && p.topic !== topic) return false
    return true
  })

  return (
    <div className="pb-[104px]">
      <header className="flex items-start justify-between px-5 pb-2 pt-6">
        <div>
          <p className="text-[10.5px] font-medium tracking-[0.16em] text-ink-3">COMMUNITY</p>
          <h1 className="mt-1.5 text-[26px] font-semibold leading-tight tracking-tight text-ink">社区</h1>
          <p className="mt-1 text-[12px] text-ink-2">看看别人家的阳台，也把长势晒出来。</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/publish')}
          className="press mt-1 flex items-center gap-1 rounded-full bg-moss px-3 py-1.5 text-[11.5px] text-white"
        >
          <PlusIcon size={13} />
          发布
        </button>
      </header>

      {(mineOnly || savedOnly) && (
        <div className="mx-4 mt-2 flex items-center justify-between rounded-full border border-[#e4d5c9] bg-[#fbf4ee] px-3.5 py-2">
          <span className="text-[11px] text-ink-2">
            {mineOnly ? '只看我发布的动态' : '只看我收藏的动态'} · {posts.length} 条
          </span>
          <button
            type="button"
            onClick={() => setParams({})}
            className="press text-[11px] text-clay"
          >
            返回全部
          </button>
        </div>
      )}

      <div className="flex gap-5 px-5 pb-1 pt-2">
        {FEEDS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFeed(f)}
            className="relative pb-1.5 text-[13px]"
            aria-current={feed === f ? 'true' : undefined}
          >
            <span className={feed === f ? 'font-semibold text-ink' : 'text-ink-3'}>{f}</span>
            {feed === f && (
              <span className="absolute inset-x-0 -bottom-0.5 mx-auto block h-[3px] w-5 rounded-full bg-leaf" />
            )}
          </button>
        ))}
      </div>

      <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto px-5 pb-1">
        {TOPICS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTopic(t)}
            className={`press shrink-0 rounded-full border px-2.5 py-1 text-[10.5px] ${
              topic === t ? 'border-leaf/40 bg-[#EDF2EA] text-moss' : 'border-[#ded8c9] bg-white/60 text-ink-2'
            }`}
          >
            #{t}
          </button>
        ))}
      </div>

      {posts.length === 0 ? (
        <div className="mt-14 flex flex-col items-center text-center">
          <p className="text-[13px] text-ink-2">
            {mineOnly ? '你还没有发布过动态' : savedOnly ? '收藏夹还是空的' : '这个话题下还没有同城动态'}
          </p>
          <p className="mt-1 text-[11px] text-ink-3">
            {mineOnly
              ? '从温室详情点「晒到社区」，或在社区右上角发布'
              : savedOnly
                ? '在帖子详情里点收藏，就会出现在这里'
                : '换个筛选看看，或等社区冷启动后回来'}
          </p>
        </div>
      ) : (
        <div className="mt-3 columns-2 gap-2.5 px-3 [column-fill:_balance]">
          {posts.map((p) => {
            const isLiked = community.likedPosts.includes(p.id)
            const myComments = community.comments[p.id]?.length ?? 0
            return (
              <article
                key={p.id}
                onClick={() => navigate(`/post/${p.id}`)}
                className="press mb-2.5 break-inside-avoid cursor-pointer overflow-hidden rounded-[18px] bg-white shadow-[0_2px_10px_rgba(47,60,52,0.05)]"
              >
                <div className="relative w-full" style={{ aspectRatio: p.aspect }}>
                  <img src={asset(p.image)} alt={p.caption} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/30 px-1.5 py-[2px] text-[9px] text-white backdrop-blur">
                    #{p.topic}
                  </span>
                </div>
                <div className="px-2.5 pb-2.5 pt-2">
                  <p className="line-clamp-2 text-[11.5px] leading-[1.5] text-ink">{p.caption}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-medium text-white"
                      style={{ background: p.avatarTone }}
                    >
                      {p.author.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[9.5px] text-ink-3">{p.author}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLikePost(p.id)
                      }}
                      className="press flex items-center gap-1 text-[9.5px]"
                      style={{ color: isLiked ? '#C0553F' : '#8D9A90' }}
                      aria-label="点赞"
                    >
                      <HeartIcon size={12} />
                      {p.likes + (isLiked ? 1 : 0)}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[9px] text-ink-3">
                    <span className="flex items-center gap-0.5">
                      <CommentIcon size={10} />
                      {p.comments + myComments}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <PinIcon size={10} />
                      {p.city}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
