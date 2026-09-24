function number(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}
function buildIntelligenceFeatures(userState = {}, context = {}) {
  const profile = context.profile || {}
  const workoutState = userState.workout_state || {}
  const goalState = userState.goal_state || {}
  const nutritionState = userState.nutrition_state || {}
  return {
    age: number(profile.age),
    weight_kg: number(profile.weight_kg),
    height_cm: number(profile.height_cm),
    workout_days_per_week: number(profile.workout_days_per_week),
    preferred_workout_duration:
      number(profile.preferred_workout_duration),
    fitness_level:
      profile.fitness_level || "Beginner",
    primary_goal:
      profile.primary_goal || "Improve Fitness",
    adherence_percentage:
      clamp(
        number(workoutState.adherence_percentage),
        0,
        100
      ),
    weekly_workout_progress:
      clamp(
        number(goalState.weekly_workout_progress),
        0,
        200
      ),
    weekly_minute_progress:
      clamp(
        number(goalState.weekly_active_minute_progress),
        0,
        200
      ),
    recent_sessions:
      number(
        workoutState.recent_training_load?.sessions
      ),
    recent_active_minutes:
      number(
        workoutState.recent_training_load?.active_minutes
      ),
    nutrition_available:
      nutritionState.available === true,
    calorie_percentage:
      nutritionState.available === true
        ? clamp(
            number(nutritionState.calorie_percentage),
            0,
            200
          )
        : null,
    protein_percentage:
      nutritionState.available === true
        ? clamp(
            number(nutritionState.protein_percentage),
            0,
            200
          )
        : null
  }
}
function buildCompletionFeatures(features = {}, readinessScore = 0, recommendationAction = "") {
  return {
    age: number(features.age),
    weight_kg: number(features.weight_kg),
    height_cm: number(features.height_cm),
    workout_days_per_week: number(features.workout_days_per_week),
    preferred_workout_duration: number(features.preferred_workout_duration),
    fitness_level: String(features.fitness_level || "Beginner"),
    primary_goal: String(features.primary_goal || "Maintain Fitness"),
    adherence_percentage: number(features.adherence_percentage),
    weekly_workout_progress: number(features.weekly_workout_progress),
    weekly_minute_progress: number(features.weekly_minute_progress),
    recent_sessions: number(features.recent_sessions),
    recent_active_minutes: number(features.recent_active_minutes),
    nutrition_available: features.nutrition_available ? 1 : 0,
    calorie_percentage: number(features.calorie_percentage),
    protein_percentage: number(features.protein_percentage),
    readiness_score: number(readinessScore),
    difficulty_preference: number(features.difficulty_preference),
    recommendation_action: recommendationAction || "follow-planned-workout",
  }
}

module.exports = {
  buildIntelligenceFeatures,
  buildCompletionFeatures,
}
