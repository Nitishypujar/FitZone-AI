const assert = require('assert')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const server = fs.readFileSync(path.join(root, 'backend/server.js'), 'utf8')
const security = fs.readFileSync(path.join(root, 'backend/middleware/security.js'), 'utf8')
const client = fs.readFileSync(path.join(root, 'frontend/src/api/client.js'), 'utf8')
const goals = fs.readFileSync(path.join(root, 'frontend/src/pages/Goals.jsx'), 'utf8')
const nutrition = fs.readFileSync(path.join(root, 'frontend/src/pages/Nutrition.jsx'), 'utf8')

assert(server.includes("app.put('/api/goals/:id'"))
assert(server.includes('isValidPositiveIntegerId(goalId)'))
assert(!server.includes('Goal ID must be a valid UUID'))
assert(server.includes(".eq('user_id', user.id)"))
assert(server.includes("app.post('/api/assistant/chat', assistantLimiter"))
assert(server.includes("app.post('/api/workouts/generate', generationLimiter"))
assert(server.includes("app.post('/api/ml/train', mlTrainingLimiter"))
assert(server.includes("res.setHeader('Cache-Control', 'no-store')"))
assert(security.includes('contentSecurityPolicy'))
assert(security.includes('process.env.NODE_ENV !== ' + "'production'"))
assert(security.includes('assistantLimiter'))
assert(security.includes('generationLimiter'))
assert(security.includes('mlTrainingLimiter'))
assert(security.includes('frameAncestors'))
assert(security.includes('referrerPolicy'))
assert(security.includes('hsts'))
assert(client.includes("response.status === 401"))
assert(goals.includes("/api/goals/${goalId}"))
assert(nutrition.includes('meal-form'))
assert(nutrition.includes('/api/nutrition'))

const dangerousPatterns = [
  /dangerouslySetInnerHTML/,
  /document\.write\(/,
  /eval\(/,
  /new Function\(/,
]
function collectFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? collectFiles(full) : [full]
  })
}

for (const file of collectFiles(path.join(root, 'frontend/src'))) {
  if (!/\.(js|jsx|ts|tsx)$/.test(file)) continue
  const source = fs.readFileSync(file, 'utf8')
  for (const pattern of dangerousPatterns) {
    assert(!pattern.test(source), `unexpected dangerous pattern in ${file}: ${pattern}`)
  }
}

console.log('FitZone security static checks passed.')
