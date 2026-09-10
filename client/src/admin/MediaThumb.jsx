export function MediaThumb({ item, large = false }) {
  const cls = large ? 'thumb large' : 'thumb'
  if (!item) return <span className={cls} />
  if (item.type === 'video') return <video className={cls} src={item.src} muted preload="metadata" />
  return <img className={cls} src={item.src} alt="" loading="lazy" />
}
