import { useParams } from 'react-router-dom'
import { useBackdrop } from '../lib/backdrop/hooks.js'
import { TLink } from '../lib/transition.jsx'
import { Reveal, RevealText } from '../components/Reveal.jsx'
import { Arrow, Divider, Frame } from '../components/Ornaments.jsx'
import { useSite } from '../data/useSite.js'
import NotFound from './NotFound.jsx'

export default function Post() {
  const { slug } = useParams()
  const { posts, postsBySlug, pieces } = useSite()
  const post = postsBySlug[slug]
  const bg = post?.cover ?? pieces[0]?.cover
  useBackdrop(post && bg ? { src: bg, blur: 0.9, dim: 0.72 } : null)
  if (!post) return <NotFound />

  // Posts are newest first, so "newer" is the one before this in the list.
  const i = posts.indexOf(post)
  const newer = posts[i - 1]
  const older = posts[i + 1]
  const backdropFor = (p) => (p?.cover ? { src: p.cover, blur: 0.9, dim: 0.72 } : undefined)

  return (
    <article className="post">
      <header className="post__head">
        <Reveal as="p" className="eyebrow">
          <time dateTime={post.date}>{post.displayDate}</time>
        </Reveal>
        <RevealText as="h1" text={post.title} className="page-title" immediate delay={150} />
      </header>

      {post.cover && (
        <Reveal className="post__cover" delay={200}>
          <Frame>
            <img src={post.cover} alt="" />
          </Frame>
        </Reveal>
      )}

      <div className="post__body">
        {post.paragraphs.map((p, n) => (
          <Reveal as="p" key={n} delay={n < 3 ? 250 + n * 60 : 0}>
            {p}
          </Reveal>
        ))}
      </div>

      <nav className="piece__nav" aria-label="More posts">
        {older ? (
          <TLink to={`/blog/${older.slug}`} className="piece__nav-link" backdrop={backdropFor(older)}>
            <span>
              <small>
                <Arrow dir="left" /> Older
              </small>
              {older.title}
            </span>
          </TLink>
        ) : (
          <span />
        )}
        <TLink to="/blog" className="piece__nav-all">
          All posts
        </TLink>
        {newer ? (
          <TLink to={`/blog/${newer.slug}`} className="piece__nav-link piece__nav-link--next" backdrop={backdropFor(newer)}>
            <span>
              <small>
                Newer <Arrow />
              </small>
              {newer.title}
            </span>
          </TLink>
        ) : (
          <span />
        )}
      </nav>
    </article>
  )
}
