import { useBackdrop, useBackdropSection } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Divider, Frame, InstagramIcon } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

// All of this page's text is edited from /admin → About.
export default function About() {
  const { about, pieces } = useSite()
  const paragraphs = about.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const contactBg = pieces[0]?.cover

  useBackdrop(about.image ? { src: about.image, blur: 0.8, dim: 0.66 } : null)
  const contactRef = useBackdropSection(contactBg ? { src: contactBg, blur: 1, dim: 0.7 } : null)

  return (
    <div className="page-about">
      <section className={`about ${about.image ? '' : 'about--no-image'}`}>
        <div className="about__text">
          <Reveal as="p" className="eyebrow">
            💙💜💗 &nbsp;About the artist
          </Reveal>
          <RevealText as="h1" text={about.heading} className="page-title" immediate delay={150} />
          {about.lead && (
            <Reveal as="p" className="about__lead" delay={200}>
              {about.lead}
            </Reveal>
          )}
          {paragraphs.map((p, i) => (
            <Reveal as="p" key={i} delay={280 + i * 60}>
              {p}
            </Reveal>
          ))}
        </div>
        {about.image && (
          <Reveal className="about__art" delay={200}>
            <Frame>
              <img src={about.image} alt="" />
            </Frame>
          </Reveal>
        )}
      </section>

      <section className="contact" ref={contactRef}>
        <Reveal as="p" className="eyebrow">
          Say hello
        </Reveal>
        {about.contactHeading && <RevealText text={about.contactHeading} className="section-title" />}
        {about.contactText && (
          <Reveal as="p" className="section-intro" delay={150}>
            {about.contactText}
          </Reveal>
        )}
        <Reveal className="contact__ctas" delay={250}>
          {about.instagramUrl && (
            <a className="btn btn--primary" href={about.instagramUrl} target="_blank" rel="noreferrer">
              <InstagramIcon />
              <span>{about.instagramHandle || 'Instagram'}</span>
            </a>
          )}
          <TLink to="/gallery" className="btn">
            <span>Browse the gallery</span>
          </TLink>
        </Reveal>
      </section>
    </div>
  )
}
