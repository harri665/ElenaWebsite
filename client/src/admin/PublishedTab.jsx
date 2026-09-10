import { useState } from 'react'
import { api } from './api.js'
import ImagePicker from './ImagePicker.jsx'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const when = (item) => (item.month ? `${MONTHS[item.month - 1]} ${item.year}` : String(item.year))

export default function PublishedTab({ site, run }) {
  const [editing, setEditing] = useState(null) // null | 'new' | item id

  if (editing) {
    const item = editing === 'new' ? null : site.published.find((p) => p.id === editing)
    return <PublishedForm key={editing} site={site} item={item} run={run} onDone={() => setEditing(null)} />
  }

  const items = [...site.published].sort((a, b) => b.year - a.year || (b.month ?? 0) - (a.month ?? 0))

  const remove = (item) => {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return
    run(() => api(`/api/admin/published/${item.id}`, { method: 'DELETE' }), `Deleted "${item.title}".`)
  }

  return (
    <section>
      <div className="row">
        <h2>Published works ({items.length})</h2>
        <span className="spacer" />
        <button className="primary" onClick={() => setEditing('new')}>
          + Add published work
        </button>
      </div>
      <p className="hint">Books, zines, magazines, games… anywhere your work has appeared. Listed newest first.</p>

      {items.length === 0 ? (
        <p>Nothing added yet.</p>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>When</th>
              <th></th>
              <th>Title</th>
              <th>Where</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{when(p)}</td>
                <td>{p.cover ? <img className="thumb" src={p.cover} alt="" /> : <span className="thumb" />}</td>
                <td>{p.title}</td>
                <td>{p.publication}</td>
                <td className="actions">
                  <button onClick={() => setEditing(p.id)}>Edit</button>
                  <button className="danger" onClick={() => remove(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function PublishedForm({ site, item, run, onDone }) {
  const isNew = !item
  const [title, setTitle] = useState(item?.title ?? '')
  const [publication, setPublication] = useState(item?.publication ?? '')
  const [year, setYear] = useState(String(item?.year ?? new Date().getFullYear()))
  const [month, setMonth] = useState(item?.month ? String(item.month) : '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [link, setLink] = useState(item?.link ?? '')
  const [cover, setCover] = useState(item?.cover ?? '')
  const [coverFile, setCoverFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    Object.entries({ title, publication, year, month, description, link, cover }).forEach(([k, v]) => form.append(k, v))
    if (coverFile) form.append('coverFile', coverFile)
    setBusy(true)
    const ok = await run(
      () => api(isNew ? '/api/admin/published' : `/api/admin/published/${item.id}`, { method: isNew ? 'POST' : 'PUT', form }),
      isNew ? `Added "${title}".` : `Saved "${title}".`,
    )
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <form className="card-form" onSubmit={submit}>
      <div className="row">
        <h2>{isNew ? 'Add a published work' : `Edit “${item.title}”`}</h2>
        <span className="spacer" />
        <button type="button" onClick={onDone}>
          ← Back to list
        </button>
      </div>

      <label>
        Title * <span className="hint">(the piece, or what you made for it)</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
      </label>
      <label>
        Where it was published * <span className="hint">(book, zine, magazine, website…)</span>
        <input value={publication} onChange={(e) => setPublication(e.target.value)} maxLength={160} required />
      </label>
      <div className="row">
        <label>
          Year *
          <input type="number" min="1900" max="2100" value={year} onChange={(e) => setYear(e.target.value)} required style={{ width: '8rem' }} />
        </label>
        <label>
          Month <span className="hint">(optional)</span>
          <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: '12rem' }}>
            <option value="">—</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        Description <span className="hint">(optional)</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={2000} />
      </label>
      <label>
        Link <span className="hint">(optional — where people can see or buy it)</span>
        <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
      </label>

      <ImagePicker site={site} label="Cover image (optional)" value={cover} onChange={setCover} file={coverFile} onFileChange={setCoverFile} />

      <div className="row">
        <button type="submit" className="primary" disabled={busy || !title.trim() || !publication.trim() || !year}>
          {busy ? 'Saving…' : isNew ? 'Add published work' : 'Save changes'}
        </button>
        <button type="button" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
