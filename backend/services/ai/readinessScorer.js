function scoreReadiness(features = {}) {
  const adherence =
    Number(features.adherence_percentage || 0)
  const recentSessions =
    Number(features.recent_sessions || 0)
  const recentMinutes =
    Number(features.recent_active_minutes || 0)
  let score = 70
  if (adherence < 40) {
    score -= 10
  } else if (adherence >= 75) {
    score += 10
  }
  if (
    recentSessions >= 6 ||
    recentMinutes >= 360
  ) {
    score -= 30
  } else if (
    recentSessions >= 3 ||
    recentMinutes >= 150
  ) {
    score -= 10
  } else if (recentSessions <= 1) {
    score -= 5
  }
  score = Math.min(
    Math.max(score, 0),
    100
  )
  let level = "moderate"
  if (score >= 80) {
    level = "high"
  } else if (score < 45) {
    level = "low"
  }
  return {
    score,
    level,
    confidence: 0.72,
    reasons: [
      "Adherence: " +
        Math.round(adherence) +
        "%",
      "Recent sessions: " +
        recentSessions,
      "Recent active minutes: " +
        recentMinutes
    ]
  }
}
module.exports = {
  scoreReadiness
}
