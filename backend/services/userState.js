const {
  calculateWeeklyWorkoutProgress,
} = require('./weeklyProgress')
const { dayKeyFromDate } = require('./nutrition/nutritionIntelligence')

function calculatePercentage(current, target) {
  if (!target || target <= 0) {
    return 0
  }

  return Math.min(
    Math.round((current / target) * 100),
    100
  )
}

function calculateAdherence(completed, planned) {
  if (!planned || planned <= 0) {
    return 0
  }

  return Math.min(
    Math.round((completed / planned) * 100),
    100
  )
}

function calculateWorkoutTrend(recentWorkouts) {
  if (
    !Array.isArray(recentWorkouts) ||
    recentWorkouts.length < 2
  ) {
    return 'insufficient-data'
  }

  const completed =
    recentWorkouts.filter(
      (workout) => workout.completed
    ).length

  const completionRate =
    completed / recentWorkouts.length

  if (completionRate >= 0.8) {
    return 'strong'
  }

  if (completionRate >= 0.5) {
    return 'moderate'
  }

  return 'low'
}

function calculateRecentTrainingLoad(recentWorkouts, now = new Date(), windowDays = 14) {
  if (!Array.isArray(recentWorkouts)) {
    return { sessions: 0, active_minutes: 0, window_days: windowDays }
  }

  const endMs = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const startMs = endMs - (windowDays * 24 * 60 * 60 * 1000)
  const completedWorkouts = recentWorkouts.filter((workout) => {
    if (!workout?.completed || !workout?.completed_at) return false
    const completedAt = new Date(workout.completed_at).getTime()
    return Number.isFinite(completedAt) && completedAt >= startMs && completedAt <= endMs
  })

  const activeMinutes = completedWorkouts.reduce(
    (total, workout) => total + Number(workout.duration_minutes || 0),
    0,
  )

  return {
    sessions: completedWorkouts.length,
    active_minutes: activeMinutes,
    window_days: windowDays,
  }
}

function isEligiblePlannedWorkout(workout, todayKey, now = new Date()) {
  if (!workout) return false
  if (workout.scheduled_date) return String(workout.scheduled_date).slice(0, 10) <= todayKey
  if (workout.created_at) {
    const createdAt = new Date(workout.created_at).getTime()
    return Number.isFinite(createdAt) && createdAt <= now.getTime()
  }
  return false
}

function calculateNutritionStatus(
  nutritionToday,
  nutritionTargets
) {
  if (!nutritionTargets || nutritionTargets.available === false) {
    return {
      available: false,
      calorie_percentage: null,
      protein_percentage: null,
      carbohydrates_percentage: null,
      fats_percentage: null,
    }
  }

  return {
    available: true,

    calorie_percentage:
      calculatePercentage(
        Number(
          nutritionToday?.calories || 0
        ),
        Number(
          nutritionTargets.calories || 0
        )
      ),

    protein_percentage:
      calculatePercentage(
        Number(
          nutritionToday?.protein_g || 0
        ),
        Number(
          nutritionTargets.protein_g || 0
        )
      ),

    carbohydrates_percentage:
      calculatePercentage(
        Number(
          nutritionToday?.carbohydrates_g || 0
        ),
        Number(
          nutritionTargets.carbohydrates_g || 0
        )
      ),

    fats_percentage:
      calculatePercentage(
        Number(
          nutritionToday?.fats_g || 0
        ),
        Number(
          nutritionTargets.fats_g || 0
        )
      ),
  }
}

function getCurrentWorkout(workouts, timeZone = 'UTC', now = new Date()) {
  const safeWorkouts = Array.isArray(workouts) ? workouts : []
  const today = dayKeyFromDate(now, timeZone)

  // A current workout is only a workout scheduled for today and still incomplete.
  // Older unfinished workouts must never silently become today's workout.
  return safeWorkouts.find(
    (workout) => workout && workout.scheduled_date === today && !workout.completed,
  ) || null
}

const GOAL_LABELS = {
  'fat-loss': 'Fat Loss',
  'weight-gain': 'Weight Gain',
  'muscle-growth': 'Muscle Growth',
  strength: 'Strength',
  endurance: 'Endurance',
  'general-fitness': 'General Fitness',
  'maintain-fitness': 'Maintain Fitness',
  flexibility: 'Flexibility',
  stamina: 'Stamina',
  // Backward-compatible values used by older records.
  muscle: 'Muscle Growth',
  'weight-loss': 'Fat Loss',
  fitness: 'General Fitness',
}

function getGoalLabel(goalType, fallback = null) {
  const key = String(goalType || '').toLowerCase().trim()
  return GOAL_LABELS[key] || fallback || null
}

