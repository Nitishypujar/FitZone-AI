async function buildFitnessContext(supabase, userId) {
    const [
      profileResult,
      goalsResult,
      workoutsResult,
      workoutLogsResult,
      nutritionResult,
      progressResult,
    ] = await Promise.all([
      // USER PROFILE
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single(),
  
      // GOALS
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
  
      // WORKOUTS
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
  
      // WORKOUT LOGS
      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(100),
  
      // NUTRITION LOGS
      supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(100),
  
      // PROGRESS LOGS
      // NOTE: progress_logs uses recorded_at, not logged_at.
      supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(20),
    ])
  
    // CHECK FOR DATABASE ERRORS
    const errors = [
      profileResult.error,
      goalsResult.error,
      workoutsResult.error,
      workoutLogsResult.error,
      nutritionResult.error,
      progressResult.error,
    ].filter(Boolean)
  
    if (errors.length > 0) {
      throw new Error(errors[0].message)
    }
  
    // DATABASE RESULTS
    const profile = profileResult.data
  
    const goals = goalsResult.data || []
    const workouts = workoutsResult.data || []
    const workoutLogs = workoutLogsResult.data || []
    const nutrition = nutritionResult.data || []
    const progress = progressResult.data || []
  
    // COMPLETED WORKOUTS
    const completedWorkouts = workouts.filter(
      (workout) => workout.completed
    )
  
    // COMPLETED EXERCISES
    const completedExercises = workoutLogs.filter(
      (log) => log.completed
    )
  
    // TOTAL ACTIVE MINUTES
    const totalActiveMinutes = completedWorkouts.reduce(
      (total, workout) =>
        total + Number(workout.duration_minutes || 0),
      0
    )
  
    // TODAY'S DATE
    const today = new Date()
  
    // TODAY'S NUTRITION
    const todayNutrition = nutrition.filter((meal) => {
      if (!meal.logged_at) return false
  
      const mealDate = new Date(meal.logged_at)
  
      return (
        mealDate.getFullYear() === today.getFullYear() &&
        mealDate.getMonth() === today.getMonth() &&
        mealDate.getDate() === today.getDate()
      )
    })
  
    // TODAY'S NUTRITION TOTALS
    const todayNutritionTotals = todayNutrition.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories || 0)
  
        acc.protein_g += Number(
          meal.protein_g || 0
        )
  
        acc.carbohydrates_g += Number(
          meal.carbohydrates_g || 0
        )
  
        acc.fats_g += Number(
          meal.fats_g || 0
        )
  
        return acc
      },
      {
        calories: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fats_g: 0,
      }
    )
  
    // RETURN COMPLETE FITNESS CONTEXT
    return {
      profile: {
        full_name: profile?.full_name || null,
  
        age: profile?.age || null,
  
        height_cm: profile?.height_cm || null,
  
        weight_kg: profile?.weight_kg || null,
  
        fitness_level:
          profile?.fitness_level || null,
  
        primary_goal:
          profile?.primary_goal || null,
  
        workout_days_per_week:
          profile?.workout_days_per_week || null,
  
        preferred_workout_duration:
          profile?.preferred_workout_duration || null,
      },
  
      goals,
  
      workout_summary: {
        total_workouts: workouts.length,
  
        completed_workouts:
          completedWorkouts.length,
  
        completed_exercises:
          completedExercises.length,
  
        total_active_minutes:
          totalActiveMinutes,
      },
  
      recent_workouts:
        workouts.slice(0, 10),
  
      recent_workout_logs:
        workoutLogs.slice(0, 20),
  
      nutrition_today: {
        meals_logged:
          todayNutrition.length,
  
        calories:
          todayNutritionTotals.calories,
  
        protein_g:
          todayNutritionTotals.protein_g,
  
        carbohydrates_g:
          todayNutritionTotals.carbohydrates_g,
  
        fats_g:
          todayNutritionTotals.fats_g,
      },
  
      recent_nutrition:
        nutrition.slice(0, 20),
  
      recent_progress:
        progress.slice(0, 10),
    }
  }
  
  module.exports = {
    buildFitnessContext,
  }