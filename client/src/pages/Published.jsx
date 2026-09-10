import { useEffect, useRef } from 'react'
import { useBackdrop, useBackdropControls } from '../lib/backdrop/hooks.js'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Arrow, Divider } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

const HOVER_DELAY = 140

export default function Published() {
  const { published, pieces } = useSite()
  const bg = published.find((p) => p.cover)?.cover ?? pieces[0]?.cover
  useBackdrop(bg ? { src: bg, blur: 1, dim: 0.72 } : null)

  // Like the gallery: hovering an entry previews its cover behind the page.
  const { setOverride } = useBackdropControls()
  const timer = useRef(0)
  const preview = (desc) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOverride(desc), HOVER_DELAY)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="page-published">
      <header className="section-head section-head--page">
        <RevealText as="h1" text="Published Works" className="page-title" immediate delay={150} />
        <p> I want to make this more comprehensive but i dont have many of your works so i didnt for now but i would like to put you actual works here instead of linking them to something else idk i didnt do it yet but maybe for the future :) </p>
        <p> i also want to add the witcher fan fic i read but i couldnt remember if you had posted that anywhere so i didnt :( i think name was like posion vines :) </p>
      </header>

      {published.length === 0 ? (
        <p className="section-intro">Nothing here yet check back soon.</p>
      ) : (
        <div className="published-grid" onMouseLeave={() => preview(null)}>
          {published.map((item, i) => {
            const desc = item.cover ? { src: item.cover, blur: 0.6, dim: 0.62 } : null
            return (
              <Reveal
                key={item.id}
                as="article"
                className="published-card"
                delay={(i % 3) * 90}
                onMouseEnter={() => preview(desc)}
              >
                <div className={`published-card__cover ${item.cover ? '' : 'is-empty'}`}>
                  {item.cover ? <img src={item.cover} alt="" loading="lazy" /> : <span aria-hidden="true">✦</span>}
                </div>
                <div className="published-card__text">
                  <p className="eyebrow">
                    <time>{item.displayDate}</time> &nbsp;·&nbsp; {item.publication}
                  </p>
                  <h2 className="published-card__title">{item.title}</h2>
                  {item.description && <p className="published-card__desc">{item.description}</p>}
                  {item.link && (
                    <a className="link-arrow" href={item.link} target="_blank" rel="noreferrer">
                      View publication <Arrow />
                    </a>
                  )}
                </div>
              </Reveal>
            )
          })}
        </div>
      )}
    </div>
  )
}
