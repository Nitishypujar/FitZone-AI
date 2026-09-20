async function createRecommendationEvent(
  supabase,
  userId,
  recommendationData
) {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const {
    recommendation_type,
    recommendation_action,
    recommendation,
    reason,
    context_snapshot
  } = recommendationData;

  if (!recommendation_type || !recommendation) {
    throw new Error(
      "Recommendation type and recommendation are required"
    );
  }

  const { data, error } = await supabase
    .from("recommendation_events")
    .insert({
      user_id: userId,
      recommendation_type,
      recommendation_action:
        recommendation_action || recommendation_type,
      recommendation,
      reason: reason || null,
      context_snapshot: context_snapshot || null
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function calculateOutcomeScore(event = {}) {
  let score = 0;

  if (event.accepted === true) {
    score += 0.25;
  }

  if (event.completed === true) {
    score += 0.5;
  }

  const difficulty = Number(
    event.difficulty_feedback
  );

  if (
    Number.isFinite(difficulty) &&
    difficulty >= 3 &&
    difficulty <= 4
  ) {
    score += 0.25;
  }

  return Math.min(score, 1);
}

async function updateRecommendationEvent(
  supabase,
  userId,
  eventId,
  updates
) {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  if (!userId || !eventId) {
    throw new Error("User ID and event ID are required");
  }

  const allowedFields = [
    "accepted",
    "completed",
    "difficulty_feedback",
    "user_feedback",
    "outcome_score"
  ];

  const payload = {};

  for (const field of allowedFields) {
    if (
      Object.prototype.hasOwnProperty.call(
        updates,
        field
      )
    ) {
      payload[field] = updates[field];
    }
  }

  if (Object.keys(payload).length === 0) {
    throw new Error(
      "No valid update fields provided"
    );
  }

  const outcomeFields = [
    "accepted",
    "completed",
    "difficulty_feedback",
    "user_feedback",
    "outcome_score"
  ];

  const outcomeRecorded = outcomeFields.some(
    (field) =>
      Object.prototype.hasOwnProperty.call(
        updates,
        field
      )
  );

  if (outcomeRecorded) {
    payload.outcome_recorded_at =
      new Date().toISOString();
  }

  /*
   * Calculate the outcome score from the complete
   * recommendation event state.
   *
   * This is important when the user updates only one
   * field at a time. We first load the existing event,
   * merge the incoming update, then calculate the score.
   */
  if (
    Object.prototype.hasOwnProperty.call(
      updates,
      "accepted"
    ) ||
    Object.prototype.hasOwnProperty.call(
      updates,
      "completed"
    ) ||
    Object.prototype.hasOwnProperty.call(
      updates,
      "difficulty_feedback"
    )
  ) {
    const {
      data: existingEvent,
      error: existingEventError
    } = await supabase
      .from("recommendation_events")
      .select(
        "accepted, completed, difficulty_feedback, user_feedback, outcome_score"
      )
      .eq("id", eventId)
      .eq("user_id", userId)
      .single();

    if (existingEventError) {
      throw new Error(
        existingEventError.message
      );
    }

    const mergedEvent = {
      ...existingEvent,
      ...updates
    };

    payload.outcome_score =
      calculateOutcomeScore(mergedEvent);
  }

  const { data, error } = await supabase
    .from("recommendation_events")
    .update(payload)
    .eq("id", eventId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getRecommendationEvents(
  supabase,
  userId,
  limit = 20
) {
  if (!supabase) {
    throw new Error("Supabase client unavailable");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const { data, error } = await supabase
    .from("recommendation_events")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", {
      ascending: false
    })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

module.exports = {
  createRecommendationEvent,
  updateRecommendationEvent,
  getRecommendationEvents
};