// Single source of truth for talking to the FitZone backend.
// Handles authenticated requests, session refresh and safe logout recovery.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function getAccessToken() {
  return localStorage.getItem('fitzone_access_token')
}

function getRefreshToken() {
  return localStorage.getItem('fitzone_refresh_token')
}

function storeSession(session, user) {
  if (session?.access_token) localStorage.setItem('fitzone_access_token', session.access_token)
  if (session?.refresh_token) localStorage.setItem('fitzone_refresh_token', session.refresh_token)
  if (user) localStorage.setItem('fitzone_user', JSON.stringify(user))
  window.dispatchEvent(new Event('fitzone-auth-change'))
}

function clearSession() {
  localStorage.removeItem('fitzone_access_token')
  localStorage.removeItem('fitzone_refresh_token')
  localStorage.removeItem('fitzone_user')
  window.dispatchEvent(new Event('fitzone-auth-change'))
}

let refreshPromise = null

async function refreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return false
        const data = await response.json().catch(() => null)
        if (!data?.session?.access_token) return false
        storeSession(data.session, data.user || null)
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request(path, { method = 'GET', body, headers = {}, auth = true, retryAuth = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers }
  if (auth) {
    const token = getAccessToken()
    if (token) finalHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try { data = await response.json() } catch { data = null }

  if (response.status === 401 && auth && retryAuth && await refreshSession()) {
    return request(path, { method, body, headers, auth, retryAuth: false })
  }

  if (response.status === 401 && auth) {
    clearSession()
    if (!['/login', '/register'].includes(window.location.pathname)) window.location.assign('/login')
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`
    const error = new Error(message)
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body }),
  put: (path, body, opts) => request(path, { ...opts, method: 'PUT', body }),
  patch: (path, body, opts) => request(path, { ...opts, method: 'PATCH', body }),
  delete: (path, opts) => request(path, { ...opts, method: 'DELETE' }),
  clearSession,
  refresh: refreshSession,
}

export async function checkBackend() {
  return api.get('/api/health', { auth: false })
}
