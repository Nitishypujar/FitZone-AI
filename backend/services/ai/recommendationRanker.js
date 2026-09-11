function rankRecommendations({
  features,
  adherence,
  readiness
}) {
  const candidates = []
  const readinessScore =
    Number(readiness?.score || 0)
  const adherenceScore =
    Number(adherence?.score || 0)
  if (readinessScore < 40) {
    candidates.push({
      action: "recovery",
      score: 100,
      reason:
        "Current readiness suggests recovery should take priority."
    })
  }
  if (adherenceScore < 40) {
    candidates.push({
      action: "short-easy-workout",
      score: 90,
      reason:
        "A shorter session reduces friction and helps rebuild consistency."
    })
  }
  if (
    Number(features?.weekly_workout_progress || 0) < 50
  ) {
    candidates.push({
      action: "complete-planned-workout",
      score: 85,
      reason:
        "Weekly workout progress is behind target."
    })
  }
  if (adherenceScore >= 70) {
    candidates.push({
      action: "progress-workout",
      score: 70,
      reason:
        "Strong consistency supports gradual progression."
    })
  }
  if (
    features?.nutrition_available &&
    Number(features?.protein_percentage || 0) < 70
  ) {
    candidates.push({
      action: "improve-protein-intake",
      score: 60,
      reason:
        "Logged protein intake is below target."
    })
  }
  candidates.push({
    action: "follow-planned-workout",
    score: 40,
    reason:
      "Continue following the current plan."
  })
  candidates.sort(
    (a, b) => b.score - a.score
  )
  return {
    selected: candidates[0],
    candidates
  }
}
module.exports = {
  rankRecommendations
}
