import { useEffect, useRef } from 'react'
import { useBackdrop, useBackdropControls } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Divider } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

const HOVER_DELAY = 140

export default function Gallery() {
  const { pieces: artworks } = useSite()
  useBackdrop(artworks[0] ? { src: artworks[0].cover, blur: 1, dim: 0.72 } : null)
  const { setOverride } = useBackdropControls()
  const hoverTimer = useRef(0)

  // Hovering a card previews it behind the whole page. The short delay stops
  // the background from churning while the pointer sweeps across the grid.
  const preview = (desc) => {
    clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setOverride(desc), HOVER_DELAY)
  }
  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  return (
    <div className="page-gallery">
      <header className="section-head section-head--page">

        <RevealText as="h1" text="The Gallery" className="page-title" immediate delay={150} />

      </header>

      <div className="gallery-grid" onMouseLeave={() => preview(null)}>
        {artworks.map((a, i) => {
          const desc = { src: a.cover, blur: 0.55, dim: 0.6 }
          return (
            <Reveal key={a.id} className="gallery-grid__item" delay={(i % 4) * 80}>
              <TLink
                to={`/art/${a.slug}`}
                className="card card--large"
                backdrop={{ src: a.cover, blur: 0.8, dim: 0.6 }}
                onMouseEnter={() => preview(desc)}
                onFocus={() => preview(desc)}
                onClick={() => clearTimeout(hoverTimer.current)}
              >
                <img src={a.cover} alt={a.title} loading="lazy" />
                <span className="card__label">
                  {a.title}
                  {/* {a.media.length > 1 && <small>{a.media.length} images</small>} */}
                </span>
              </TLink>
            </Reveal>
          )
        })}
      </div>
    </div>
  )
}
