const assert = require('assert')
const { detectFitnessIntent } = require('../services/ai/intentDetector')
const { calculateWeeklyWorkoutProgress } = require('../services/weeklyProgress')
const { buildUserState } = require('../services/userState')
const { generatePersonalizedWorkout } = require('../services/ai/personalizedWorkoutEngine')

function testIntentDetection() {
  assert.strictEqual(detectFitnessIntent('How much protein did I log today?'), 'nutrition')
  assert.strictEqual(detectFitnessIntent('What should I do for my workout?'), 'workout')
  assert.strictEqual(detectFitnessIntent('How am I doing this week?'), 'progress')
  assert.strictEqual(detectFitnessIntent('What is my weekly target?'), 'goals')
}

function testWeeklyProgressUsesCompletionDate() {
  const workouts = [
    { id: 1, completed: true, completed_at: '2026-09-21T10:00:00.000Z', duration_minutes: 40 },
    { id: 2, completed: true, completed_at: '2026-09-10T10:00:00.000Z', duration_minutes: 60 },
    { id: 3, completed: false, completed_at: null, duration_minutes: 30 },
  ]

  const result = calculateWeeklyWorkoutProgress(workouts, new Date('2026-09-24T12:00:00.000Z'))
  assert.strictEqual(result.weekly_completed_workouts, 1)
  assert.strictEqual(result.weekly_active_minutes, 40)
}

function testUserStateCarriesCurrentWorkout() {
  const state = buildUserState({
    profile: { primary_goal: 'Build Muscle', fitness_level: 'Intermediate' },
    goals: [{ completed: false, weekly_workout_target: 4, weekly_active_minute_target: 180 }],
    workouts: [{ id: 42, scheduled_date: new Date().toISOString().slice(0, 10), completed: false, duration_minutes: 45 }],
    workoutLogs: [],
    nutritionToday: {},
    nutritionTargets: { calories: 2000, protein_g: 120, carbohydrates_g: 200, fats_g: 65 },
    progress: [],
    weeklyWorkoutProgress: { weekly_completed_workouts: 1, weekly_active_minutes: 45 },
  })

  assert.strictEqual(state.workout_state.current_workout.id, 42)
  assert.strictEqual(state.goal_state.current_weekly_workouts, 1)
}

function testGoalAwareWorkoutShape() {
  const workout = generatePersonalizedWorkout({
    profile: { primary_goal: 'Build Muscle', fitness_level: 'Intermediate', preferred_workout_duration: 45 },
    goalState: { weekly_workout_target: 4, weekly_active_minute_target: 180 },
    weeklyProgress: { weekly_completed_workouts: 2, weekly_active_minutes: 90 },
    trainingLoad: {},
    recommendation: { action: 'progress-workout', score: 78, ml_enabled: true },
  })

  assert.ok(workout.exercises.length > 0)
  assert.ok(workout.exercises.every((exercise) => exercise.sets && exercise.repetitions))
  assert.strictEqual(workout.personalization.recommendation_action, 'progress-workout')
}

testIntentDetection()
testWeeklyProgressUsesCompletionDate()
testUserStateCarriesCurrentWorkout()
testGoalAwareWorkoutShape()
console.log('FitZone adaptive smoke tests passed.')
