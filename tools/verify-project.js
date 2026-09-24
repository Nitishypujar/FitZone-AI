const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
const jsRoots = [path.join(root, 'backend'), path.join(root, 'frontend', 'src')]
const failures = []
let checked = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.js$/.test(entry.name)) yieldFile(full)
  }
}
function yieldFile(file) {
  checked += 1
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
  } catch (error) {
    failures.push(`${path.relative(root, file)}\n${error.stderr?.toString() || error.message}`)
  }
}

for (const dir of jsRoots) walk(dir)

const mustContain = [
  ['backend/server.js', "app.get('/api/workouts/current'"],
  ['backend/server.js', 'workout_id: workout.id'],
  ['backend/services/recommendationEvents.js', '"workout_id"'],
  ['frontend/src/pages/Assistant.jsx', 'fitzone_assistant_v2_'],
  ['frontend/src/pages/Workout.jsx', '/api/workouts/current'],
  ['frontend/src/pages/AIPlan.jsx', 'Exact event linked'],
]
for (const [file, needle] of mustContain) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  if (!source.includes(needle)) failures.push(`Missing contract: ${file} -> ${needle}`)
}

if (failures.length) {
  console.error(`FitZone verification failed. Checked ${checked} JS files.`)
  console.error(failures.join('\n\n'))
  process.exit(1)
}
console.log(`FitZone source verification passed. Checked ${checked} JS files and ${mustContain.length} integration contracts.`)
