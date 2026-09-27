function buildPersonalizationProfile(
  events = []
) {
  if (
    !Array.isArray(events) ||
    events.length === 0
  ) {
    return {
      sample_size: 0,
      completion_rate: 0,
      acceptance_rate: 0,
      preferred_actions: [],
      average_outcome_score: 0
    }
  }
  const completed =
    events.filter(
      event => event.completed === true
    ).length
  const accepted =
    events.filter(
      event => event.accepted === true
    ).length
  const scores =
    events
      .map(
        event =>
          Number(event.outcome_score)
      )
      .filter(Number.isFinite)
  const actionStats = {}
  for (const event of events) {
    const action =
      event.recommendation_action ||
      event.recommendation_type
    if (!action) continue
    if (!actionStats[action]) {
      actionStats[action] = {
        action,
        count: 0,
        completed: 0
      }
    }
    actionStats[action].count += 1
    if (event.completed === true) {
      actionStats[action].completed += 1
    }
  }
  const preferredActions =
    Object.values(actionStats)
      .map(item => ({
        ...item,
        completion_rate:
          item.count > 0
            ? item.completed / item.count
            : 0
      }))
      .sort(
        (a, b) =>
          b.completion_rate -
          a.completion_rate
      )
  return {
    sample_size: events.length,
    completion_rate:
      completed / events.length,
    acceptance_rate:
      accepted / events.length,
    preferred_actions:
      preferredActions,
    average_outcome_score:
      scores.length > 0
        ? scores.reduce(
            (sum, value) =>
              sum + value,
            0
          ) / scores.length
        : 0
  }
}
module.exports = {
  buildPersonalizationProfile
}
