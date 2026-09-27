const assert = require('node:assert/strict')
const { analyzeFoodText } = require('../services/nutrition/nutritionParser')
const { buildDailyActivity, calculateWorkoutStreaks } = require('../services/activity/dailyActivityService')
const { calculateNutritionTargets } = require('../services/nutritionCalculator')
const { buildNutritionHistory } = require('../services/nutrition/nutritionIntelligence')

function testFoodParsing() {
  const result = analyzeFoodText('2 eggs, 2 chapatis and 150g chicken curry', 'Lunch')
  assert.equal(result.can_save, true)
  assert.equal(result.items.length, 3)
  assert.ok(result.totals.calories > 0)
  assert.ok(result.totals.protein_g > 0)
  assert.ok(result.totals.carbohydrates_g > 0)
  assert.ok(result.totals.fats_g > 0)
}

function testUnmatchedFoodCannotSave() {
  const result = analyzeFoodText('2 eggs and dragonfruit smoothie')
  assert.equal(result.can_save, false)
  assert.ok(result.unmatched_items.length >= 1)
}

function testTargetRequiresProfile() {
  const incomplete = calculateNutritionTargets({ primary_goal: 'Muscle Growth' })
  assert.equal(incomplete.available, false)
  assert.ok(incomplete.missing_fields.includes('age'))
  assert.equal(incomplete.calories, null)

  const complete = calculateNutritionTargets({ age: 21, height_cm: 175, weight_kg: 70, workout_days_per_week: 4, primary_goal: 'Muscle Growth' })
  assert.equal(complete.available, true)
  assert.ok(complete.calories > 0)
  assert.ok(complete.protein_g > 0)
  assert.ok(complete.carbohydrates_g > 0)
  assert.ok(complete.fats_g > 0)
  assert.equal(complete.goal, 'Muscle Growth')
}

function testTimezoneAwareActivity() {
  const result = buildDailyActivity({
    timeZone: 'Asia/Kolkata',
    range: '7d',
    now: new Date('2026-09-24T12:00:00+05:30'),
    workouts: [{ completed: true, completed_at: '2026-09-23T23:30:00Z', duration_minutes: 42 }],
    workoutLogs: [{ completed: true, completed_at: '2026-09-24T00:00:00Z' }],
    nutritionLogs: [{ logged_at: '2026-09-24T00:30:00Z', calories: 500, protein_g: 25 }],
  })
  assert.equal(result.entries.length, 7)
  assert.equal(result.end_date, '2026-09-24')
  const today = result.entries.at(-1)
  assert.equal(today.completed_workouts, 1)
  assert.equal(today.workout_minutes, 42)
  assert.equal(today.meals_logged, 1)
  assert.equal(today.calories_logged, 500)
  assert.equal(today.protein_logged_g, 25)
  assert.equal(result.summary.current_streak, 1)
}


function testStreakContinuesThroughCurrentRestDay() {
  const result = buildDailyActivity({
    timeZone: 'Asia/Kolkata',
    range: '7d',
    now: new Date('2026-09-24T12:00:00+05:30'),
    workouts: [{ completed: true, completed_at: '2026-09-23T10:00:00Z', duration_minutes: 45 }],
    workoutLogs: [],
    nutritionLogs: [],
  })
  assert.equal(result.summary.current_streak, 1)
  assert.equal(result.summary.max_streak, 1)
}

function testStreakIsNotCappedBySelectedWindow() {
  const workouts = Array.from({ length: 8 }, (_, index) => ({
    completed: true,
    completed_at: `2026-09-${String(17 + index).padStart(2, '0')}T10:00:00Z`,
    duration_minutes: 30,
  }))
  const result = buildDailyActivity({
    timeZone: 'Asia/Kolkata',
    range: '7d',
    now: new Date('2026-09-24T12:00:00+05:30'),
    workouts,
    workoutLogs: [],
    nutritionLogs: [],
  })
  assert.equal(result.summary.current_streak, 8)
  assert.equal(result.summary.max_streak, 8)
  const direct = calculateWorkoutStreaks(workouts, 'Asia/Kolkata', '2026-09-24')
  assert.equal(direct.current, 8)
  assert.equal(direct.best, 8)
}

function testHistoryPreservesEmptyDays() {
  const history = buildNutritionHistory([
    { logged_at: '2026-09-24T01:00:00Z', calories: 500, protein_g: 25, carbohydrates_g: 50, fats_g: 10, fiber_g: 5 },
  ], { age: 21, height_cm: 175, weight_kg: 70, workout_days_per_week: 4, primary_goal: 'General Fitness' }, 'Asia/Kolkata', 7, new Date('2026-09-24T12:00:00+05:30'))
  assert.equal(history.length, 7)
  assert.equal(history.at(-1).has_data, true)
  assert.equal(history.slice(0, -1).some((day) => day.has_data), false)
}

testFoodParsing()
testUnmatchedFoodCannotSave()
testTargetRequiresProfile()
testTimezoneAwareActivity()
testStreakContinuesThroughCurrentRestDay()
testStreakIsNotCappedBySelectedWindow()
testHistoryPreservesEmptyDays()
console.log('Nutrition platform tests passed')
