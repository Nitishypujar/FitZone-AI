// Single source of truth for talking to the FitZone backend.
// Every page must import from here instead of hardcoding a URL.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('fitzone_access_token')
}

async function request(path, { method = 'GET', body, headers = {}, auth = true } = {}) {
  const finalHeaders = { 'Content-Type': 'application/json', ...headers }

  if (auth) {
    const token = getToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    // Some endpoints (e.g. health) may not return JSON on error; ignore.
  }

  if (response.status === 401 && auth) {
    localStorage.removeItem('fitzone_access_token')
    localStorage.removeItem('fitzone_refresh_token')
    localStorage.removeItem('fitzone_user')
    window.dispatchEvent(new Event('fitzone-auth-change'))
    if (!['/login', '/register'].includes(window.location.pathname)) {
      window.location.assign('/login')
    }
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
}

// Kept for backward compatibility with the one existing caller (api.js -> checkBackend).
export async function checkBackend() {
  return api.get('/api/health', { auth: false })
}
