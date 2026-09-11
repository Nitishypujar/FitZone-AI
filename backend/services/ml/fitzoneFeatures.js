function buildFitZoneActivityFeatures(userState = {}, context = {}) {
  const profile = context.profile || {};
  const workoutSummary = context.workout_summary || {};

  const plannedDays = Number(profile.workout_days_per_week || 0);
  const completedWorkouts = Number(workoutSummary.completed_workouts || 0);
  const activeMinutes = Number(workoutSummary.total_active_minutes || 0);
  const duration = Number(profile.preferred_workout_duration || 0);

  return {
    age: Number(profile.age || 0),
    workout_days_per_week: plannedDays,
    preferred_workout_duration: duration,
    completed_workouts: completedWorkouts,
    total_active_minutes: activeMinutes,
    workout_adherence: Number(userState.workout_adherence || 0),
    recent_training_load: Number(userState.recent_training_load || 0),
    fitness_level: profile.fitness_level || null,
    primary_goal: profile.primary_goal || null
  };
}

module.exports = {
  buildFitZoneActivityFeatures
};
