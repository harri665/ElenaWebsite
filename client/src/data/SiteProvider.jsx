import { useEffect, useState } from 'react'
import { SiteContext, shapeSite } from './useSite.js'

/** Loads /api/site once; children only render after it arrives. */
export default function SiteProvider({ children }) {
  const [site, setSite] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/site')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((raw) => setSite(shapeSite(raw)))
      .catch((e) => setError(e.message))
  }, [])

  if (error) {
    return (
      <div className="site-error">
        <p className="eyebrow">Something went wrong</p>
        <p>The gallery couldn’t be loaded ({error}). Please try again in a moment.</p>
      </div>
    )
  }
  if (!site) return null
  return <SiteContext.Provider value={site}>{children}</SiteContext.Provider>
}
