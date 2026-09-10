import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import { useBackdropControls } from './backdrop/hooks.js'
import { TransitionContext, usePageTransition } from './usePageTransition.js'

// How long the old page takes to fade out before the route actually changes.
// The backdrop starts dissolving at the click, so it overlaps both halves.
const LEAVE_MS = 520

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export function TransitionProvider({ children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [leaving, setLeaving] = useState(false)
  const timer = useRef(0)
  const lenisRef = useRef(null)

  useEffect(() => {
    if (reducedMotion()) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09 })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Every new page starts at the top.
  useLayoutEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true, force: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => () => clearTimeout(timer.current), [])

  const go = useCallback(
    (to) => {
      if (to === pathname) {
        if (lenisRef.current) lenisRef.current.scrollTo(0)
        else window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (reducedMotion()) {
        navigate(to)
        return
      }
      clearTimeout(timer.current)
      setLeaving(true)
      timer.current = setTimeout(() => {
        navigate(to)
        setLeaving(false)
      }, LEAVE_MS)
    },
    [navigate, pathname],
  )

  const scrollTo = useCallback((target) => {
    if (lenisRef.current) lenisRef.current.scrollTo(target, { offset: 0 })
    else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return <TransitionContext.Provider value={{ go, leaving, scrollTo }}>{children}</TransitionContext.Provider>
}

/**
 * Drop-in <Link> that fades the current page out before navigating.
 * Pass `backdrop` to start dissolving the background towards the next page immediately.
 */
export function TLink({ to, backdrop, onClick, ...rest }) {
  const { go } = usePageTransition()
  const { setOverride } = useBackdropControls()
  const { pathname } = useLocation()
  return (
    <Link
      to={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        if (backdrop && to !== pathname) setOverride(backdrop)
        go(to)
      }}
      {...rest}
    />
  )
}
