import { useState } from 'react'
import { api } from './api.js'
import { MediaThumb } from './MediaThumb.jsx'

export default function FeaturedTab({ site, run }) {
  const [enabled, setEnabled] = useState(site.featured.enabled)
  const [ids, setIds] = useState(site.featured.ids)
  const [toAdd, setToAdd] = useState('')

  const byId = Object.fromEntries(site.pieces.map((p) => [p.id, p]))
  const available = site.pieces.filter((p) => !ids.includes(p.id))
  const dirty = enabled !== site.featured.enabled || ids.join() !== site.featured.ids.join()

  const move = (i, d) =>
    setIds((list) => {
      const next = [...list]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })

  const save = () => run(() => api('/api/admin/featured', { method: 'PUT', json: { enabled, ids } }), 'Featured section saved.')

  return (
    <section className="card-form">
      <h2>Featured section</h2>
      <p className="hint">
        These pieces cycle behind the intro at the top of the home page :) 
      </p>

      <label className="check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Show the featured sections further down the home page
      </label>

      {!enabled && <p className="hint"> i made like a featured section that goes above the gallery for select art pieces i didnt really like it in heinsight but if you like it you can turn this on and itll show :) </p>}

      <fieldset>
        <legend>Featured pieces, in order ({ids.length})</legend>
        {ids.length === 0 && <p className="hint">Nothing featured yet — add a piece below.</p>}
        <table className="list">
          <tbody>
            {ids.map((id, i) => {
              const p = byId[id]
              if (!p) return null
              return (
                <tr key={id}>
                  <td>{i + 1}</td>
                  <td>
                    <MediaThumb item={p.media.find((m) => m.type === 'image')} />
                  </td>
                  <td>{p.title}</td>
                  <td className="actions">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${p.title} up`}>
                      ↑
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === ids.length - 1} aria-label={`Move ${p.title} down`}>
                      ↓
                    </button>
                    <button className="danger" onClick={() => setIds((l) => l.filter((x) => x !== id))}>
                      Remove from featured
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="row">
          <select value={toAdd} onChange={(e) => setToAdd(e.target.value)} aria-label="Piece to feature">
            <option value="">Choose a piece to feature…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            disabled={!toAdd}
            onClick={() => {
              setIds((l) => [...l, toAdd])
              setToAdd('')
            }}
          >
            Add to featured
          </button>
        </div>
      </fieldset>

      <div className="row">
        <button className="primary" onClick={save} disabled={!dirty}>
          Save featured section
        </button>
        {dirty && <span className="hint">You have unsaved changes.</span>}
      </div>
    </section>
  )
}
