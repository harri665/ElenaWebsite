import { Fragment } from 'react'
import { useInView } from '../lib/useInView.js'

/** Fades/lifts its children in when scrolled into view. */
export function Reveal({ as = 'div', className = '', delay = 0, style, children, ...rest }) {
  const Tag = as
  const [ref, inView] = useInView()
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--delay': `${delay}ms`, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Letter-by-letter reveal, like the FancyText headings on the D&D site. */
export function RevealText({ as = 'h2', text, className = '', stagger = 32, delay = 0, immediate = false }) {
  const Tag = as
  const [ref, inView] = useInView({ threshold: 0.4 })
  let i = 0
  return (
    <Tag
      ref={ref}
      className={`reveal-text ${inView || immediate ? 'is-in' : ''} ${className}`}
      aria-label={text}
    >
      {text.split(' ').map((word, w) => (
        <Fragment key={w}>
          {w > 0 && ' '}
          <span className="reveal-text__word" aria-hidden="true">
            {[...word].map((ch) => (
              <span className="reveal-text__char" key={i} style={{ '--d': `${delay + i++ * stagger}ms` }}>
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </Tag>
  )
}
