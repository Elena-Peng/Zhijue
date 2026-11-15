import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckIcon } from './icons'

const ToastContext = createContext<(message: string, tone?: 'default' | 'success') => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'default' | 'success' } | null>(null)
  const timer = useRef<number | null>(null)

  const show = useCallback((message: string, tone: 'default' | 'success' = 'success') => {
    setToast({ id: Date.now(), message, tone })
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className="pop-in pointer-events-none absolute inset-x-0 bottom-[86px] z-40 flex justify-center px-6"
        >
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[rgba(28,38,32,0.92)] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg backdrop-blur">
            {toast.tone === 'success' && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                <CheckIcon size={13} strokeWidth={2.4} />
              </span>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
