import { useEffect, useMemo } from 'react'

/**
 * Pick any image already on the site, or choose a new file to upload.
 * `value` is the chosen site image path ('' = none); `file` is a pending upload (wins over `value`).
 */
export default function ImagePicker({ site, label, value, onChange, file, onFileChange }) {
  const options = useMemo(
    () =>
      site.pieces.flatMap((p) =>
        p.media
          .filter((m) => m.type === 'image')
          .map((m, i, list) => ({ src: m.src, label: list.length > 1 ? `${p.title} — image ${i + 1}` : p.title })),
      ),
    [site.pieces],
  )
  const inOptions = options.some((o) => o.src === value)

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  return (
    <div className="field">
      <span>{label}</span>
      <div className="row top">
        <div className="photo-preview">
          {preview || value ? <img src={preview || value} alt="" /> : <span className="hint">No image</span>}
        </div>
        <div className="stack">
          <select
            aria-label={`${label}: choose an existing image`}
            value={inOptions || !value ? value : '__current'}
            onChange={(e) => {
              onChange(e.target.value)
              onFileChange(null)
            }}
            disabled={Boolean(file)}
          >
            <option value="">No image</option>
            {value && !inOptions && (
              <option value="__current" disabled>
                Current uploaded image
              </option>
            )}
            {options.map((o) => (
              <option key={o.src} value={o.src}>
                {o.label}
              </option>
            ))}
          </select>
          <label>
            …or upload a new one
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                onFileChange(e.target.files[0] || null)
                e.target.value = ''
              }}
            />
          </label>
          {file && (
            <button type="button" onClick={() => onFileChange(null)}>
              Don’t use “{file.name}”
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
