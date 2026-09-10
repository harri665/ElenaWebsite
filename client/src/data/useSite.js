import { createContext, useContext } from 'react'

export const SiteContext = createContext(null)

/** The whole site's content, shaped for the pages. Only available once loaded. */
export const useSite = () => useContext(SiteContext)

// "2026-09-10" → "September 10, 2026", read as a local date so it never shifts a day.
function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/** Turns the raw /api/site JSON into what the pages render. */
export function shapeSite(raw) {
  const pieces = raw.pieces.map((p, i) => {
    const images = p.media.filter((m) => m.type === 'image').map((m) => m.src)
    const cover = images[0]
    return {
      ...p,
      index: i,
      number: String(i + 1).padStart(2, '0'),
      cover,
      images,
      media: p.media.map((m) => (m.type === 'video' ? { ...m, poster: cover } : m)),
    }
  })
  const byId = Object.fromEntries(pieces.map((p) => [p.id, p]))
  const pick = (ids) => ids.map((id) => byId[id]).filter(Boolean)

  // Newest first. Dates are plain YYYY-MM-DD, so they sort as strings.
  const posts = [...(raw.posts ?? [])]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => {
      const paragraphs = p.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
      const first = paragraphs[0] ?? ''
      return {
        ...p,
        paragraphs,
        excerpt: first.length > 220 ? `${first.slice(0, 220).replace(/\s+\S*$/, '')}…` : first,
        displayDate: formatDate(p.date),
      }
    })

  // Newest first; entries without a month sort after dated ones in the same year.
  const published = [...(raw.published ?? [])]
    .sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0))
    .map((p) => ({
      ...p,
      displayDate: p.month
        ? new Date(p.year, p.month - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : String(p.year),
    }))

  // The featured list always drives the hero slideshow, even when the
  // featured section itself is switched off.
  const featured = pick(raw.featured.ids)
  return {
    pieces,
    bySlug: Object.fromEntries(pieces.map((p) => [p.slug, p])),
    posts,
    postsBySlug: Object.fromEntries(posts.map((p) => [p.slug, p])),
    published,
    heroPieces: featured.length ? featured : pieces.slice(0, 5),
    featuredPieces: raw.featured.enabled ? featured : [],
    about: raw.about,
  }
}
