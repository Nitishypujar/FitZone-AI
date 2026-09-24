const {
  buildFitnessContext,
} = require('../fitnessContext')

const {
  buildUserState,
} = require('../userState')

const {
  calculateNutritionTargets,
} = require('../nutritionCalculator')

const {
  generateNextBestAction,
} = require('../ai/nextBestAction')

const {
  getRecommendationLearning,
} = require('./learningService')

async function buildIntelligenceFromContext(supabase, userId, context) {
  if (!context) {
    throw new Error('Fitness context is required')
  }

  const nutritionTargets = calculateNutritionTargets(context.profile)

  const userState = buildUserState({
    profile: context.profile,
    goals: context.goals,
    workouts: context.recent_workouts,
    workoutLogs: context.recent_workout_logs,
    nutritionToday: context.nutrition_today,
    nutritionTargets,
    progress: context.recent_progress,
    weeklyWorkoutProgress: context.weekly_workout_progress,
  })

  const learning = await getRecommendationLearning(supabase, userId)

  const nextBestAction = await generateNextBestAction(
    userState,
    context,
    learning
  )

  return {
    generated_at: new Date().toISOString(),
    user_state: userState,
    next_best_action: nextBestAction,
    learning,
    nutrition_targets: nutritionTargets,
  }
}

async function buildIntelligenceSnapshot(supabase, userId) {
  const context = await buildFitnessContext(supabase, userId)
  return buildIntelligenceFromContext(supabase, userId, context)
}

module.exports = {
  buildIntelligenceSnapshot,
  buildIntelligenceFromContext,
}
