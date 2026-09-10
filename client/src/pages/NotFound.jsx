import { useBackdrop } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { RevealText } from '../components/Reveal.jsx'
import { Divider } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

export default function NotFound() {
  const { pieces } = useSite()
  useBackdrop(pieces[0] ? { src: pieces[0].cover, blur: 0.6, dim: 0.6 } : null)
  return (
    <section className="not-found">
      <p className="eyebrow">Error 404</p>
      <RevealText as="h1" text="Lost in space" className="page-title" immediate />
      <Divider />
      <p className="section-intro">This page drifted off somewhere. Let’s get you back to the ship.</p>
      <TLink to="/" className="btn btn--primary">
        <span>Back home</span>
      </TLink>
    </section>
  )
}
