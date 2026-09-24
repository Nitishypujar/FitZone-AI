function getCurrentWeekRange(referenceDate = new Date()) {
  const now = new Date(referenceDate)

  const currentDay = now.getDay()
  const mondayOffset =
    currentDay === 0
      ? -6
      : 1 - currentDay

  const weekStart = new Date(now)

  weekStart.setDate(
    now.getDate() + mondayOffset
  )

  weekStart.setHours(
    0,
    0,
    0,
    0
  )

  const weekEnd = new Date(weekStart)

  weekEnd.setDate(
    weekStart.getDate() + 7
  )

  return {
    weekStart,
    weekEnd,
  }
}

function getWorkoutCompletionDate(workout) {
  if (!workout) {
    return null
  }

  const value =
    workout.completed_at || null

  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? null
    : date
}

function calculateWeeklyWorkoutProgress(
  workouts,
  referenceDate = new Date()
) {
  const safeWorkouts =
    Array.isArray(workouts)
      ? workouts
      : []

  const {
    weekStart,
    weekEnd,
  } = getCurrentWeekRange(
    referenceDate
  )

  const weeklyCompletedWorkouts =
    safeWorkouts.filter(workout => {
      if (!workout.completed) {
        return false
      }

      const completionDate =
        getWorkoutCompletionDate(
          workout
        )

      return (
        completionDate &&
        completionDate >= weekStart &&
        completionDate < weekEnd
      )
    })

  const weeklyActiveMinutes =
    weeklyCompletedWorkouts.reduce(
      (total, workout) =>
        total +
        Number(
          workout.duration_minutes || 0
        ),
      0
    )

  return {
    weekly_completed_workouts:
      weeklyCompletedWorkouts.length,

    weekly_active_minutes:
      weeklyActiveMinutes,

    week_start:
      weekStart.toISOString(),

    week_end:
      weekEnd.toISOString(),
  }
}

module.exports = {
  getCurrentWeekRange,
  calculateWeeklyWorkoutProgress,
}