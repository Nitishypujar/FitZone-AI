function calculateOutcomeScore(event = {}) {
  let score = 0
  if (event.accepted === true) {
    score += 0.25
  }
  if (event.completed === true) {
    score += 0.5
  }
  const difficulty =
    Number(event.difficulty_feedback)
  if (
    Number.isFinite(difficulty) &&
    difficulty >= 3 &&
    difficulty <= 4
  ) {
    score += 0.25
  }
  return Math.min(score, 1)
}
function processRecommendationFeedback(
  event = {}
) {
  return {
    outcome_score:
      calculateOutcomeScore(event),
    recorded_at:
      new Date().toISOString(),
    accepted:
      event.accepted === true,
    completed:
      event.completed === true,
    difficulty_feedback:
      event.difficulty_feedback ?? null,
    user_feedback:
      event.user_feedback ?? null
  }
}
module.exports = {
  calculateOutcomeScore,
  processRecommendationFeedback
}
