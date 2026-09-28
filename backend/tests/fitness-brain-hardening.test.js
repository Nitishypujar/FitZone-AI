const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { calculateWeeklyWorkoutProgress } = require('../services/weeklyProgress')
const { buildFitnessBrain } = require('../services/fitnessBrain')
const { buildUserState } = require('../services/userState')
const { generatePersonalizedWorkout, normalizeGoal } = require('../services/ai/personalizedWorkoutEngine')
const { calculateNutritionTargets } = require('../services/nutritionCalculator')

const root = path.resolve(__dirname, '..', '..')
const serverSource = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8')
const appSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'App.jsx'), 'utf8')
const scrollSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'components', 'ScrollToTop.jsx'), 'utf8')
const assistantSource = fs.readFileSync(path.join(root, 'backend', 'services', 'assistantService.js'), 'utf8')
const mlSource = fs.readFileSync(path.join(root, 'ai-service', 'main.py'), 'utf8')

const week = calculateWeeklyWorkoutProgress([
  { completed: true, completed_at: '2026-09-20T20:00:00.000Z', duration_minutes: 30 },
  { completed: true, completed_at: '2026-09-21T18:00:00.000Z', duration_minutes: 40 },
], new Date('2026-09-22T01:00:00.000Z'), 'Asia/Kolkata')
assert.equal(week.week_start_date, '2026-09-21')
assert.equal(week.weekly_completed_workouts, 2)
assert.equal(week.weekly_active_minutes, 70)

const legacyWeek = calculateWeeklyWorkoutProgress([
  { completed: true, scheduled_date: '2026-09-22', duration_minutes: 23 },
], new Date('2026-09-22T10:00:00.000Z'), 'Asia/Kolkata')
assert.equal(legacyWeek.weekly_completed_workouts, 1)
assert.equal(legacyWeek.weekly_active_minutes, 23)

const state = buildUserState({
  profile: { primary_goal: 'General Fitness', fitness_level: 'Beginner', workout_days_per_week: 4, preferred_workout_duration: 30 },
  goals: [{ goal_type: 'general-fitness', weekly_workout_target: 5, weekly_active_minute_target: 200, completed: false }],
  workouts: [
    { id: 1, scheduled_date: '2026-09-20', completed: false },
    { id: 2, scheduled_date: '2026-09-27', completed: false },
  ],
  workoutLogs: [],
  nutritionToday: {},
  nutritionTargets: { available: true, calories: 2000, protein_g: 120, carbohydrates_g: 200, fats_g: 70 },
  progress: [],
  weeklyWorkoutProgress: { weekly_completed_workouts: 0, weekly_active_minutes: 0, week_start: '2026-09-21T00:00:00.000Z', week_end: '2026-09-28T00:00:00.000Z' },
  timeZone: 'UTC',
})
assert.equal(state.workout_state.current_workout.id, 2)

for (const goal of ['Fat Loss','Weight Gain','Muscle Growth','Strength','Endurance','General Fitness','Maintain Fitness','Flexibility','Stamina']) {
  const workout = generatePersonalizedWorkout({
    profile: { primary_goal: goal, fitness_level: 'Beginner', preferred_workout_duration: 30 },
    goalState: { weekly_workout_target: 4, weekly_active_minute_target: 150 },
    weeklyProgress: { weekly_completed_workouts: 1, weekly_active_minutes: 30 },
    recommendation: { action: 'follow-planned-workout' },
  })
  assert.equal(workout.goal, normalizeGoal(goal))
  assert.ok(workout.exercises.length > 0, `${goal} produced no exercises`)
}
assert.equal(normalizeGoal('Stamina'), 'stamina')
assert.notEqual(normalizeGoal('Stamina'), normalizeGoal('Endurance'))
const flex = generatePersonalizedWorkout({ profile: { primary_goal: 'Flexibility', fitness_level: 'Beginner', preferred_workout_duration: 30 } })
assert.ok(flex.exercises.every((exercise) => exercise.type === 'mobility'))

const base = { age: 22, height_cm: 175, weight_kg: 70, workout_days_per_week: 4 }
const loss = calculateNutritionTargets({ ...base, primary_goal: 'Fat Loss' })
const gain = calculateNutritionTargets({ ...base, primary_goal: 'Weight Gain' })
const maintain = calculateNutritionTargets({ ...base, primary_goal: 'Maintain Fitness' })
assert.ok(loss.calories < maintain.calories)
assert.ok(gain.calories > maintain.calories)
assert.ok(loss.protein_g >= maintain.protein_g)

assert.match(appSource, /ScrollToTop/)
assert.match(scrollSource, /scrollRestoration/)
assert.match(scrollSource, /pathname, search, hash/)
assert.match(scrollSource, /scrollIntoView/)
assert.match(serverSource, /\.eq\('workout_id', workoutId\)/)
assert.doesNotMatch(serverSource, /recommended_workout_id \?\? snapshot\.recommendation_workout_id/)
assert.match(serverSource, /scheduled_date === today/)
assert.match(serverSource, /Backward-compatible response/)
assert.match(serverSource, /canonicalGoal/)
assert.match(serverSource, /Unable to fetch nutrition goals/)
assert.match(serverSource, /profile.primary_goal = canonicalGoal/)
assert.match(mlSource, /MIN_TRAINING_SAMPLES = 5/)
assert.match(mlSource, /At least \{MIN_TRAINING_SAMPLES\} real outcome examples/)
assert.match(assistantSource, /canonical primary goal/i)
assert.match(assistantSource, /assistantRecommendationConflictsWithGoal/)

const hookSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'hooks', 'useFitnessBrain.js'), 'utf8')
assert.match(hookSource, /\/api\/intelligence\/snapshot/)
assert.match(hookSource, /snapshot\?\.intelligence \|\| snapshot/)
assert.match(fs.readFileSync(path.join(root, 'frontend', 'src', 'pages', 'Dashboard.jsx'), 'utf8'), /!currentWorkoutCandidate\.completed/)
console.log('FitZone hardening regression tests passed.')
