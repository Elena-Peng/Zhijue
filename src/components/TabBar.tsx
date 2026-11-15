import { useLocation, useNavigate } from 'react-router-dom'
import type { ComponentType } from 'react'
import { CompassIcon, LeafIcon, PlusIcon, UserIcon, UsersIcon } from './icons'

const TABS = [
  { to: '/', label: '温室', Icon: LeafIcon },
  { to: '/discover', label: '发现', Icon: CompassIcon },
  { to: '/community', label: '社区', Icon: UsersIcon },
  { to: '/profile', label: '我的', Icon: UserIcon },
]

export function TabBar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav className="absolute inset-x-0 bottom-0 z-30">
      <div
        className="relative border-t border-[#e7e1d4]/80 bg-[rgba(250,246,238,0.94)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl"
        style={{ boxShadow: '0 -12px 30px -22px rgba(47,96,71,0.45)' }}
      >
        <div className="flex h-[62px] items-center justify-between px-3">
          {TABS.slice(0, 2).map((tab) => (
            <TabButton
              key={tab.to}
              active={pathname === tab.to || (tab.to === '/' && pathname.startsWith('/plant'))}
              label={tab.label}
              Icon={tab.Icon}
              onClick={() => navigate(tab.to)}
            />
          ))}

          <button
            type="button"
            aria-label="拍照识植物"
            onClick={() => navigate('/identify')}
            className="press relative -mt-7 flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-white"
            style={{
              background: 'linear-gradient(160deg,#4c8f6a 0%,#2f6047 78%)',
              boxShadow: '0 10px 22px -8px rgba(47,96,71,0.62), 0 0 0 5px rgba(250,246,238,0.96)',
            }}
          >
            <PlusIcon size={24} strokeWidth={2} />
          </button>

          {TABS.slice(2).map((tab) => (
            <TabButton
              key={tab.to}
              active={pathname === tab.to}
              label={tab.label}
              Icon={tab.Icon}
              onClick={() => navigate(tab.to)}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}

function TabButton({
  active,
  label,
  Icon,
  onClick,
}: {
  active: boolean
  label: string
  Icon: ComponentType<{ size?: number; className?: string }>
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-[64px] flex-col items-center gap-1 py-1"
      aria-current={active ? 'page' : undefined}
    >
      <Icon size={22} className={active ? 'text-leaf' : 'text-ink-3'} />
      <span
        className={`text-[11px] tracking-wide ${
          active ? 'font-semibold text-moss' : 'text-ink-3'
        }`}
      >
        {label}
      </span>
    </button>
  )
}
