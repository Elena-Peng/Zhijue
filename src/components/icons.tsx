import type { ReactNode } from 'react'

interface IconProps {
  size?: number
  className?: string
  strokeWidth?: number
}

function Svg({
  children,
  size = 20,
  className = '',
  strokeWidth = 1.7,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20c0-8 5.5-14 16-14 0 10-6 14-12 14H4Z" />
    <path d="M9.5 14.5c2-2.5 4.5-4 7-4.8" />
  </Svg>
)

export const CompassIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2Z" />
  </Svg>
)

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 4 4" />
  </Svg>
)

export const UsersIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.4 19c.6-3 2.8-4.6 5.6-4.6s5 1.6 5.6 4.6" />
    <path d="M16.2 5.4a3.2 3.2 0 0 1 0 6.2" />
    <path d="M17.6 14.6c1.8.5 2.8 1.9 3.1 4.4" />
  </Svg>
)

export const UserIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8.4" r="3.6" />
    <path d="M4.8 20c.7-3.6 3.4-5.6 7.2-5.6s6.5 2 7.2 5.6" />
  </Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 9.5A2.5 2.5 0 0 1 6 7h1.6l1.1-2h6.6l1.1 2H18a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 18 21H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    <circle cx="12" cy="14" r="3.4" />
  </Svg>
)

export const DropletIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5c3 3.6 5.5 6.4 5.5 9.6a5.5 5.5 0 0 1-11 0c0-3.2 2.5-6 5.5-9.6Z" />
  </Svg>
)

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1 5.5 18.5" />
  </Svg>
)

export const TempIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 13.4V6a2.5 2.5 0 0 1 5 0v7.4a4.4 4.4 0 1 1-5 0Z" />
    <path d="M12 9.5v6.2" />
  </Svg>
)

export const WindIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 8.5h9a3 3 0 1 0-3-3" />
    <path d="M3.5 12.5h12.5a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3.5 16.5h6" />
  </Svg>
)

export const ChevronLeftIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </Svg>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 5.5 16 12l-6.5 6.5" />
  </Svg>
)

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.4 4.4L19 6.5" />
  </Svg>
)

export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.2 21 19.4H3L12 4.2Z" />
    <path d="M12 10v4.2M12 17.2h.01" />
  </Svg>
)

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6.2 6.2l2.4 2.4M15.4 15.4l2.4 2.4M17.8 6.2l-2.4 2.4M8.6 15.4 6.2 17.8" />
  </Svg>
)

export const CalendarIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.6" y="5.4" width="16.8" height="15" rx="3" />
    <path d="M3.6 10h16.8M8.4 3.5v3.6M15.6 3.5v3.6" />
  </Svg>
)

export const BellIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.2 16.5V11a5.8 5.8 0 0 1 11.6 0v5.5l1.6 2.2H4.6l1.6-2.2Z" />
    <path d="M9.6 20.5a2.5 2.5 0 0 0 4.8 0" />
  </Svg>
)

export const HeartIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 20s-7.6-4.4-7.6-9.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.6 3C19.6 15.6 12 20 12 20Z" />
  </Svg>
)

export const CommentIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.4 12.2c0 4.2-3.7 7.6-8.4 7.6-1 0-2-.2-2.9-.5L4.4 21l1.5-4.2A7.2 7.2 0 0 1 3.6 12c0-4.2 3.7-7.6 8.4-7.6s8.4 3.4 8.4 7.6Z" />
  </Svg>
)

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 1 0-13 0c0 4.8 6.5 11 6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Svg>
)

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
)

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.6 7V4.8h4.8V7M6.8 7l.8 12.2h8.8L17.2 7" />
  </Svg>
)

export const InfoIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 11v5.4M12 7.8h.01" />
  </Svg>
)

export const ScanIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9V6.5A2.5 2.5 0 0 1 6.5 4H9M15 4h2.5A2.5 2.5 0 0 1 20 6.5V9M20 15v2.5A2.5 2.5 0 0 1 17.5 20H15M9 20H6.5A2.5 2.5 0 0 1 4 17.5V15" />
    <path d="M4 12h16" />
  </Svg>
)

export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 5.5A2.6 2.6 0 0 1 7 3h12v18H7a2.5 2.5 0 0 1-2.5-2.5v-13Z" />
    <path d="M8 3v15" />
  </Svg>
)

export const GalleryIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.6" y="4.6" width="16.8" height="14.8" rx="2.8" />
    <path d="m3.6 15.5 4.2-4 3.4 3.2 3-2.6 5.4 5" />
    <circle cx="9" cy="9" r="1.6" />
  </Svg>
)

export const ShareIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="6.2" cy="12" r="2.6" />
    <circle cx="17.8" cy="6.2" r="2.6" />
    <circle cx="17.8" cy="17.8" r="2.6" />
    <path d="m8.4 10.9 7-3.6M8.4 13.1l7 3.6" />
  </Svg>
)

export const SendIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M21 4 3.4 11.1 9.6 12.8l2.6 6.2L21 4Z" />
    <path d="M9.6 12.8 14 9" />
  </Svg>
)

export const BookmarkIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.4 4.6h11.2a1 1 0 0 1 1 1v14.2l-6.6-3.4-6.6 3.4V5.6a1 1 0 0 1 1-1Z" />
  </Svg>
)

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.4v5l3.2 2" />
  </Svg>
)

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="5.4" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="18.6" cy="12" r="1.5" />
  </Svg>
)
