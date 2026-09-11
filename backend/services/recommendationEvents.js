async function createRecommendationEvent(supabase, userId, recommendationData) {
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
      throw new Error("Recommendation type and recommendation are required");
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
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        payload[field] = updates[field];
      }
    }
  
    if (Object.keys(payload).length === 0) {
      throw new Error("No valid update fields provided");
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