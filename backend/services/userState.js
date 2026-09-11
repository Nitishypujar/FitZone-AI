function calculatePercentage(current, target) {
    if (!target || target <= 0) return 0
  
    return Math.min(
      Math.round((current / target) * 100),
      100
    )
  }
  
  function calculateAdherence(completed, planned) {
    if (!planned || planned <= 0) return 0
  
    return Math.min(
      Math.round((completed / planned) * 100),
      100
    )
  }
  
  function calculateWorkoutTrend(recentWorkouts) {
    if (!Array.isArray(recentWorkouts) || recentWorkouts.length < 2) {
      return 'insufficient-data'
    }
  
    const completed = recentWorkouts.filter(
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
  
  function calculateRecentTrainingLoad(recentWorkouts) {
    if (!Array.isArray(recentWorkouts)) {
      return {
        sessions: 0,
        active_minutes: 0,
      }
    }
  
    const completedWorkouts = recentWorkouts.filter(
      (workout) => workout.completed
    )
  
    const activeMinutes = completedWorkouts.reduce(
      (total, workout) =>
        total + Number(workout.duration_minutes || 0),
      0
    )
  
    return {
      sessions: completedWorkouts.length,
      active_minutes: activeMinutes,
    }
  }
  
  function calculateNutritionStatus(
    nutritionToday,
    nutritionTargets
  ) {
    if (!nutritionTargets) {
      return {
        available: false,
        calorie_percentage: 0,
        protein_percentage: 0,
      }
    }
  
    return {
      available: true,
  
      calorie_percentage: calculatePercentage(
        Number(nutritionToday?.calories || 0),
        Number(nutritionTargets.calories || 0)
      ),
  
      protein_percentage: calculatePercentage(
        Number(nutritionToday?.protein_g || 0),
        Number(nutritionTargets.protein_g || 0)
      ),
  
      carbohydrates_percentage: calculatePercentage(
        Number(nutritionToday?.carbohydrates_g || 0),
        Number(nutritionTargets.carbohydrates_g || 0)
      ),
  
      fats_percentage: calculatePercentage(
        Number(nutritionToday?.fats_g || 0),
        Number(nutritionTargets.fats_g || 0)
      ),
    }
  }
  
  function buildUserState({
    profile,
    goals,
    workouts,
    workoutLogs,
    nutritionToday,
    nutritionTargets,
    progress,
  }) {
    const safeProfile = profile || {}
    const safeGoals = Array.isArray(goals) ? goals : []
    const safeWorkouts = Array.isArray(workouts)
      ? workouts
      : []
    const safeWorkoutLogs = Array.isArray(workoutLogs)
      ? workoutLogs
      : []
  
    const activeGoal =
      safeGoals.find((goal) => !goal.completed) ||
      safeGoals[0] ||
      null
  
    const completedWorkouts =
      safeWorkouts.filter((workout) => workout.completed)
  
    const completedExercises =
      safeWorkoutLogs.filter((log) => log.completed)
  
    const recentWorkouts =
      safeWorkouts.slice(0, 10)
  
    const trainingLoad =
      calculateRecentTrainingLoad(recentWorkouts)
  
    const adherence =
      calculateAdherence(
        completedWorkouts.length,
        safeWorkouts.length
      )
  
    const weeklyWorkoutTarget =
      Number(
        activeGoal?.weekly_workout_target
      ) || 0
  
    const weeklyActiveMinuteTarget =
      Number(
        activeGoal?.weekly_active_minute_target
      ) || 0
  
    const currentWeeklyWorkouts =
      Number(
        activeGoal?.current_weekly_workouts
      ) || 0
  
    const currentWeeklyActiveMinutes =
      Number(
        activeGoal?.current_weekly_active_minutes
      ) || 0
  
    return {
      generated_at: new Date().toISOString(),
  
      profile: {
        full_name:
          safeProfile.full_name || null,
  
        age:
          safeProfile.age || null,
  
        height_cm:
          safeProfile.height_cm || null,
  
        weight_kg:
          safeProfile.weight_kg || null,
  
        fitness_level:
          safeProfile.fitness_level || null,
  
        primary_goal:
          safeProfile.primary_goal || null,
  
        workout_days_per_week:
          safeProfile.workout_days_per_week || null,
  
        preferred_workout_duration:
          safeProfile.preferred_workout_duration || null,
      },
  
      goal_state: {
        active_goal: activeGoal,
  
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
        total_workouts:
          safeWorkouts.length,
  
        completed_workouts:
          completedWorkouts.length,
  
        completed_exercises:
          completedExercises.length,
  
        adherence_percentage:
          adherence,
  
        adherence_level:
          calculateWorkoutTrend(recentWorkouts),
  
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
          progress?.[0] || null,
  
        recent:
          Array.isArray(progress)
            ? progress.slice(0, 5)
            : [],
      },
    }
  }
  
  module.exports = {
    buildUserState,
  }