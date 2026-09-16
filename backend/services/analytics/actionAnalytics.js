function normalizeContextValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "unknown";
  }

  return String(value);
}

function groupEventsByAction(events = []) {
  if (!Array.isArray(events)) {
    return [];
  }

  const groups = {};

  for (const event of events) {
    const action =
      event.recommendation_action ||
      event.recommendation_type ||
      "unknown";

    if (!groups[action]) {
      groups[action] = {
        action,
        total: 0,
        accepted: 0,
        completed: 0,
        outcome_scores: []
      };
    }

    const group = groups[action];

    group.total += 1;

    if (event.accepted === true) {
      group.accepted += 1;
    }

    if (event.completed === true) {
      group.completed += 1;
    }

    const score =
      Number(event.outcome_score);

    if (Number.isFinite(score)) {
      group.outcome_scores.push(score);
    }
  }

  return Object.values(groups)
    .map(group => ({
      action: group.action,
      total: group.total,
      accepted: group.accepted,
      completed: group.completed,

      acceptance_rate:
        group.total > 0
          ? group.accepted / group.total
          : 0,

      completion_rate:
        group.total > 0
          ? group.completed / group.total
          : 0,

      average_outcome_score:
        group.outcome_scores.length > 0
          ? group.outcome_scores.reduce(
              (sum, value) => sum + value,
              0
            ) /
            group.outcome_scores.length
          : 0
    }))
    .sort(
      (a, b) =>
        b.completion_rate -
        a.completion_rate
    );
}

function getEventContext(event = {}) {
  const snapshot =
    event.context_snapshot || {};

  const workoutState =
    snapshot.workout_state || {};

  const profile =
    snapshot.profile || {};

  const nextAction =
    snapshot.next_best_action || {};

  return {
    adherence_level:
      normalizeContextValue(
        workoutState.adherence_level
      ),

    readiness_level:
      normalizeContextValue(
        nextAction.readiness?.level ||
        event.readiness_level
      ),

    fitness_level:
      normalizeContextValue(
        profile.fitness_level
      ),

    primary_goal:
      normalizeContextValue(
        profile.primary_goal
      )
  };
}

function buildContextKey(context = {}) {
  return [
    context.adherence_level,
    context.readiness_level,
    context.fitness_level,
    context.primary_goal
  ].join("|");
}

function groupEventsByContext(
  events = []
) {
  if (!Array.isArray(events)) {
    return [];
  }

  const groups = {};

  for (const event of events) {
    const action =
      event.recommendation_action ||
      event.recommendation_type ||
      "unknown";

    const context =
      getEventContext(event);

    const contextKey =
      buildContextKey(context);

    const key =
      `${contextKey}|${action}`;

    if (!groups[key]) {
      groups[key] = {
        action,
        context,
        total: 0,
        accepted: 0,
        completed: 0,
        outcome_scores: []
      };
    }

    const group = groups[key];

    group.total += 1;

    if (event.accepted === true) {
      group.accepted += 1;
    }

    if (event.completed === true) {
      group.completed += 1;
    }

    const score =
      Number(event.outcome_score);

    if (Number.isFinite(score)) {
      group.outcome_scores.push(score);
    }
  }

  return Object.values(groups)
    .map(group => ({
      action: group.action,

      context: group.context,

      total: group.total,

      accepted: group.accepted,

      completed: group.completed,

      acceptance_rate:
        group.total > 0
          ? group.accepted / group.total
          : 0,

      completion_rate:
        group.total > 0
          ? group.completed / group.total
          : 0,

      average_outcome_score:
        group.outcome_scores.length > 0
          ? group.outcome_scores.reduce(
              (sum, value) => sum + value,
              0
            ) /
            group.outcome_scores.length
          : 0
    }))
    .sort(
      (a, b) => {
        if (
          b.completion_rate !==
          a.completion_rate
        ) {
          return (
            b.completion_rate -
            a.completion_rate
          );
        }

        return b.total - a.total;
      }
    );
}

module.exports = {
  groupEventsByAction,
  groupEventsByContext,
  getEventContext,
  buildContextKey
};