const {
  buildIntelligenceFeatures
} = require("./featureBuilder")
const {
  scoreAdherence
} = require("./adherenceScorer")
const {
  scoreReadiness
} = require("./readinessScorer")
const {
  rankRecommendations
} = require("./recommendationRanker")
const {
  validateRecommendation
} = require("./safetyValidator")
function generateNextBestAction(
  userState = {},
  context = {}
) {
  const features =
    buildIntelligenceFeatures(
      userState,
      context
    )
  const adherence =
    scoreAdherence(features)
  const readiness =
    scoreReadiness(features)
  const ranking =
    rankRecommendations({
      features,
      adherence,
      readiness
    })
  const safety =
    validateRecommendation({
      action: ranking.selected.action,
      readiness,
      features
    })
  let selected = ranking.selected
  if (
    !safety.safe &&
    readiness.score < 40
  ) {
    selected = {
      action: "recovery",
      score: 100,
      reason:
        "Recovery was selected by the safety layer."
    }
  }
  return {
    generated_at:
      new Date().toISOString(),
    action: selected.action,
    reason: selected.reason,
    score: selected.score,
    readiness,
    adherence,
    safety,
    features,
    candidates:
      ranking.candidates
  }
}
module.exports = {
  generateNextBestAction
}
