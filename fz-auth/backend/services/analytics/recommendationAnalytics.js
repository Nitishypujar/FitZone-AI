function summarizeRecommendationEvents(
  events = []
) {
  if (!Array.isArray(events)) {
    return {
      total: 0,
      accepted: 0,
      completed: 0,
      acceptance_rate: 0,
      completion_rate: 0,
      average_outcome_score: 0
    }
  }
  const total = events.length
  const accepted =
    events.filter(
      event => event.accepted === true
    ).length
  const completed =
    events.filter(
      event => event.completed === true
    ).length
  const scores =
    events
      .map(
        event =>
          Number(event.outcome_score)
      )
      .filter(Number.isFinite)
  return {
    total,
    accepted,
    completed,
    acceptance_rate:
      total > 0
        ? accepted / total
        : 0,
    completion_rate:
      total > 0
        ? completed / total
        : 0,
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
  summarizeRecommendationEvents
}
