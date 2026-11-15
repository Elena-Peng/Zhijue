import type { ReactNode } from 'react'
import { CloseIcon } from './icons'

export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="absolute inset-0 z-50">
      <div className="absolute inset-0 bg-[rgba(28,38,32,0.34)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="sheet-up absolute inset-x-0 bottom-0 max-h-[88%] overflow-y-auto rounded-t-[28px] border-t border-white/60 bg-cream px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_50px_-20px_rgba(28,38,32,0.4)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#d8d2c4]" />
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="press flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-ink-2"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
