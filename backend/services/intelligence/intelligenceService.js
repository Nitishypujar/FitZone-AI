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

async function buildIntelligenceSnapshot(
  supabase,
  userId
) {
  const context =
    await buildFitnessContext(
      supabase,
      userId
    )

  const nutritionTargets =
    calculateNutritionTargets(
      context.profile
    )

  const userState =
    buildUserState({
      profile:
        context.profile,

      goals:
        context.goals,

      workouts:
        context.recent_workouts,

      workoutLogs:
        context.recent_workout_logs,

      nutritionToday:
        context.nutrition_today,

      nutritionTargets,

      progress:
        context.recent_progress,

      weeklyWorkoutProgress:
        context.weekly_workout_progress,
    })

  /*
   * Learning must be loaded before
   * recommendation generation so the
   * ranking engine can use historical
   * contextual outcomes.
   */
  const learning =
    await getRecommendationLearning(
      supabase,
      userId
    )

  const nextBestAction =
    await generateNextBestAction(
      userState,
      context,
      learning
    )

  return {
    generated_at:
      new Date().toISOString(),

    user_state:
      userState,

    next_best_action:
      nextBestAction,

    learning,
  }
}

module.exports = {
  buildIntelligenceSnapshot,
}