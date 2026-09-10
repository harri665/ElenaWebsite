import { useInView } from '../lib/useInView.js'

/** Line — dot — diamond — dot — line. Draws itself outward from the middle. */
export function Divider({ className = '' }) {
  const [ref, inView] = useInView({ threshold: 0.6 })
  return (
    <div ref={ref} className={`divider ${inView ? 'is-in' : ''} ${className}`} aria-hidden="true">
      <span className="divider__line divider__line--left" />
      <span className="divider__dot" />
      <span className="divider__diamond" />
      <span className="divider__dot" />
      <span className="divider__line divider__line--right" />
    </div>
  )
}

const Corner = ({ className }) => (
  <svg className={`frame__corner ${className}`} viewBox="0 0 40 40" aria-hidden="true">
    <path d="M1 39V12L12 1h27" fill="none" stroke="currentColor" strokeWidth="1" />
    <path d="M6 39V14L14 6h25" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
    <rect x="9.5" y="9.5" width="5" height="5" transform="rotate(45 12 12)" fill="currentColor" />
  </svg>
)

/** Thin gilded frame with ornamental corners around artwork. */
export function Frame({ className = '', children }) {
  return (
    <div className={`frame ${className}`}>
      {children}
      <Corner className="frame__corner--tl" />
      <Corner className="frame__corner--tr" />
      <Corner className="frame__corner--bl" />
      <Corner className="frame__corner--br" />
    </div>
  )
}

export function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Arrow({ dir = 'right', ...props }) {
  return (
    <svg
      viewBox="0 0 24 12"
      width="24"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      style={dir === 'left' ? { transform: 'scaleX(-1)' } : undefined}
      {...props}
    >
      <path d="M0 6h22M17 1l5 5-5 5" />
    </svg>
  )
}
