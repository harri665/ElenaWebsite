import { useState } from 'react'
import { api } from './api.js'
import ImagePicker from './ImagePicker.jsx'

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function BlogTab({ site, run }) {
  const [editing, setEditing] = useState(null) // null | 'new' | post id

  if (editing) {
    const post = editing === 'new' ? null : site.posts.find((p) => p.id === editing)
    return <PostForm key={editing} site={site} post={post} run={run} onDone={() => setEditing(null)} />
  }

  const posts = [...site.posts].sort((a, b) => b.date.localeCompare(a.date))

  const remove = (post) => {
    if (!window.confirm(`Delete the post "${post.title}"? This can't be undone.`)) return
    run(() => api(`/api/admin/posts/${post.id}`, { method: 'DELETE' }), `Deleted "${post.title}".`)
  }

  return (
    <section>
      <div className="row">
        <h2>Blog posts ({posts.length})</h2>
        <span className="spacer" />
        <button className="primary" onClick={() => setEditing('new')}>
          + New post
        </button>
      </div>
      <p className="hint">Posts are listed newest first on the site, by their date.</p>

      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <table className="list">
          <thead>
            <tr>
              <th>Date</th>
              <th></th>
              <th>Title</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id}>
                <td>{p.date}</td>
                <td>{p.cover ? <img className="thumb" src={p.cover} alt="" /> : <span className="thumb" />}</td>
                <td>
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                    {p.title}
                  </a>
                </td>
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

function PostForm({ site, post, run, onDone }) {
  const isNew = !post
  const [title, setTitle] = useState(post?.title ?? '')
  const [date, setDate] = useState(post?.date ?? today())
  const [body, setBody] = useState(post?.body ?? '')
  const [cover, setCover] = useState(post?.cover ?? '')
  const [coverFile, setCoverFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('title', title)
    form.append('date', date)
    form.append('body', body)
    form.append('cover', cover)
    if (coverFile) form.append('coverFile', coverFile)
    setBusy(true)
    const ok = await run(
      () => api(isNew ? '/api/admin/posts' : `/api/admin/posts/${post.id}`, { method: isNew ? 'POST' : 'PUT', form }),
      isNew ? `Published "${title}".` : `Saved "${title}".`,
    )
    setBusy(false)
    if (ok) onDone()
  }

  return (
    <form className="card-form" onSubmit={submit}>
      <div className="row">
        <h2>{isNew ? 'New post' : `Edit “${post.title}”`}</h2>
        <span className="spacer" />
        <button type="button" onClick={onDone}>
          ← Back to list
        </button>
      </div>

      <label>
        Title *
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
      </label>
      <label>
        Date *
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ maxWidth: '14rem' }} />
      </label>
      <label>
        Post text * <span className="hint">(leave a blank line between paragraphs)</span>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={16} maxLength={50000} required />
      </label>

      <ImagePicker site={site} label="Cover image (optional)" value={cover} onChange={setCover} file={coverFile} onFileChange={setCoverFile} />

      <div className="row">
        <button type="submit" className="primary" disabled={busy || !title.trim() || !body.trim() || !date}>
          {busy ? 'Saving…' : isNew ? 'Publish post' : 'Save changes'}
        </button>
        <button type="button" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  )
}
