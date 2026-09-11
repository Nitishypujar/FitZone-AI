function calculateRecommendationConfidence({
  score = 0,
  readinessConfidence = 0,
  adherenceConfidence = 0,
  sampleSize = 0
}) {
  const baseScore =
    Math.min(
      Math.max(Number(score) / 100, 0),
      1
    )
  const readiness =
    Math.min(
      Math.max(Number(readinessConfidence), 0),
      1
    )
  const adherence =
    Math.min(
      Math.max(Number(adherenceConfidence), 0),
      1
    )
  const experience =
    Math.min(
      Number(sampleSize || 0) / 20,
      1
    )
  const confidence =
    baseScore * 0.35 +
    readiness * 0.25 +
    adherence * 0.25 +
    experience * 0.15
  return Number(
    Math.min(
      Math.max(confidence, 0),
      1
    ).toFixed(3)
  )
}
module.exports = {
  calculateRecommendationConfidence
}
