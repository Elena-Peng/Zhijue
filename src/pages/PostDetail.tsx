import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { POST_COMMENTS } from '../data/community'
import { useGarden } from '../store/GardenProvider'
import { useToast } from '../components/Toast'
import {
  BookmarkIcon,
  ChevronLeftIcon,
  CommentIcon,
  HeartIcon,
  MoreIcon,
  PinIcon,
  SendIcon,
  ShareIcon,
} from '../components/icons'
import { asset } from '../utils/asset'

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const {
    posts,
    community,
    toggleFollow,
    toggleLikePost,
    toggleCollectPost,
    addComment,
  } = useGarden()
  const post = posts.find((p) => p.id === id)

  const [draft, setDraft] = useState('')
  const [likedComments, setLikedComments] = useState<string[]>([])

  const baseComments = POST_COMMENTS[id ?? ''] ?? []
  const comments = [...(community.comments[id ?? ''] ?? []), ...baseComments]
  const liked = community.likedPosts.includes(id ?? '')
  const collected = community.collectedPosts.includes(id ?? '')
  const followed = post ? community.follows.includes(post.author) : false
  const likeCount = (post?.likes ?? 0) + (liked ? 1 : 0)

  if (!post) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
        <p className="text-[14px] text-ink-2">这条动态不见了</p>
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="press mt-4 rounded-full bg-moss px-5 py-2 text-[12px] text-white"
        >
          回到社区
        </button>
      </div>
    )
  }

  const related = posts.filter((p) => p.topic === post.topic && p.id !== post.id).slice(0, 6)

  const send = () => {
    if (!draft.trim()) {
      toast('写点什么再发送吧')
      return
    }
    addComment(post.id, draft)
    setDraft('')
    toast('评论已发送')
  }

  const share = async () => {
    const text = `${post.author}：${post.caption} #${post.topic} · 来自植觉`
    try {
      if (navigator.share) {
        await navigator.share({ title: '植觉 · 社区', text })
        return
      }
      await navigator.clipboard.writeText(text)
      toast('内容已复制，去分享给花友吧')
    } catch {
      toast('分享已取消')
    }
  }

  return (
    <div className="pb-[104px]">
      {/* Hero */}
      <div className="relative w-full" style={{ aspectRatio: post.aspect }}>
        <img src={asset(post.image)} alt={post.caption} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,26,20,0.42)] via-transparent to-[rgba(15,26,20,0.18)]" />
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <span className="absolute left-[62px] top-4 rounded-full bg-black/30 px-2.5 py-[5px] text-[10px] text-white backdrop-blur">
          #{post.topic}
        </span>
        <span className="absolute bottom-3 left-4 rounded-full bg-white/20 px-2 py-[3px] text-[9.5px] text-white backdrop-blur">
          {post.city} · {post.aspect.replace(/\s/g, '').replace('/', ':')}
        </span>
      </div>

      {/* 作者 + 文案 */}
      <section className="px-4 pt-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[15px] font-semibold text-white"
            style={{ background: post.avatarTone }}
          >
            {post.author.slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink">{post.author}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink-3">
              <PinIcon size={11} />
              {post.city}
            </p>
          </div>
          {post.author === '我' ? (
            <span className="rounded-full border border-[#dcd6c8] px-3 py-1.5 text-[11px] text-ink-3">
              我的动态
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                toggleFollow(post.author)
                toast(followed ? '已取消关注' : '已关注，新动态会进关注流')
              }}
              className={`press rounded-full px-3.5 py-1.5 text-[11.5px] font-medium ${
                followed ? 'border border-[#dcd6c8] text-ink-2' : 'bg-moss text-white'
              }`}
            >
              {followed ? '已关注' : '关注'}
            </button>
          )}
        </div>

        <p className="mt-3 text-[13.5px] leading-relaxed text-ink">{post.caption}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-[#eef0e8] px-2 py-[3px] text-[10px] text-leaf">#{post.topic}</span>
          <span className="text-[10.5px] text-ink-3">{post.comments + comments.length} 条互动</span>
        </div>
      </section>

      {/* 操作栏 */}
      <section className="mt-4 flex items-center gap-1.5 px-4">
        <button
          type="button"
          onClick={() => toggleLikePost(post.id)}
          aria-label="点赞"
          className="press flex items-center gap-1.5 rounded-full border border-[#e2ddce] bg-white/70 px-3 py-2 text-[12px]"
          style={{ color: liked ? '#C0553F' : '#5c6b61' }}
        >
          <HeartIcon size={15} />
          {likeCount}
        </button>
        <button
          type="button"
          onClick={() => toast('评论区在下方，说点什么吧')}
          className="press flex items-center gap-1.5 rounded-full border border-[#e2ddce] bg-white/70 px-3 py-2 text-[12px] text-ink-2"
        >
          <CommentIcon size={15} />
          {post.comments + comments.length}
        </button>
        <button
          type="button"
          onClick={() => {
            toggleCollectPost(post.id)
            toast(collected ? '已取消收藏' : '已收藏到「我的」')
          }}
          className="press flex items-center gap-1.5 rounded-full border border-[#e2ddce] bg-white/70 px-3 py-2 text-[12px]"
          style={{ color: collected ? '#C77B58' : '#5c6b61' }}
        >
          <BookmarkIcon size={15} />
          收藏
        </button>
        <button
          type="button"
          onClick={share}
          aria-label="分享"
          className="press ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#e2ddce] bg-white/70 text-ink-2"
        >
          <ShareIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => toast('已隐藏类似内容')}
          aria-label="更多"
          className="press flex h-9 w-9 items-center justify-center rounded-full border border-[#e2ddce] bg-white/70 text-ink-2"
        >
          <MoreIcon size={16} />
        </button>
      </section>

      {/* 评论 */}
      <section className="mt-6 px-4">
        <h2 className="mb-3 px-1 text-[15px] font-semibold tracking-tight text-ink">
          评论 <span className="ml-1 text-[11px] font-normal text-ink-3">{comments.length}</span>
        </h2>
        {comments.length === 0 ? (
          <p className="rounded-[18px] border border-line/80 bg-white/55 px-4 py-6 text-center text-[11.5px] text-ink-3">
            还没有人评论，来抢沙发
          </p>
        ) : (
          <div className="space-y-3.5">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2.5">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: c.avatarTone }}
                >
                  {c.author.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-ink-2">{c.author}</p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink">{c.text}</p>
                  <p className="mt-1 text-[10px] text-ink-3">{c.at}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLikedComments((prev) =>
                      prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id],
                    )
                  }
                  className="press flex h-fit items-center gap-0.5 pt-1 text-[10px]"
                  style={{ color: likedComments.includes(c.id) ? '#C0553F' : '#8D9A90' }}
                >
                  <HeartIcon size={12} />
                  {c.likes + (likedComments.includes(c.id) ? 1 : 0)}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 同话题 */}
      {related.length > 0 && (
        <section className="mt-7 px-4">
          <h2 className="mb-3 px-1 text-[15px] font-semibold tracking-tight text-ink">同话题 · {post.topic}</h2>
          <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => navigate(`/post/${r.id}`)}
                className="press w-[124px] shrink-0 overflow-hidden rounded-[16px] border border-line/80 bg-white text-left"
              >
                <img src={asset(r.image)} alt={r.caption} className="h-[124px] w-full object-cover" loading="lazy" />
                <p className="line-clamp-2 px-2.5 py-2 text-[11px] leading-[1.5] text-ink">{r.caption}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 发评论：吸附在 TabBar 上方 */}
      <section className="sticky bottom-[86px] z-30 mt-6 px-4 pb-2">
        <div className="flex items-center gap-2 rounded-[24px] border border-line bg-white/92 p-2 shadow-[0_14px_28px_-24px_rgba(28,38,32,.6)] backdrop-blur">
          <span
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eff3ed] text-[11px] font-semibold text-moss"
            aria-hidden="true"
          >
            我
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
            maxLength={120}
            placeholder="说点什么…"
            className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-[13px] text-ink outline-none placeholder:text-ink-3"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim()}
            className="press flex items-center gap-1 rounded-full bg-moss px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-40"
          >
            <SendIcon size={14} />
            发送
          </button>
        </div>
      </section>
    </div>
  )
}
