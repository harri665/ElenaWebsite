import { useState } from 'react'
import { api } from './api.js'
import ImagePicker from './ImagePicker.jsx'

const TEXT_FIELDS = [
  'heading',
  'lead',
  'body',
  'teaserHeading',
  'teaserText',
  'contactHeading',
  'contactText',
  'instagramUrl',
  'instagramHandle',
]

export default function AboutTab({ site, run }) {
  const [form, setForm] = useState(() => Object.fromEntries(TEXT_FIELDS.map((k) => [k, site.about[k] ?? ''])))
  const [image, setImage] = useState(site.about.image)
  const [imageFile, setImageFile] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))


  const submit = async (e) => {
    e.preventDefault()
    const data = new FormData()
    TEXT_FIELDS.forEach((k) => data.append(k, form[k]))
    data.append('image', image)
    if (imageFile) data.append('imageFile', imageFile)
    setBusy(true)
    const saved = await run(() => api('/api/admin/about', { method: 'PUT', form: data }), 'About section saved.')
    setBusy(false)
    if (saved) {
      setImageFile(null)
      setImage(saved.image) // an uploaded photo now has a server path
    }
  }

  return (
    <form className="card-form" onSubmit={submit}>
      <h2>About</h2>

      <fieldset>
        <legend>About page</legend>
        <label>
          Heading *
          <input value={form.heading} onChange={set('heading')} maxLength={120} required />
        </label>
        <label>
          Intro line <span className="hint">(shown larger, in italics)</span>
          <input value={form.lead} onChange={set('lead')} maxLength={400} />
        </label>
        <label>
          Main text <span className="hint">(leave a blank line between paragraphs)</span>
          <textarea value={form.body} onChange={set('body')} rows={9} maxLength={6000} />
        </label>

        <ImagePicker site={site} label="Photo" value={image} onChange={setImage} file={imageFile} onFileChange={setImageFile} />
      </fieldset>

      <fieldset>
        <legend>“The artist” section on the home page</legend>
        <label>
          Heading
          <input value={form.teaserHeading} onChange={set('teaserHeading')} maxLength={120} />
        </label>
        <label>
          Text
          <textarea value={form.teaserText} onChange={set('teaserText')} rows={3} maxLength={1000} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Contact section (bottom of the about page)</legend>
        <label>
          Heading
          <input value={form.contactHeading} onChange={set('contactHeading')} maxLength={120} />
        </label>
        <label>
          Text
          <textarea value={form.contactText} onChange={set('contactText')} rows={3} maxLength={1000} />
        </label>
        <label>
          Instagram URL
          <input type="url" value={form.instagramUrl} onChange={set('instagramUrl')} placeholder="https://www.instagram.com/…" />
        </label>
        <label>
          Instagram handle
          <input value={form.instagramHandle} onChange={set('instagramHandle')} placeholder="@elena_artist_8" maxLength={60} />
        </label>
      </fieldset>

      <div className="row">
        <button type="submit" className="primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save about section'}
        </button>
      </div>
    </form>
  )
}
