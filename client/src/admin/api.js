const KEY = 'elena-admin-password'

export const getPassword = () => sessionStorage.getItem(KEY) || ''
export const setPassword = (pw) => (pw ? sessionStorage.setItem(KEY, pw) : sessionStorage.removeItem(KEY))

export class AuthError extends Error {}

/** fetch wrapper: adds the admin password, turns error responses into thrown Errors. */
export async function api(path, { method = 'GET', json, form } = {}) {
  const headers = { Authorization: `Bearer ${getPassword()}` }
  let body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form
  }
  const res = await fetch(path, { method, headers, body })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) throw new AuthError(data.error || 'Wrong password.')
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`)
  return data
}
