import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { createBackdropRenderer } from './renderer.js'
import { BackdropContext, descKey } from './hooks.js'

/*
 * One fixed, full-screen WebGL canvas sits behind the whole site. Anything can
 * ask it to show an image with a "backdrop descriptor":
 *
 *   { src, blur = 0..1, dim = 0..1, focus = [x, y] }
 *
 * Priority, highest first:
 *   1. override  — hover previews and link clicks (cleared on navigation)
 *   2. section   — whichever registered section fills most of the viewport
 *   3. base      — the page's default
 *
 * Pages talk to it through the hooks in ./hooks.js.
 */

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export function BackdropProvider({ children }) {
  const [base, setBase] = useState(null)
  const [override, setOverride] = useState(null)
  const [section, setSection] = useState(null)
  const sections = useRef(new Map()) // element -> { desc, visible }
  const observerRef = useRef(null)
  const rafRef = useRef(0)
  const { pathname } = useLocation()

  useEffect(() => setOverride(null), [pathname])

  useEffect(() => {
    const pick = () => {
      rafRef.current = 0
      let best = null
      let bestVisible = 0
      for (const s of sections.current.values()) {
        if (s.visible > bestVisible) {
          bestVisible = s.visible
          best = s.desc
        }
      }
      setSection((prev) => (descKey(prev) === descKey(best) ? prev : best))
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const s = sections.current.get(entry.target)
          if (s) s.visible = entry.isIntersecting ? entry.intersectionRect.height : 0
        }
        if (!rafRef.current) rafRef.current = requestAnimationFrame(pick)
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    )
    observerRef.current = observer
    for (const el of sections.current.keys()) observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const register = useCallback((el, desc) => {
    sections.current.set(el, { desc, visible: 0 })
    observerRef.current?.observe(el)
  }, [])

  const unregister = useCallback((el) => {
    sections.current.delete(el)
    observerRef.current?.unobserve(el)
    if (!sections.current.size) setSection(null)
  }, [])

  const active = override ?? section ?? base

  const controls = useMemo(
    () => ({ setBase, setOverride, register, unregister }),
    [register, unregister],
  )

  return (
    <BackdropContext.Provider value={controls}>
      <BackdropCanvas desc={active} />
      {children}
    </BackdropContext.Provider>
  )
}

function BackdropCanvas({ desc }) {
  const holderRef = useRef(null)
  const rendererRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    // A fresh canvas per mount keeps StrictMode's double-mount from reusing a destroyed context.
    const canvas = document.createElement('canvas')
    canvas.className = 'backdrop__canvas'
    holderRef.current.appendChild(canvas)
    const renderer = createBackdropRenderer(canvas, { reducedMotion: prefersReducedMotion() })
    if (!renderer) {
      canvas.remove()
      setFallback(true)
      return
    }
    rendererRef.current = renderer
    return () => {
      renderer.destroy()
      canvas.remove()
      rendererRef.current = null
    }
  }, [])

  const key = descKey(desc)
  useEffect(() => {
    rendererRef.current?.show(desc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__holder" ref={holderRef}>
        {fallback && desc?.src && (
          <img key={desc.src} className="backdrop__fallback" src={desc.src} alt="" style={{ '--blur': desc.blur ?? 0 }} />
        )}
      </div>
      <div className="backdrop__dim" style={{ opacity: desc?.dim ?? 0.5 }} />
      <div className="backdrop__vignette" />
      <div className="backdrop__grain" />
    </div>
  )
}
