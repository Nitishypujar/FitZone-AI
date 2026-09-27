const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { calculateWeeklyWorkoutProgress } = require('../services/weeklyProgress')
const { generateAdaptiveRecommendation } = require('../services/adaptiveRecommendation')
const { generateNextBestAction } = require('../services/ai/nextBestAction')
const { generatePersonalizedWorkout } = require('../services/ai/personalizedWorkoutEngine')
const { calculateOutcomeScore } = require('../services/recommendationEvents')
const { buildIntelligenceFeatures } = require('../services/ai/featureBuilder')

const root = path.resolve(__dirname, '..', '..')
const profileSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'pages', 'Profile.jsx'), 'utf8')
const profileCss = fs.readFileSync(path.join(root, 'frontend', 'src', 'pages', 'Profile.css'), 'utf8')
const goalsSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'pages', 'Goals.jsx'), 'utf8')
const aiPlanSource = fs.readFileSync(path.join(root, 'frontend', 'src', 'pages', 'AIPlan.jsx'), 'utf8')

const serverSource = fs.readFileSync(path.join(root, 'backend', 'server.js'), 'utf8')

function testTimezoneAwareCalendarWeek() {
  const workouts = [
    { completed: true, completed_at: '2026-09-20T20:00:00.000Z', duration_minutes: 30 },
    { completed: true, completed_at: '2026-09-20T17:00:00.000Z', duration_minutes: 45 },
  ]

  const result = calculateWeeklyWorkoutProgress(
    workouts,
    new Date('2026-09-21T01:00:00.000Z'),
    'Asia/Kolkata'
  )

  assert.equal(result.week_start_date, '2026-09-21')
  assert.equal(result.weekly_completed_workouts, 1)
  assert.equal(result.weekly_active_minutes, 30)
  assert.equal(result.time_zone, 'Asia/Kolkata')
}

function testNoTargetDoesNotPretendToBeBehind() {
  const recommendation = generateAdaptiveRecommendation({
    profile: { primary_goal: 'General Fitness', fitness_level: 'beginner' },
    goal_state: {
      weekly_workout_target: null,
      weekly_active_minute_target: null,
      weekly_workout_progress: 0,
      weekly_active_minute_progress: 0,
    },
    workout_state: {
      adherence_percentage: 80,
      recent_training_load: { sessions: 1, active_minutes: 30 },
    },
    nutrition_state: { available: false },
  })

  assert.equal(recommendation.signals.weekly_activity.priority, 'no-target')
  assert.notEqual(recommendation.next_action.action, 'complete-planned-workout')
}


async function testDecisionLayerRespectsMissingTargets() {
  const result = await generateNextBestAction(
    {
      profile: { primary_goal: 'General Fitness', fitness_level: 'beginner' },
      goal_state: {
        weekly_workout_target: null,
        weekly_active_minute_target: null,
        weekly_workout_progress: 0,
        weekly_active_minute_progress: 0,
      },
      workout_state: {
        adherence_percentage: 80,
        recent_training_load: { sessions: 1, active_minutes: 30 },
      },
      nutrition_state: { available: false },
    },
    { profile: { primary_goal: 'General Fitness' } },
    { contextual_analytics: [] }
  )

  assert.ok(result.action)
  assert.equal(result.features.weekly_targets_configured, false)
  assert.ok(!result.candidates.some((item) => item.action === 'complete-planned-workout' && item.reason.includes('configured target')))
}

function testIncompleteProfileBecomesExplicitDecision() {
  const features = buildIntelligenceFeatures(
    {
      profile: { primary_goal: null, fitness_level: null, workout_days_per_week: 0, preferred_workout_duration: 0 },
      goal_state: {},
      workout_state: {},
      nutrition_state: {},
    },
    { profile: { primary_goal: null, fitness_level: null, workout_days_per_week: 0, preferred_workout_duration: 0 } },
  )
  assert.equal(features.profile_complete, false)
  assert.equal(features.primary_goal, null)
  assert.equal(features.fitness_level, null)
}

function testPersonalizedWorkoutPreservesMissingTarget() {
  const workout = generatePersonalizedWorkout({
    profile: {
      primary_goal: 'General Fitness',
      fitness_level: 'Beginner',
      preferred_workout_duration: 30,
    },
    goalState: {
      weekly_workout_target: null,
      weekly_active_minute_target: null,
    },
    weeklyProgress: {
      weekly_completed_workouts: 1,
      weekly_active_minutes: 30,
    },
    recommendation: { action: 'follow-planned-workout' },
  })

  assert.equal(workout.weekly_target, null)
  assert.equal(workout.weekly_remaining, null)
  assert.equal(workout.personalization.weekly_target_configured, false)
}

function testOutcomeScoreUsesExistingFormula() {
  assert.equal(
    calculateOutcomeScore({ accepted: true, completed: true, difficulty_feedback: 3 }),
    1
  )
  assert.equal(
    calculateOutcomeScore({ accepted: false, completed: true, difficulty_feedback: null }),
    0.5
  )
}

function testProfileUIAndBackendContract() {
  assert.match(profileSource, /className="profile-card"/)
  assert.match(profileSource, /value: 'beginner'/)
  assert.match(profileSource, /value: 'intermediate'/)
  assert.match(profileSource, /value: 'advanced'/)
  assert.match(profileSource, /value={profile\.fitness_level \|\| ''}/)
  assert.match(profileCss, /\.profile-card\s*\{/)
  assert.match(profileCss, /\.profile-form-grid\s*\{/)
  assert.match(goalsSource, /useState\(null\)/)
  assert.match(goalsSource, /weeklyTarget === null \? 'Not set'/)
  assert.match(aiPlanSource, /workout_days_per_week != null/)
  assert.match(aiPlanSource, /preferred_workout_duration != null/)
  assert.match(aiPlanSource, /PROFILE required|Profile required/)
  assert.match(aiPlanSource, /Complete Profile →/)
  assert.match(serverSource, /goalTypeToProfileGoal/)
  assert.match(serverSource, /'fat-loss': 'Fat Loss'/)
  assert.match(serverSource, /'muscle-growth': 'Muscle Growth'/)
  assert.match(serverSource, /fitness_level: fitness_level \?\? null/)
  assert.match(serverSource, /primary_goal: primary_goal \?\? null/)
  assert.match(serverSource, /workout_days_per_week: workout_days_per_week \?\? null/)
  assert.match(serverSource, /PROFILE_INCOMPLETE/)
  assert.match(serverSource, /Complete your Profile before generating a personalized workout/)
  assert.match(serverSource, /fitness_level: fitness_level \?\? null/)
  assert.match(serverSource, /preferred_workout_duration:\n          preferred_workout_duration \?\? null/)
}

async function main() {
  testTimezoneAwareCalendarWeek()
  testNoTargetDoesNotPretendToBeBehind()
  await testDecisionLayerRespectsMissingTargets()
  testIncompleteProfileBecomesExplicitDecision()
  testPersonalizedWorkoutPreservesMissingTarget()
  testOutcomeScoreUsesExistingFormula()
  testProfileUIAndBackendContract()
  console.log('FitZone completion regression tests passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
