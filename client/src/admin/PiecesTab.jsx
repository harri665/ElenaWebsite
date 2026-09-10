import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import { MediaThumb } from './MediaThumb.jsx'

export default function PiecesTab({ site, run }) {
  const [editing, setEditing] = useState(null) // null | 'new' | piece id

  if (editing) {
    const piece = editing === 'new' ? null : site.pieces.find((p) => p.id === editing)
    return <PieceForm key={editing} piece={piece} run={run} onDone={() => setEditing(null)} />
  }

  const move = (piece, direction) => run(() => api(`/api/admin/pieces/${piece.id}/move`, { method: 'POST', json: { direction } }))

  const remove = (piece) => {
    if (!window.confirm(`Delete "${piece.title}"? This can't be undone.`)) return
    run(() => api(`/api/admin/pieces/${piece.id}`, { method: 'DELETE' }), `Deleted "${piece.title}".`)
  }

  return (
    <section>
      <div className="row">
        <h2>Pieces ({site.pieces.length})</h2>
        <span className="spacer" />
        <button className="primary" onClick={() => setEditing('new')}>
          + Add a piece
        </button>
      </div>

      <table className="list pieces-list">
        <thead>
          <tr>
            <th>#</th>
            <th></th>
            <th>Title</th>
            <th>Files</th>
            <th>Featured</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {site.pieces.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>
                <MediaThumb item={p.media.find((m) => m.type === 'image')} />
              </td>
              <td>
                <a href={`/art/${p.slug}`} target="_blank" rel="noreferrer">
                  {p.title}
                </a>
              </td>
              <td>{p.media.length}</td>
              <td>{site.featured.ids.includes(p.id) ? 'Yes' : ''}</td>
              <td className="actions">
                <button onClick={() => move(p, -1)} disabled={i === 0} aria-label={`Move ${p.title} up`}>
                  ↑
                </button>
                <button onClick={() => move(p, 1)} disabled={i === site.pieces.length - 1} aria-label={`Move ${p.title} down`}>
                  ↓
                </button>
                <button onClick={() => setEditing(p.id)}>Edit</button>
                <button className="danger" onClick={() => remove(p)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function PieceForm({ piece, run, onDone }) {
  const isNew = !piece
  const [title, setTitle] = useState(piece?.title ?? '')
  const [blurb, setBlurb] = useState(piece?.blurb ?? '')
  const [instagram, setInstagram] = useState(piece?.instagram ?? '')
  const [media, setMedia] = useState(piece?.media ?? []) // files already on the server
  const [files, setFiles] = useState([]) // new File objects, uploaded on save
  const [busy, setBusy] = useState(false)

  const previews = useMemo(() => files.map((f) => ({ type: f.type.startsWith('video/') ? 'video' : 'image', src: URL.createObjectURL(f) })), [files])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.src)), [previews])

  const moveMedia = (i, d) =>
    setMedia((list) => {
      const next = [...list]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })

  const hasImage = media.some((m) => m.type === 'image') || files.some((f) => f.type.startsWith('image/'))

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('title', title)
    form.append('blurb', blurb)
    form.append('instagram', instagram)
    if (!isNew) form.append('media', JSON.stringify(media.map((m) => m.src)))
    files.forEach((f) => form.append('files', f))

    setBusy(true)
    const ok = await run(
      () => api(isNew ? '/api/admin/pieces' : `/api/admin/pieces/${piece.id}`, { method: isNew ? 'POST' : 'PUT', form }),
      isNew ? `Added "${title}".` : `Saved "${title}".`,
    )
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <form className="card-form" onSubmit={submit}>
      <div className="row">
        <h2>{isNew ? 'Add a piece' : `Edit “${piece.title}”`}</h2>
        <span className="spacer" />
        <button type="button" onClick={onDone}>
          ← Back to list
        </button>
      </div>

      <label>
        Title *
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
      </label>
      <label>
        Description
        <textarea value={blurb} onChange={(e) => setBlurb(e.target.value)} maxLength={1500} rows={4} />
      </label>
      <label>
        Instagram post link <span className="hint">(optional)</span>
        <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/p/…" />
      </label>

      <fieldset>
        <legend>Images &amp; videos</legend>
        <p className="hint">The first image is the cover. Use the arrows to reorder.</p>
        {media.length === 0 && files.length === 0 && <p className="hint">No files yet.</p>}
        <div className="media-grid">
          {media.map((m, i) => (
            <div className="media-item" key={m.src}>
              <MediaThumb item={m} large />
              <div className="actions">
                <button type="button" onClick={() => moveMedia(i, -1)} disabled={i === 0} aria-label="Move earlier">
                  ←
                </button>
                <button type="button" onClick={() => moveMedia(i, 1)} disabled={i === media.length - 1} aria-label="Move later">
                  →
                </button>
                <button type="button" className="danger" onClick={() => setMedia((l) => l.filter((x) => x !== m))}>
                  Remove
                </button>
              </div>
              {i === 0 && m.type === 'image' && <span className="tag">Cover</span>}
            </div>
          ))}
          {previews.map((p, i) => (
            <div className="media-item" key={p.src}>
              <MediaThumb item={p} large />
              <div className="actions">
                <span className="tag">New</span>
                <button type="button" className="danger" onClick={() => setFiles((l) => l.filter((_, j) => j !== i))}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <label>
          Add files
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
            onChange={(e) => {
              const picked = [...e.target.files]
              setFiles((l) => [...l, ...picked])
              e.target.value = ''
            }}
          />
        </label>
        {!isNew && files.length > 0 && <p className="hint">New files are added after the existing ones — reorder after saving if needed.</p>}
      </fieldset>

      {!hasImage && <p className="notice error">A piece needs at least one image.</p>}

      <div className="row">
        <button type="submit" className="primary" disabled={busy || !hasImage || !title.trim()}>
          {busy ? 'Saving…' : isNew ? 'Add piece' : 'Save changes'}
        </button>
        <button type="button" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
