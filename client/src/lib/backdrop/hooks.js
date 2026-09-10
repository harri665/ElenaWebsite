import { createContext, useContext, useEffect, useRef } from 'react'

export const BackdropContext = createContext(null)

export const descKey = (d) => (d ? `${d.src}|${d.blur ?? 0}|${d.dim ?? ''}` : '')

export function useBackdropControls() {
  const ctx = useContext(BackdropContext)
  if (!ctx) throw new Error('Backdrop hooks must be used inside <BackdropProvider>')
  return ctx
}

/** Sets the page's default backdrop. */
export function useBackdrop(desc) {
  const { setBase } = useBackdropControls()
  const key = descKey(desc)
  useEffect(() => {
    setBase(desc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setBase])
}

/** Returns a ref; while that element dominates the viewport its backdrop shows. */
export function useBackdropSection(desc) {
  const ref = useRef(null)
  const { register, unregister } = useBackdropControls()
  const key = descKey(desc)
  const descRef = useRef(desc)
  descRef.current = desc
  useEffect(() => {
    const el = ref.current
    if (!el || !descRef.current) return
    register(el, descRef.current)
    return () => unregister(el)
  }, [key, register, unregister])
  return ref
}
