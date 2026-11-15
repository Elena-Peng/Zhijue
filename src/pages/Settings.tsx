import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGarden } from '../store/GardenProvider'
import { useToast } from '../components/Toast'
import {
  BellIcon,
  ChevronLeftIcon,
  ClockIcon,
  InfoIcon,
  LeafIcon,
  TrashIcon,
} from '../components/icons'

export function Settings() {
  const navigate = useNavigate()
  const toast = useToast()
  const { state, updateSettings, resetGarden } = useGarden()
  const s = state.settings

  const [nick, setNick] = useState(s.nickname)
  const [confirmReset, setConfirmReset] = useState(false)

  const commitNick = () => {
    updateSettings({ nickname: nick.trim() || s.nickname })
    toast('昵称已更新')
  }

  return (
    <div className="pb-[104px]">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-[rgba(250,246,238,0.92)] px-4 pb-3 pt-5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="返回"
          className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-ink-2 shadow-sm"
        >
          <ChevronLeftIcon size={18} />
        </button>
        <h1 className="text-[16px] font-semibold tracking-tight text-ink">设置</h1>
        <div className="h-9 w-9" />
      </header>

      <section className="mt-2 px-4">
        <h2 className="mb-2.5 px-1 text-[15px] font-semibold tracking-tight text-ink">账户</h2>
        <div className="card divide-y divide-[#efeadd] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">
              <LeafIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink">昵称</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">社区与温室中展示的名字</p>
            </div>
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              onBlur={commitNick}
              maxLength={12}
              className="w-[110px] rounded-full border border-line bg-white px-3 py-1.5 text-right text-[12.5px] text-ink outline-none focus:border-leaf/40"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">
              <InfoIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink">账号与云端同步</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">本地演示版，数据存于本机</p>
            </div>
            <span className="rounded-full bg-[#f2f0e6] px-2 py-1 text-[10px] text-ink-3">V2.0</span>
          </div>
        </div>
      </section>

      <section className="mt-6 px-4">
        <h2 className="mb-2.5 px-1 text-[15px] font-semibold tracking-tight text-ink">养护提醒</h2>
        <div className="card divide-y divide-[#efeadd] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">
              <BellIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink">每日聚合提醒</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">每天聚合一条，不打扰</p>
            </div>
            <Switch
              checked={s.reminderOn}
              onChange={(v) => {
                updateSettings({ reminderOn: v })
                toast(v ? '已开启每日聚合提醒' : '已关闭提醒')
              }}
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">
              <ClockIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink">提醒时间</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">每天这时推送今日待办</p>
            </div>
            <input
              type="time"
              value={s.reminderTime}
              onChange={(e) => updateSettings({ reminderTime: e.target.value })}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-[12.5px] tabular text-ink outline-none focus:border-leaf/40"
            />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#f2f0e6] text-leaf">
              <ClockIcon size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ink">免打扰时段</p>
              <p className="mt-0.5 text-[10.5px] text-ink-3">此时段内不推送任何提醒</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="time"
                value={s.quietStart}
                onChange={(e) => updateSettings({ quietStart: e.target.value })}
                className="w-[78px] rounded-full border border-line bg-white px-2 py-1.5 text-[12px] tabular text-ink outline-none focus:border-leaf/40"
              />
              <span className="text-[11px] text-ink-3">–</span>
              <input
                type="time"
                value={s.quietEnd}
                onChange={(e) => updateSettings({ quietEnd: e.target.value })}
                className="w-[78px] rounded-full border border-line bg-white px-2 py-1.5 text-[12px] tabular text-ink outline-none focus:border-leaf/40"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 px-4">
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
        </button>
      </section>

      <p className="mt-6 text-center text-[9.5px] tracking-[0.18em] text-ink-3">植觉 · ZHIJUE · V1.0</p>
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
