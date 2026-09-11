function scoreAdherence(features = {}) {
  const adherence = Math.min(
    Math.max(
      Number(features.adherence_percentage || 0),
      0
    ),
    100
  )
  let level = "low"
  if (adherence >= 80) {
    level = "excellent"
  } else if (adherence >= 65) {
    level = "strong"
  } else if (adherence >= 40) {
    level = "moderate"
  }
  let recommendation = "reduce_friction"
  if (level === "excellent") {
    recommendation = "progress_gradually"
  } else if (level === "strong") {
    recommendation = "maintain_and_progress"
  } else if (level === "moderate") {
    recommendation = "maintain_consistency"
  }
  return {
    score: adherence,
    level,
    recommendation,
    confidence:
      Math.min(
        0.95,
        0.5 + Math.abs(adherence - 50) / 100
      )
  }
}
module.exports = {
  scoreAdherence
}
