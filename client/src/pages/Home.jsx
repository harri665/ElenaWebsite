import { useEffect, useState } from 'react'
import { useBackdrop, useBackdropSection } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { usePageTransition } from '../lib/usePageTransition.js'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Arrow, Divider, Frame, InstagramIcon } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

const SLIDE_MS = 6500
// Portrait art on a landscape screen gets cropped; keep the faces in frame.
const HERO_FOCUS = [0.5, 0.08]

export default function Home() {
  const { heroPieces, featuredPieces } = useSite()
  const first = heroPieces[0]
  useBackdrop(first && { src: first.cover, blur: 0.15, dim: 0.35, focus: HERO_FOCUS })
  return (
    <>
      <Hero />
      {featuredPieces.map((piece, i) => (
        <Featured key={piece.id} piece={piece} flip={i % 2 === 1} />
      ))}
      <GalleryTeaser />
      <AboutTeaser />
    </>
  )
}

function Hero() {
  const { heroPieces } = useSite()
  const [index, setIndex] = useState(0)
  const { scrollTo } = usePageTransition()
  const piece = heroPieces[index]
  const ref = useBackdropSection(piece && { src: piece.cover, blur: 0.15, dim: 0.35, focus: HERO_FOCUS })

  useEffect(() => {
    if (heroPieces.length < 2) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % heroPieces.length), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, heroPieces.length])

  // Warm the browser cache so each slide's texture is ready when its turn comes.
  useEffect(() => {
    heroPieces.forEach((p) => {
      const img = new Image()
      img.src = p.cover
    })
  }, [heroPieces])

  return (
    <section className="hero" ref={ref}>
      <div className="hero__content">
        <RevealText as="h1" className="hero__title" text="Elena" stagger={90} delay={250} immediate />
        <p className="hero__tagline">Trying to do cool art, is it working?</p>
        <div className="hero__ctas">
          <TLink to="/gallery" className="btn btn--primary">
            <span>Enter the Gallery</span>
          </TLink>
          <TLink to="/about" className="btn">
            <span>Meet the Artist</span>
          </TLink>
        </div>
      </div>

      {piece && (
        <div className="hero__footer">
          <TLink
            to={`/art/${piece.slug}`}
            className="hero__caption"
            key={piece.id}
            backdrop={{ src: piece.cover, blur: 0.8, dim: 0.6 }}
          >
            <span className="hero__caption-title">{piece.title}</span>
          </TLink>
          {heroPieces.length > 1 && (
            <div className="hero__dots" role="tablist" aria-label="Featured artwork">
              {heroPieces.map((p, i) => (
                <button
                  key={p.id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={p.title}
                  className={`hero__dot ${i === index ? 'is-active' : ''}`}
                  style={{ '--slide-ms': `${SLIDE_MS}ms` }}
                  onClick={() => setIndex(i)}
                >
                  <span className="hero__dot-fill" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button className="scroll-cue" onClick={() => scrollTo('.hero + section')} aria-label="Scroll down">
        <span>Scroll</span>
        <svg viewBox="0 0 16 28" width="16" height="28" aria-hidden="true">
          <circle className="scroll-cue__dot" cx="8" cy="3" r="1.6" />
          <circle className="scroll-cue__dot" cx="8" cy="9" r="1.6" />
          <path className="scroll-cue__arrow" d="M2 16l6 7 6-7" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
    </section>
  )
}

function Featured({ piece, flip }) {
  const ref = useBackdropSection({ src: piece.cover, blur: 0.9, dim: 0.55 })
  const count = piece.media.length
  return (
    <section className={`featured ${flip ? 'featured--flip' : ''}`} ref={ref}>
      <Reveal className="featured__art">
        <TLink to={`/art/${piece.slug}`} backdrop={{ src: piece.cover, blur: 0.8, dim: 0.6 }} aria-label={`View ${piece.title}`}>
          <Frame>
            <img src={piece.cover} alt={piece.title} loading="lazy" />
          </Frame>
        </TLink>
      </Reveal>
      <div className="featured__text">

        <RevealText text={piece.title} className="featured__title" />
        {piece.blurb && (
          <Reveal as="p" className="featured__blurb" delay={200}>
            {piece.blurb}
          </Reveal>
        )}
        <Reveal delay={320}>
          <TLink to={`/art/${piece.slug}`} className="link-arrow" backdrop={{ src: piece.cover, blur: 0.8, dim: 0.6 }}>
            View the piece <Arrow />
          </TLink>
        </Reveal>
      </div>
    </section>
  )
}

function GalleryTeaser() {
  const { pieces, featuredPieces } = useSite()
  const picks = pieces.filter((p) => !featuredPieces.includes(p)).slice(0, 8)
  const ref = useBackdropSection(picks[0] && { src: picks[0].cover, blur: 1, dim: 0.72 })
  if (!pieces.length) return null
  return (
    <section className="teaser" ref={ref}>
      <div className="section-head">
        <Reveal as="p" className="eyebrow">
          {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'} and counting
        </Reveal>
        <RevealText text="MY ART " className="section-title" />
      </div>
      <div className="teaser__grid">
        {picks.map((a, i) => (
          <Reveal key={a.id} delay={i * 70} className="teaser__item">
            <TLink to={`/art/${a.slug}`} backdrop={{ src: a.cover, blur: 0.8, dim: 0.6 }} className="card">
              <img src={a.cover} alt={a.title} loading="lazy" />
              <span className="card__label">{a.title}</span>
            </TLink>
          </Reveal>
        ))}
      </div>
      <Reveal className="teaser__cta">
        <TLink to="/gallery" className="btn btn--primary">
          <span>See every piece</span>
        </TLink>
      </Reveal>
    </section>
  )
}

function AboutTeaser() {
  const { about } = useSite()
  const ref = useBackdropSection(about.image ? { src: about.image, blur: 1, dim: 0.72 } : null)
  return (
    <section className="about-teaser" ref={ref}>
      <Reveal as="p" className="eyebrow">
        The artist
      </Reveal>
      {about.teaserHeading && <RevealText text={about.teaserHeading} className="section-title" />}
      {about.teaserText && (
        <Reveal as="p" className="about-teaser__text" delay={150}>
          {about.teaserText}
        </Reveal>
      )}
      <Reveal className="about-teaser__ctas" delay={300}>
        <TLink to="/about" className="btn">
          <span>More about me</span>
        </TLink>
        {about.instagramUrl && (
          <a href={about.instagramUrl} target="_blank" rel="noreferrer" className="btn btn--ghost">
            <InstagramIcon />
            <span>{about.instagramHandle || 'Instagram'}</span>
          </a>
        )}
      </Reveal>
    </section>
  )
}
