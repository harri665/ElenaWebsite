import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { TLink } from '../lib/transition.jsx'
import { InstagramIcon } from './Ornaments.jsx'
import { useSite } from '../data/useSite.js'

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/published', label: 'Published' },
  { to: '/blog', label: 'Blog' },
  { to: '/about', label: 'About' },
]

export default function Header() {
  const { pathname } = useLocation()
  const { about } = useSite()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (to) => (to === '/' ? pathname === '/' : pathname.startsWith(to) || (to === '/gallery' && pathname.startsWith('/art/')))

  return (
    <header className={`header ${scrolled ? 'is-scrolled' : ''} ${open ? 'is-open' : ''}`}>
      <div className="header__scrim" />
      <TLink to="/" className="header__logo" aria-label="Elena — home">
        Elena
      </TLink>

      <button className="header__toggle" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
        <span />
        <span />
        <span className="sr-only">Menu</span>
      </button>

      <nav id="site-nav" className="header__nav">
        {links.map((l) => (
          <TLink key={l.to} to={l.to} className={`header__link ${isActive(l.to) ? 'is-active' : ''}`}>
            {l.label}
          </TLink>
        ))}
      </nav>
    </header>
  )
}
