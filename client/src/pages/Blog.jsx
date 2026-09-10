import { useBackdrop } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Arrow, Divider } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'

export default function Blog() {
  const { posts, pieces } = useSite()
  const bg = posts.find((p) => p.cover)?.cover ?? pieces[0]?.cover
  useBackdrop(bg ? { src: bg, blur: 1, dim: 0.72 } : null)

  return (
    <div className="page-blog">
      <header className="section-head section-head--page">

        <RevealText as="h1" text="Blog" className="page-title" immediate delay={150} />
      </header>

      {posts.length === 0 ? (
        <p className="section-intro">Nothing here yet </p>
      ) : (
        <div className="post-list">
          {posts.map((post, i) => {
            const backdrop = post.cover ? { src: post.cover, blur: 0.8, dim: 0.62 } : undefined
            return (
              <Reveal key={post.id} delay={Math.min(i, 4) * 90}>
                <TLink to={`/blog/${post.slug}`} className={`post-card ${post.cover ? '' : 'post-card--no-cover'}`} backdrop={backdrop}>
                  {post.cover && (
                    <span className="post-card__cover">
                      <img src={post.cover} alt="" loading="lazy" />
                    </span>
                  )}
                  <span className="post-card__text">
                    <time className="eyebrow" dateTime={post.date}>
                      {post.displayDate}
                    </time>
                    <span className="post-card__title">{post.title}</span>
                    {post.excerpt && <span className="post-card__excerpt">{post.excerpt}</span>}
                    <span className="link-arrow">
                      Read the post <Arrow />
                    </span>
                  </span>
                </TLink>
              </Reveal>
            )
          })}
        </div>
      )}
    </div>
  )
}
