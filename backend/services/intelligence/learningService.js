const {
  normalizeEvents
} = require("../analytics/eventNormalizer")
const {
  calculateEventMetrics
} = require("../analytics/eventMetrics")
const {
  groupEventsByAction
} = require("../analytics/actionAnalytics")
const {
  buildUserLearningProfile
} = require("../ai/memory/userLearningProfile")
const {
  selectPreferredAction
} = require("../ai/memory/preferredAction")
async function getRecommendationLearning(
  supabase,
  userId
) {
  const { data, error } = await supabase
    .from("recommendation_events")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", {
      ascending: false
    })
  if (error) {
    throw new Error(error.message)
  }
  const events =
    normalizeEvents(data || [])
  const metrics =
    calculateEventMetrics(events)
  const actionAnalytics =
    groupEventsByAction(events)
  const learningProfile =
    buildUserLearningProfile({
      events,
      metrics,
      actionAnalytics
    })
  const preferredAction =
    selectPreferredAction(
      actionAnalytics
    )
  return {
    metrics,
    action_analytics:
      actionAnalytics,
    learning_profile:
      learningProfile,
    preferred_action:
      preferredAction
  }
}
module.exports = {
  getRecommendationLearning
}
