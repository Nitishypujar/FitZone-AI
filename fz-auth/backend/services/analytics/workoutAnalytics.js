function summarizeWorkoutHistory(
  workouts = []
) {
  if (!Array.isArray(workouts)) {
    return {
      total: 0,
      completed: 0,
      completion_rate: 0,
      active_minutes: 0
    }
  }
  const completed =
    workouts.filter(
      workout =>
        workout.completed === true
    ).length
  const activeMinutes =
    workouts.reduce(
      (sum, workout) =>
        sum +
        Number(
          workout.duration_minutes || 0
        ),
      0
    )
  return {
    total: workouts.length,
    completed,
    completion_rate:
      workouts.length > 0
        ? completed / workouts.length
        : 0,
    active_minutes:
      activeMinutes
  }
}
module.exports = {
  summarizeWorkoutHistory
}
