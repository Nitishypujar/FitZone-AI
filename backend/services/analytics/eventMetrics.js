function calculateEventMetrics(events = []) {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      total_events: 0,
      accepted_events: 0,
      completed_events: 0,
      acceptance_rate: 0,
      completion_rate: 0,
      average_outcome_score: 0,
      average_difficulty_feedback: null
    }
  }
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
      .map(event => Number(event.outcome_score))
      .filter(Number.isFinite)
  const difficulties =
    events
      .map(
        event =>
          Number(event.difficulty_feedback)
      )
      .filter(
        value =>
          Number.isFinite(value) &&
          value >= 1 &&
          value <= 5
      )
  return {
    total_events: events.length,
    accepted_events: accepted,
    completed_events: completed,
    acceptance_rate:
      accepted / events.length,
    completion_rate:
      completed / events.length,
    average_outcome_score:
      scores.length > 0
        ? scores.reduce(
            (sum, value) => sum + value,
            0
          ) / scores.length
        : 0,
    average_difficulty_feedback:
      difficulties.length > 0
        ? difficulties.reduce(
            (sum, value) => sum + value,
            0
          ) / difficulties.length
        : null
  }
}
module.exports = {
  calculateEventMetrics
}
