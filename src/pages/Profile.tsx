import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { useToast } from '../components/Toast'
import {
  AlertIcon,
  BellIcon,
  BookIcon,
  BookmarkIcon,
  CalendarIcon,
  ChevronRightIcon,
  DropletIcon,
  HeartIcon,
  InfoIcon,
  LeafIcon,
  ScanIcon,
  TrashIcon,
  UsersIcon,
} from '../components/icons'

export function Profile() {
  const { state, stats, plants, updateSettings, resetGarden, community } = useGarden()
  const toast = useToast()
  const navigate = useNavigate()
  const [confirmReset, setConfirmReset] = useState(false)

  const myPosts = community.posts.length
  const myComments = Object.values(community.comments).reduce((n, list) => n + list.length, 0)

  const achievements = [
    { key: 'first', name: '第一盆', desc: '加入温室', unlocked: plants.length > 0, Icon: LeafIcon },
    { key: 'identify', name: '识图新手', desc: '完成首次识别', unlocked: plants.length >= 2, Icon: ScanIcon },
    { key: 'care', name: '养护打卡', desc: '累计 5 次', unlocked: state.logs.length >= 5, Icon: DropletIcon },
    { key: 'diary', name: '记录者', desc: '写下 5 条日记', unlocked: stats.diaryCount >= 5, Icon: BookIcon },
    { key: 'month', name: '温室满月', desc: '陪伴 30 天', unlocked: stats.days >= 30, Icon: CalendarIcon },
    { key: 'community', name: '社区达人', desc: '发布 3 条动态', unlocked: myPosts >= 3, Icon: UsersIcon },
  ]

  return (
    <div className="pb-[104px]">
      <header className="relative overflow-hidden px-5 pb-4 pt-7">
        <div
          className="pointer-events-none absolute -left-12 -top-20 h-52 w-52 rounded-full opacity-50 blur-2xl"
          style={{ background: 'radial-gradient(circle,#cfdfd0,rgba(207,223,208,0))' }}
        />
        <div className="relative flex items-center gap-3.5">
          <div
            className="grid h-[58px] w-[58px] place-items-center rounded-full text-[19px] font-semibold text-white"
            style={{ background: 'linear-gradient(150deg,#4c8f6a,#2f6047)', boxShadow: '0 10px 24px -14px rgba(47,96,71,0.8)' }}
          >
            {state.settings.nickname.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-ink">{state.settings.nickname}</h1>
            <p className="mt-0.5 text-[11.5px] text-ink-2">
              在管 {plants.length} 盆 · 相伴 {stats.days} 天
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="press ml-auto rounded-full border border-[#ded8c9] bg-white/70 px-2.5 py-1 text-[10.5px] text-ink-2"
          >
            设置
          </button>
        </div>
      </header>

      {/* 北极星指标 */}
      <section className="px-4">
        <div className="card px-4 py-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10.5px] tracking-[0.14em] text-ink-3">30 日养活率</p>
              <p className="mt-1 text-[28px] font-semibold leading-none text-moss">
                {stats.survivalRate}
                <span className="ml-0.5 text-[13px] font-normal text-ink-3">%</span>
              </p>
            </div>
            <p className="max-w-[150px] text-right text-[10.5px] leading-relaxed text-ink-3">
              温室中仍标记为健康<br />或需注意的植物占比
            </p>
          </div>
          <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-[#ece7db]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7bb094] to-[#2f6047] transition-[width] duration-700"
              style={{ width: `${stats.survivalRate}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10.5px] text-ink-3">
            <LeafIcon size={12} className="text-leaf" />
            目标线 90% · 目前{stats.survivalRate >= 90 ? '已达标' : '还差一点'}
          </div>
        </div>
      </section>

      {/* 统计 */}
      <section className="mt-3 grid grid-cols-2 gap-2 px-4">
        {[
          { label: '在管植物', value: stats.plants, unit: '盆' },
          { label: '养护打卡', value: stats.careCount, unit: '次' },
          { label: '成长记录', value: stats.diaryCount, unit: '条' },
          { label: '陪伴天数', value: stats.days, unit: '天' },
        ].map((s) => (
          <div key={s.label} className="rounded-[18px] border border-line/80 bg-white/70 px-4 py-3">
            <p className="text-[10.5px] tracking-wider text-ink-3">{s.label}</p>
            <p className="mt-1 text-[19px] font-semibold leading-none text-ink">
              {s.value}
              <span className="ml-1 text-[10px] font-normal text-ink-3">{s.unit}</span>
            </p>
          </div>
        ))}
      </section>

      {/* 我的社区 */}
      <section className="mt-6 px-4">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">我的社区</h2>
          <span className="text-[10.5px] text-ink-3">已发 {myComments} 条评论</span>
        </div>
        <div className="card divide-y divide-[#efeadd] overflow-hidden">
          <SettingRow
            icon={<UsersIcon size={15} />}
            label="我的动态"
            desc="发布过的长势与心得"
            right={
              <span className="flex items-center gap-1 tabular text-[11.5px] text-ink-2">
                {myPosts}
                <ChevronRightIcon size={14} className="text-ink-3" />
              </span>
            }
            onClick={() => navigate('/community?mine=1')}
          />
          <SettingRow
            icon={<BookmarkIcon size={15} />}
            label="我的收藏"
            desc="收藏的帖子与养护灵感"
            right={
              <span className="flex items-center gap-1 tabular text-[11.5px] text-ink-2">
                {community.collectedPosts.length}
                <ChevronRightIcon size={14} className="text-ink-3" />
              </span>
            }
            onClick={() => navigate('/community?saved=1')}
          />
        </div>
      </section>

      {/* 成就 */}
      <section className="mt-6 px-4">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">成就</h2>
          <span className="text-[10.5px] text-ink-3">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} 已解锁
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {achievements.map((a) => (
            <div
              key={a.key}
              className={`rounded-[16px] border px-2 py-3 text-center ${
                a.unlocked ? 'border-[#e2ddce] bg-white/80' : 'border-line/60 bg-white/35'
              }`}
            >
              <div className={a.unlocked ? 'text-leaf' : 'text-ink-3 opacity-50'}>
                <a.Icon size={18} />
              </div>
              <p className={`mt-1 text-[11px] font-medium ${a.unlocked ? 'text-ink' : 'text-ink-3'}`}>{a.name}</p>
              <p className="mt-0.5 text-[9px] text-ink-3">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 设置 */}
      <section className="mt-6 px-4">
        <h2 className="mb-2.5 px-1 text-[15px] font-semibold tracking-tight text-ink">偏好设置</h2>
        <div className="card divide-y divide-[#efeadd] overflow-hidden">
          <SettingRow
            icon={<BellIcon size={15} />}
            label="养护提醒"
            desc="每天 09:30 聚合一条，不打扰"
            right={
              <Switch
                checked={state.settings.reminderOn}
                onChange={(v) => {
                  updateSettings({ reminderOn: v })
                  toast(v ? '已开启每日聚合提醒' : '已关闭提醒')
                }}
              />
            }
          />
          <SettingRow
            icon={<AlertIcon size={15} />}
            label="免打扰时段"
            desc="此时段内不推送任何提醒"
            right={<span className="tabular text-[11.5px] text-ink-2">{state.settings.quietStart}–{state.settings.quietEnd}</span>}
            onClick={() => navigate('/settings')}
          />
          <SettingRow
            icon={<LeafIcon size={15} />}
            label="温室容量"
            desc="本地存储，图片自动压缩后保存"
            right={<span className="tabular text-[11.5px] text-ink-2">{plants.length}/50</span>}
          />
          <SettingRow
            icon={<HeartIcon size={15} />}
            label="关于植觉"
            desc="V1.0 · 养活优先，轻打断"
            right={<ChevronRightIcon size={14} />}
            onClick={() => toast('植觉 V1.0 · 让每棵植物被好好照顾')}
          />
        </div>
      </section>

      <section className="mt-3 px-4">
        <button
          type="button"
          onClick={() => {
            if (!confirmReset) {
              setConfirmReset(true)
              window.setTimeout(() => setConfirmReset(false), 3500)
              return
            }
            resetGarden()
            setConfirmReset(false)
            toast('已恢复初始示例数据')
          }}
          className={`press flex w-full items-center justify-between rounded-[18px] border px-4 py-3 text-left ${
            confirmReset ? 'border-[#E7BCAF] bg-[#FBEAE2]' : 'border-line/80 bg-white/60'
          }`}
        >
          <span className="flex items-center gap-2">
            <TrashIcon size={15} className={confirmReset ? 'text-[#93372A]' : 'text-ink-2'} />
            <span className={`text-[12px] ${confirmReset ? 'text-[#93372A]' : 'text-ink-2'}`}>
              {confirmReset ? '再点一次确认重置' : '重置温室数据（恢复示例）'}
            </span>
          </span>
          <ChevronRightIcon size={14} className="text-ink-3" />
        </button>
      </section>

      <div className="mt-6 flex flex-col items-center gap-1.5">
        <p className="flex items-center gap-1 text-[10px] text-ink-3">
          <InfoIcon size={11} />
          当前为本地演示版，数据存储在本机
        </p>
        <p className="text-[10px] tracking-[0.18em] text-ink-3">植觉 · ZHIJUE</p>
        <p className="pb-2 text-[9.5px] text-ink-3">让每一棵被带回家的植物都被好好照顾</p>
      </div>
    </div>
  )
}

function SettingRow({
  icon,
  label,
  desc,
  right,
  onClick,
}: {
  icon: ReactNode
  label: string
  desc: string
  right: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? 'press cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-medium text-ink">{label}</p>
        <p className="mt-0.5 truncate text-[10.5px] text-ink-3">{desc}</p>
      </div>
      {right}
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="press relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors"
      style={{ background: checked ? '#3E7C5A' : '#dcd6c8' }}
    >
      <span
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? 23 : 3 }}
      />
    </button>
  )
}