function buildUserState({
  profile,
  goals,
  workouts,
  workoutLogs,
  nutritionToday,
  nutritionTargets,
  progress,
  weeklyWorkoutProgress,
  timeZone = 'UTC',
}) {
  const safeProfile =
    profile || {}

  const safeGoals =
    Array.isArray(goals)
      ? goals
      : []

  const safeWorkouts =
    Array.isArray(workouts)
      ? workouts
      : []

  const safeWorkoutLogs =
    Array.isArray(workoutLogs)
      ? workoutLogs
      : []

  const activeGoal =
    safeGoals.find(
      (goal) => !goal.completed
    ) ||
    safeGoals[0] ||
    null

  const effectivePrimaryGoal = activeGoal
    ? getGoalLabel(activeGoal.goal_type, safeProfile.primary_goal)
    : getGoalLabel(safeProfile.primary_goal, null)

  const completedWorkouts =
    safeWorkouts.filter(
      (workout) => workout.completed
    )

  const completedExercises =
    safeWorkoutLogs.filter(
      (log) => log.completed
    )

  const recentWorkouts = safeWorkouts.slice(0, 50)

  const trainingLoad = calculateRecentTrainingLoad(recentWorkouts, new Date(), 14)

  const currentWorkout = getCurrentWorkout(safeWorkouts, timeZone, new Date())

  const todayKey = dayKeyFromDate(new Date(), timeZone)
  const eligiblePlannedWorkouts = safeWorkouts.filter((workout) =>
    isEligiblePlannedWorkout(workout, todayKey, new Date())
  )
  const adherence = calculateAdherence(
    eligiblePlannedWorkouts.filter((workout) => workout.completed).length,
    eligiblePlannedWorkouts.length,
  )

  const weeklyWorkoutTarget =
    activeGoal?.weekly_workout_target === null ||
    activeGoal?.weekly_workout_target === undefined ||
    activeGoal?.weekly_workout_target === ''
      ? null
      : Number(activeGoal.weekly_workout_target)

  const weeklyActiveMinuteTarget =
    activeGoal?.weekly_active_minute_target === null ||
    activeGoal?.weekly_active_minute_target === undefined ||
    activeGoal?.weekly_active_minute_target === ''
      ? null
      : Number(activeGoal.weekly_active_minute_target)

  const calculatedWeeklyProgress =
    weeklyWorkoutProgress ||
    calculateWeeklyWorkoutProgress(
      safeWorkouts,
      new Date(),
      timeZone
    )

  const currentWeeklyWorkouts =
    Number(
      calculatedWeeklyProgress
        .weekly_completed_workouts
    ) || 0

  const currentWeeklyActiveMinutes =
    Number(
      calculatedWeeklyProgress
        .weekly_active_minutes
    ) || 0

  return {
    generated_at:
      new Date().toISOString(),

    profile: {
      full_name:
        safeProfile.full_name ||
        null,

      age:
        safeProfile.age ||
        null,

      height_cm:
        safeProfile.height_cm ||
        null,

      weight_kg:
        safeProfile.weight_kg ||
        null,

      fitness_level:
        safeProfile.fitness_level ||
        null,

      primary_goal:
        effectivePrimaryGoal,

      workout_days_per_week:
        safeProfile.workout_days_per_week ||
        null,

      preferred_workout_duration:
        safeProfile.preferred_workout_duration ||
        null,
    },

    goal_state: {
      active_goal: activeGoal,
      goal_type: activeGoal?.goal_type || null,

      weekly_workout_target:
        weeklyWorkoutTarget,

      weekly_active_minute_target:
        weeklyActiveMinuteTarget,

      current_weekly_workouts:
        currentWeeklyWorkouts,

      current_weekly_active_minutes:
        currentWeeklyActiveMinutes,

      weekly_workout_progress:
        calculatePercentage(
          currentWeeklyWorkouts,
          weeklyWorkoutTarget
        ),

      weekly_active_minute_progress:
        calculatePercentage(
          currentWeeklyActiveMinutes,
          weeklyActiveMinuteTarget
        ),
    },

    workout_state: {
      current_workout: currentWorkout,
      total_workouts:
        safeWorkouts.length,

      completed_workouts:
        completedWorkouts.length,

      completed_exercises:
        completedExercises.length,

      adherence_percentage:
        adherence,
      eligible_planned_workouts: eligiblePlannedWorkouts.length,

      adherence_level:
        calculateWorkoutTrend(
          recentWorkouts
        ),

      recent_training_load:
        trainingLoad,
    },

    nutrition_state:
      calculateNutritionStatus(
        nutritionToday,
        nutritionTargets
      ),

    progress_state: {
      latest:
        progress?.[0] ||
        null,

      recent:
        Array.isArray(progress)
          ? progress.slice(0, 5)
          : [],
    },
  }
}

module.exports = {
  buildUserState,
  getGoalLabel,
}