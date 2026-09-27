function buildUserLearningProfile({
  events = [],
  metrics = {},
  actionAnalytics = []
}) {
  const preferredAction =
    actionAnalytics.length > 0
      ? [...actionAnalytics]
          .filter(
            item =>
              Number(item.total || 0) >= 2
          )
          .sort(
            (a, b) =>
              b.completion_rate -
              a.completion_rate
          )[0]
      : null
  const learningStage =
    events.length < 5
      ? "cold-start"
      : events.length < 20
        ? "early-learning"
        : "personalized"
  return {
    learning_stage: learningStage,
    sample_size: events.length,
    completion_rate:
      Number(metrics.completion_rate || 0),
    acceptance_rate:
      Number(metrics.acceptance_rate || 0),
    average_outcome_score:
      Number(
        metrics.average_outcome_score || 0
      ),
    preferred_action:
      preferredAction?.action || null,
    preferred_action_completion_rate:
      preferredAction
        ? Number(
            preferredAction.completion_rate || 0
          )
        : 0
  }
}
module.exports = {
  buildUserLearningProfile
}
