import { useEffect, useRef, useState } from 'react'
import { CameraIcon, CloseIcon } from './icons'

/**
 * 真实相机取景：调用 getUserMedia 打开摄像头，抓帧转 dataURL。
 * 浏览器不支持或被拒绝时回退给调用方（用 file input 的 capture 走系统相机）。
 */
export function CameraSheet({
  open,
  onClose,
  onCapture,
  onFallback,
}: {
  open: boolean
  onClose: () => void
  onCapture: (dataUrl: string) => void
  onFallback: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const readyRef = useRef(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError('')
    setReady(false)
    readyRef.current = false
    // 授权弹窗久未响应时给出明确出口，避免界面卡在「正在打开」
    const timeout = window.setTimeout(() => {
      if (!readyRef.current) {
        setError('摄像头没有响应，可能正在等待浏览器授权，或本机没有可用设备')
      }
    }, 8000)

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('当前浏览器不支持直接调用摄像头')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1440 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => undefined)
        }
        window.clearTimeout(timeout)
        readyRef.current = true
        setReady(true)
      } catch (err) {
        window.clearTimeout(timeout)
        const name = err instanceof DOMException ? err.name : ''
        setError(
          name === 'NotAllowedError'
            ? '摄像头权限被拒绝，可在地址栏的权限设置里允许后重试'
            : name === 'NotFoundError'
              ? '没有检测到可用摄像头'
              : '摄像头启动失败，可改用相册照片',
        )
      }
    }

    void start()
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [open])

  const shoot = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const w = video.videoWidth
    const h = video.videoHeight
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 720 / Math.max(w, h))
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    onCapture(canvas.toDataURL('image/jpeg', 0.82))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(20,28,23,0.72)] px-6 backdrop-blur-sm">
      <div className="w-full max-w-[360px] overflow-hidden rounded-[24px] bg-[#FDFBF4] shadow-2xl">
        <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
          <p className="text-[13px] font-semibold text-ink">拍照取景</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="press grid h-7 w-7 place-items-center rounded-full bg-white text-ink-2 shadow-sm"
          >
            <CloseIcon size={13} />
          </button>
        </div>

        <div className="relative mx-4 overflow-hidden rounded-[18px] bg-black/85">
          <video
            ref={videoRef}
            playsInline
            muted
            className="aspect-[4/3] w-full object-cover"
          />
          {!ready && !error && (
            <div className="absolute inset-0 grid place-items-center text-[11.5px] text-white/70">
              正在打开摄像头…
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
              <p className="text-[11.5px] leading-relaxed text-white/80">{error}</p>
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onFallback()
                }}
                className="press rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-ink-2"
              >
                用系统相机 / 相册
              </button>
            </div>
          )}
          {ready && (
            <div className="pointer-events-none absolute inset-6 rounded-[14px] border border-white/25" />
          )}
        </div>

        <div className="px-4 pb-4 pt-3">
          <p className="mb-3 text-center text-[10px] leading-relaxed text-ink-3">
            让叶片占画面 60% 以上，避免逆光
          </p>
          <button
            type="button"
            disabled={!ready}
            onClick={shoot}
            className="press flex w-full items-center justify-center gap-1.5 rounded-full bg-moss py-2.5 text-[12.5px] font-medium text-white disabled:opacity-40"
          >
            <CameraIcon size={15} />
            拍下这一张
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              onFallback()
            }}
            className="press mt-2 w-full py-1 text-center text-[10.5px] text-ink-3 underline decoration-dotted"
          >
            没有摄像头？改用系统相机 / 相册
          </button>
        </div>
      </div>
    </div>
  )
}
