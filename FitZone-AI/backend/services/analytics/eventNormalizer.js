function normalizeEvent(event = {}) {
  return {
    id: event.id || null,
    recommendation_type: event.recommendation_type || null,
    recommendation_action:
      event.recommendation_action ||
      event.recommendation_type ||
      null,
    recommendation: event.recommendation || null,
    reason: event.reason || null,
    generated_at: event.generated_at || null,
    accepted:
      event.accepted === true
        ? true
        : event.accepted === false
          ? false
          : null,
    completed:
      event.completed === true
        ? true
        : event.completed === false
          ? false
          : null,
    difficulty_feedback:
      event.difficulty_feedback ?? null,
    user_feedback:
      event.user_feedback ?? null,
    outcome_score:
      Number.isFinite(Number(event.outcome_score))
        ? Number(event.outcome_score)
        : null,
    context_snapshot:
      event.context_snapshot || null
  }
}
function normalizeEvents(events = []) {
  if (!Array.isArray(events)) {
    return []
  }
  return events.map(normalizeEvent)
}
module.exports = {
  normalizeEvent,
  normalizeEvents
}
