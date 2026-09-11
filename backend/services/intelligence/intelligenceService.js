const {
  buildFitnessContext
} = require("../fitnessContext")
const {
  buildUserState
} = require("../userState")
const {
  calculateNutritionTargets
} = require("../nutritionCalculator")
const {
  generateNextBestAction
} = require("../ai/nextBestAction")
const {
  getRecommendationLearning
} = require("./learningService")
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
    buildUserState(
      context,
      nutritionTargets
    )
  const nextBestAction =
    generateNextBestAction(
      userState,
      context
    )
  const learning =
    await getRecommendationLearning(
      supabase,
      userId
    )
  return {
    generated_at:
      new Date().toISOString(),
    user_state:
      userState,
    next_best_action:
      nextBestAction,
    learning
  }
}
module.exports = {
  buildIntelligenceSnapshot
}
