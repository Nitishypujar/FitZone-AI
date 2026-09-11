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
module.exports = {
  buildIntelligenceFeatures
}
