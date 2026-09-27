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

assert.match(dashboard, /\/api\/intelligence\/snapshot/)
assert.match(dashboard, /\/api\/recommendation/)
assert.match(dashboard, /\/api\/workouts\/current/)
assert.match(aiPlan, /\/api\/workouts\/generate/)
assert.match(workout, /\/api\/workouts\/current/)
assert.match(workout, /\/api\/workout-logs/)
assert.match(progress, /\/api\/activity\/daily/)
assert.match(progress, /ScrollToTop|activity/)
assert.match(nutrition, /\/api\/nutrition/)
assert.match(nutrition, /\/api\/nutrition\/intelligence/)
assert.match(goals, /\/api\/goals/)
assert.match(goals, /queryClient\.invalidateQueries\(\{ queryKey: \['intelligence'\]/)
assert.match(assistant, /\/api\/assistant\/chat/)
assert.match(assistant, /\/api\/intelligence\/snapshot/)

for (const route of [
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
assert.match(server, /getDailyActivity\(supabase, user.id, \{ timeZone, range \}\)/)
assert.match(server, /\.eq\('workout_id', workoutId\)|\.eq\("workout_id", workoutId\)/)
const scrollToTop = read(path.join(frontend, 'components', 'ScrollToTop.jsx'))
assert.match(app, /ScrollToTop/)
assert.match(scrollToTop, /window\.scrollTo/)
const activityService = read(path.join(backend, 'services', 'activity', 'dailyActivityService.js'))
assert.match(activityService, /logged_at,created_at,exercise_name/)
assert.match(activityService, /today/)
assert.match(server, /goalTypeToProfileGoal/)
assert.match(server, /\.update\(\{ primary_goal: goalTypeToProfileGoal\(goal_type\) \}\)/)

console.log('Product integration contract passed.')
