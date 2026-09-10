import { useCallback, useEffect, useState } from 'react'
import { AuthError, getPassword, setPassword } from './api.js'
import PiecesTab from './PiecesTab.jsx'
import FeaturedTab from './FeaturedTab.jsx'
import AboutTab from './AboutTab.jsx'
import BlogTab from './BlogTab.jsx'
import PublishedTab from './PublishedTab.jsx'

const TABS = [
  { id: 'pieces', label: 'Pieces' },
  { id: 'featured', label: 'Featured' },
  { id: 'published', label: 'Published' },
  { id: 'blog', label: 'Blog' },
  { id: 'about', label: 'About' },
]

export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(Boolean(getPassword()))
  const [site, setSite] = useState(null)
  const [tab, setTab] = useState('pieces')
  const [notice, setNotice] = useState(null) // { kind: 'ok' | 'error', text }

  const logout = useCallback(() => {
    setPassword('')
    setLoggedIn(false)
  }, [])

  const reload = useCallback(async () => {
    const res = await fetch('/api/site', { cache: 'no-store' })
    setSite(await res.json())
  }, [])

  // Runs an admin action, reports the result, and refreshes the data.
  const run = useCallback(
    async (action, successText) => {
      setNotice(null)
      try {
        const result = await action()
        await reload()
        if (successText) setNotice({ kind: 'ok', text: successText })
        return result ?? true
      } catch (err) {
        if (err instanceof AuthError) logout()
        setNotice({ kind: 'error', text: err.message })
        return false
      }
    },
    [reload, logout],
  )

  useEffect(() => {
    if (loggedIn) reload().catch(() => setNotice({ kind: 'error', text: 'Could not load the site data. Is the server running?' }))
  }, [loggedIn, reload])

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />

  return (
    <div className="admin">
      <header className="admin-header">
        <strong>Elena — Admin</strong>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => { setTab(t.id); setNotice(null) }}>
              {t.label}
            </button>
          ))}
        </nav>
        <span className="spacer" />
        <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
        <button onClick={logout}>Log out</button>
      </header>

      <main>
        {notice && (
          <p className={`notice ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
            {notice.text}
          </p>
        )}
        {!site ? (
          <p>Loading…</p>
        ) : tab === 'pieces' ? (
          <PiecesTab site={site} run={run} />
        ) : tab === 'featured' ? (
          <FeaturedTab site={site} run={run} />
        ) : tab === 'published' ? (
          <PublishedTab site={site} run={run} />
        ) : tab === 'blog' ? (
          <BlogTab site={site} run={run} />
        ) : (
          <AboutTab site={site} run={run} />
        )}
      </main>
    </div>
  )
}

function Login({ onLogin }) {
  const [password, setPw] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Login failed.')
      setPassword(password)
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Elena — Admin</h1>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPw(e.target.value)} autoFocus required />
      </label>
      {error && <p className="notice error">{error}</p>}
      <button type="submit" className="primary" disabled={busy}>
        {busy ? 'Checking…' : 'Log in'}
      </button>
    </form>
  )
}
