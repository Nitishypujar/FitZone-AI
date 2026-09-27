const base = process.env.TEST_BASE_URL || 'http://localhost:5000'
function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`)
  }
}
async function main() {
  console.log('=== FitZone AI Security Smoke Test ===')
  const root = await fetch(`${base}/`)
  console.log('ROOT:', root.status)
  assert(root.status === 200, 'Root endpoint should return 200')
  const unauth = await fetch(`${base}/api/user-state`)
  console.log('UNAUTH /api/user-state:', unauth.status)
  assert(
    unauth.status === 401,
    'Protected endpoint must reject unauthenticated requests'
  )
  const corsAllowed = await fetch(`${base}/api/health`, {
    headers: { Origin: 'http://localhost:5173' }
  })
  const allowedOrigin =
    corsAllowed.headers.get('access-control-allow-origin')
  console.log('CORS allowed origin:', allowedOrigin)
  assert(
    allowedOrigin === 'http://localhost:5173',
    'Configured frontend origin must receive CORS permission'
  )
  const corsBlocked = await fetch(`${base}/api/health`, {
    headers: { Origin: 'https://evil.example.com' }
  })
  const blockedOrigin =
    corsBlocked.headers.get('access-control-allow-origin')
  console.log('CORS blocked origin header:', blockedOrigin)
  assert(
    blockedOrigin === null,
    'Unauthorized origin must not receive Access-Control-Allow-Origin'
  )
  const login = await fetch(`${base}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '', password: '' })
  })
  console.log('LOGIN validation/rate-limit:', login.status)
  assert(
    login.status === 400 || login.status === 429,
    'Login should return validation 400 or rate-limit 429'
  )
  console.log('=== ALL SECURITY SMOKE TESTS PASSED ===')
}
main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
