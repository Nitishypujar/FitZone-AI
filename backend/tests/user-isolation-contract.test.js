const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8')
const recommendationEvents = fs.readFileSync(path.join(__dirname, '..', 'services', 'recommendationEvents.js'), 'utf8')

// Critical user-owned reads/writes must scope records to the authenticated user.
const protectedTables = [
  'profiles',
  'goals',
  'workouts',
  'workout_logs',
  'nutrition_logs',
  'progress_logs',
  'recommendation_events',
]

for (const table of protectedTables) {
  const occurrences = [...server.matchAll(new RegExp(`\\.from\\(['"]${table}['"]\\)`, 'g'))]
  assert.ok(occurrences.length > 0, `No server access found for ${table}`)
}

// These patterns are the core ownership boundary used throughout the API.
assert.match(server, /\.eq\(['"]user_id['"], user\.id\)/)
assert.match(server, /\.eq\(['"]id['"], user\.id\)/)
assert.match(server, /\.eq\(['"]id['"], workoutId\)/)
assert.match(server, /workoutId[\s\S]{0,500}\.eq\(['"]user_id['"], user\.id\)/)
assert.match(recommendationEvents, /\.eq\(['"]id['"], eventId\)/)
assert.match(recommendationEvents, /eventId[\s\S]{0,500}\.eq\(['"]user_id['"], userId\)/)

// Recommendation completion must resolve by the authenticated user's exact workout link.
assert.match(server, /\.eq\(['"]workout_id['"], workoutId\)/)
assert.match(server, /\.eq\(['"]user_id['"], user\.id\)/)

console.log('User-isolation source contract passed.')
