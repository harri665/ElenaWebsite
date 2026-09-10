import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useBackdrop } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Arrow, Divider, Frame, InstagramIcon } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'
import NotFound from './NotFound.jsx'

export default function Piece() {
  const { slug } = useParams()
  const { bySlug } = useSite()
  const piece = bySlug[slug]
  if (!piece) return <NotFound />
  // Keyed so slide state resets when moving between pieces.
  return <PieceView key={piece.id} piece={piece} />
}

function PieceView({ piece }) {
  const { pieces: artworks } = useSite()
  const [slide, setSlide] = useState(0)
  const current = piece.media[slide]
  const backdropSrc = current.type === 'video' ? current.poster : current.src
  useBackdrop({ src: backdropSrc, blur: 0.8, dim: 0.6 })

  const prev = artworks[(piece.index - 1 + artworks.length) % artworks.length]
  const next = artworks[(piece.index + 1) % artworks.length]
  const count = piece.media.length

  useEffect(() => {
    if (count < 2) return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      if (e.key === 'ArrowRight') setSlide((s) => (s + 1) % count)
      if (e.key === 'ArrowLeft') setSlide((s) => (s - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [count])

  return (
    <article className="piece">
      <div className="piece__layout">
        <div className="piece__viewer">
          <Frame className="piece__frame">
            {current.type === 'video' ? (
              <video key={current.src} className="piece__media" src={current.src} poster={current.poster} controls playsInline autoPlay muted loop />
            ) : (
              <img key={current.src} className="piece__media" src={current.src} alt={`${piece.title}${count > 1 ? ` — image ${slide + 1} of ${count}` : ''}`} />
            )}
          </Frame>

          {count > 1 && (
            <div className="piece__thumbs" role="tablist" aria-label="Images in this piece">
              {piece.media.map((m, i) => (
                <button
                  key={m.src}
                  role="tab"
                  aria-selected={i === slide}
                  className={`piece__thumb ${i === slide ? 'is-active' : ''}`}
                  onClick={() => setSlide(i)}
                >
                  <img src={m.type === 'video' ? m.poster : m.src} alt="" />
                  {m.type === 'video' && <span className="piece__thumb-play" aria-hidden="true">▶</span>}
                  <span className="sr-only">
                    {m.type === 'video' ? 'Video' : 'Image'} {i + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="piece__info">

          <RevealText as="h1" text={piece.title} className="piece__title" immediate delay={200} />
          {piece.blurb && (
            <Reveal as="p" className="piece__blurb" delay={250}>
              {piece.blurb}
            </Reveal>
          )}
        </div>
      </div>

      <nav className="piece__nav" aria-label="More artwork">
        <TLink to={`/art/${prev.slug}`} className="piece__nav-link" backdrop={{ src: prev.cover, blur: 0.8, dim: 0.6 }}>
          <img src={prev.cover} alt="" />
          <span>
            <small>
              <Arrow dir="left" /> Previous
            </small>
            {prev.title}
          </span>
        </TLink>
        <TLink to="/gallery" className="piece__nav-all">
          All work
        </TLink>
        <TLink to={`/art/${next.slug}`} className="piece__nav-link piece__nav-link--next" backdrop={{ src: next.cover, blur: 0.8, dim: 0.6 }}>
          <span>
            <small>
              Next <Arrow />
            </small>
            {next.title}
          </span>
          <img src={next.cover} alt="" />
        </TLink>
      </nav>
    </article>
  )
}
