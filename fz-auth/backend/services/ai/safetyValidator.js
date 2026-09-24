const HIGH_RISK_ACTIONS = new Set([
  "maximum_intensity",
  "rapid_volume_increase",
  "extreme_calorie_restriction"
])
const RECOVERY_ACTIONS = new Set([
  "recovery",
  "light_recovery"
])
function validateRecommendation({
  action,
  readiness,
  features
}) {
  const warnings = []
  const constraints = []
  const readinessScore =
    Number(readiness?.score || 0)
  if (
    readinessScore < 40 &&
    !RECOVERY_ACTIONS.has(action)
  ) {
    warnings.push(
      "Readiness is low."
    )
    constraints.push(
      "Avoid high-intensity training."
    )
  }
  if (
    readinessScore < 55 &&
    HIGH_RISK_ACTIONS.has(action)
  ) {
    warnings.push(
      "Requested action exceeds current readiness."
    )
    constraints.push(
      "Replace with a lower-intensity session."
    )
  }
  if (
    Number(features?.recent_sessions || 0) >= 6
  ) {
    warnings.push(
      "Recent training load is high."
    )
    constraints.push(
      "Prioritize recovery."
    )
  }
  return {
    safe: warnings.length === 0,
    warnings,
    constraints
  }
}
module.exports = {
  validateRecommendation
}
