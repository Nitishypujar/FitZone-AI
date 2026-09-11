function buildRecommendationExplanation({
  action,
  reason,
  readiness,
  adherence,
  learningProfile
}) {
  const explanation = []
  if (reason) {
    explanation.push(reason)
  }
  if (readiness?.level) {
    explanation.push(
      `Current readiness is ${readiness.level}.`
    )
  }
  if (adherence?.level) {
    explanation.push(
      `Workout consistency is ${adherence.level}.`
    )
  }
  if (
    learningProfile?.sample_size >= 5 &&
    learningProfile?.preferred_action === action
  ) {
    explanation.push(
      "This action has performed relatively well for you in previous recommendations."
    )
  }
  return explanation
}
module.exports = {
  buildRecommendationExplanation
}
