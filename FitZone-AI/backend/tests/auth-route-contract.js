const fs = require('fs')
const path = require('path')

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8')
const app = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'App.jsx'), 'utf8')
const guard = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'src', 'components', 'ProtectedRoute.jsx'), 'utf8')

if (!server.includes("app.get('/api/auth/session'")) {
  throw new Error('Protected session endpoint is missing')
}
if (!server.includes("const user = await authenticateUser(req, res)")) {
  throw new Error('Protected session endpoint does not authenticate the bearer token')
}
if (!guard.includes("api.get('/api/auth/session')")) {
  throw new Error('Frontend protected route does not verify the server session')
}
if (!app.includes("<Route element={<ProtectedRoute />}>") || !app.includes("import ProtectedRoute from './components/ProtectedRoute'")) {
  throw new Error('ProtectedRoute is not wrapping the dashboard application')
}
console.log('Protected-route authentication contract passed.')


if (!server.includes("app.post('/api/register/resend-confirmation'")) { throw new Error('Resend confirmation endpoint missing') }
if (!server.includes('emailRedirectTo: getEmailRedirectUrl()')) { throw new Error('Signup confirmation redirect is not explicitly configured') }
console.log('Email confirmation redirect/resend contract passed.')
