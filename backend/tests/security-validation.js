const assert = require('assert')
const {
  isValidPositiveIntegerId,
  isValidUuid,
  isValidEmail,
  isNonEmptyString,
  isValidNumber,
} = require('../middleware/validation')

const cases = [
  ['3', true],
  ['1', true],
  ['9223372036854775807', true],
  ['0', false],
  ['-1', false],
  ['3.14', false],
  ['01', false],
  ['3e2', false],
  ['', false],
  ['not-an-id', false],
]

for (const [value, expected] of cases) {
  assert.strictEqual(isValidPositiveIntegerId(value), expected, `goal id case failed: ${value}`)
}

assert.strictEqual(isValidUuid('550e8400-e29b-41d4-a716-446655440000'), true)
assert.strictEqual(isValidUuid('3'), false)
assert.strictEqual(isValidEmail('user@example.com'), true)
assert.strictEqual(isValidEmail('not-an-email'), false)
assert.strictEqual(isNonEmptyString('Paneer rice bowl', 120), true)
assert.strictEqual(isNonEmptyString('x'.repeat(121), 120), false)
assert.strictEqual(isValidNumber(Number('12.5'), 0, 100000), true)
assert.strictEqual(isValidNumber(Number('Infinity'), 0, 100000), false)

console.log('Security/validation unit tests passed.')

// Production CORS must not silently trust localhost.
process.env.NODE_ENV = 'production'
const { corsOptions, helmetOptions } = require('../middleware/security')
let corsError = null
corsOptions.origin('http://localhost:5173', (error, allowed) => {
  corsError = { error, allowed }
})
assert.strictEqual(corsError.error, null)
assert.strictEqual(corsError.allowed, false)
assert.ok(helmetOptions.contentSecurityPolicy)
assert.ok(helmetOptions.hsts)

console.log('Production CORS and Helmet policy checks passed.')

const fs = require('fs')
const path = require('path')
const frontendClient = fs.readFileSync(
  path.join(__dirname, '../../frontend/src/api/client.js'),
  'utf8'
)
assert.ok(
  !frontendClient.includes("'Cache-Control': 'no-store'") &&
    !frontendClient.includes('"Cache-Control": "no-store"'),
  'Frontend must not send Cache-Control as a request header; no-store belongs on API responses.'
)
console.log('Frontend CORS request-header contract passed.')
