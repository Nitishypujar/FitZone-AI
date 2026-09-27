const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')
const frontend = path.join(root, 'frontend', 'src')
const backend = path.join(root, 'backend')

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

const app = read(path.join(frontend, 'App.jsx'))
const dashboard = read(path.join(frontend, 'pages', 'Dashboard.jsx'))
const aiPlan = read(path.join(frontend, 'pages', 'AIPlan.jsx'))
const workout = read(path.join(frontend, 'pages', 'Workout.jsx'))
const progress = read(path.join(frontend, 'pages', 'Progress.jsx'))
const goals = read(path.join(frontend, 'pages', 'Goals.jsx'))
const nutrition = read(path.join(frontend, 'pages', 'Nutrition.jsx'))
const assistant = read(path.join(frontend, 'pages', 'Assistant.jsx'))
const server = read(path.join(backend, 'server.js'))
const intelligenceRouter = read(path.join(backend, 'services', 'intelligence', 'intelligenceRouter.js'))

assert.match(app, /ProtectedRoute/)
for (const route of ['/dashboard', '/workout', '/ai-plan', '/progress', '/goals', '/nutrition', '/assistant', '/profile']) {
  assert.match(app, new RegExp(`path=["']${route}["']`), `Missing protected route: ${route}`)
}

assert.match(dashboard, /\/api\/fitness\/state/)
assert.match(dashboard, /\/api\/activity\/daily/)
assert.match(dashboard, /today_workout|next_open_workout/)
assert.match(aiPlan, /\/api\/workouts\/generate/)
assert.match(workout, /\/api\/fitness\/state/)
assert.match(workout, /\/api\/workout-logs/)
assert.match(progress, /\/api\/activity\/daily/)
assert.match(nutrition, /\/api\/nutrition/)
assert.match(nutrition, /\/api\/nutrition\/intelligence/)
assert.match(goals, /\/api\/goals/)
assert.match(goals, /queryClient\.invalidateQueries\(\{ queryKey: \['intelligence'\]/)
assert.match(assistant, /\/api\/assistant\/chat/)
assert.match(assistant, /useFitnessBrain/)
for (const [name, source] of [
  ['Dashboard', dashboard],
  ['AIPlan', aiPlan],
  ['Workout', workout],
  ['Progress', progress],
  ['Goals', goals],
  ['Nutrition', nutrition],
  ['Assistant', assistant],
]) {
  assert.match(source, /fitness\-brain|\/api\/fitness\/state|useFitnessBrain/, `${name} is not connected to the canonical fitness brain`)
}
const profile = read(path.join(frontend, 'pages', 'Profile.jsx'))
assert.match(profile, /\/api\/fitness\/state/)

for (const route of [
  '/api/fitness/state',
  '/api/intelligence/snapshot',
  '/api/recommendation',
  '/api/workouts/generate',
  '/api/workouts/current',
  '/api/workout-logs',
  '/api/progress',
  '/api/nutrition',
  '/api/goals',
  '/api/assistant/chat',
]) {
  const source = route.startsWith('/api/intelligence') ? intelligenceRouter : server
  const expectedRoute = route.startsWith('/api/intelligence') ? route.replace('/api/intelligence', '') : route
  assert.match(source, new RegExp(expectedRoute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `Missing backend route contract: ${route}`)
}

assert.match(server, /recommendation_events.*workout_id|workout_id.*recommendation_events/s)
assert.match(server, /\.eq\('workout_id', workoutId\)|\.eq\("workout_id", workoutId\)/)
assert.match(server, /goalTypeToProfileGoal/)
assert.match(server, /\.update\(\{ primary_goal: goalTypeToProfileGoal\(goal_type\) \}\)/)

console.log('Product integration contract passed.')
