function getTodayDate() {
    const now = new Date()
  
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
  
    return `${year}-${month}-${day}`
  }
  
  
  async function getWorkoutData(supabase, userId) {
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
  
    if (!userId) {
      throw new Error('User ID is required')
    }
  
    const today = getTodayDate()
  
    const [
      workoutsResult,
      logsResult,
    ] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('scheduled_date', { ascending: true })
        .order('created_at', { ascending: false }),
  
      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(100),
    ])
  
    if (workoutsResult.error) {
      throw new Error(
        `Unable to retrieve workouts: ${workoutsResult.error.message}`
      )
    }
  
    if (logsResult.error) {
      throw new Error(
        `Unable to retrieve workout logs: ${logsResult.error.message}`
      )
    }
  
    const workouts = workoutsResult.data || []
    const logs = logsResult.data || []
  
    const todaysWorkouts = workouts.filter(
      (workout) => workout.scheduled_date === today
    )
  
    const completedWorkouts = workouts.filter(
      (workout) => workout.completed
    )
  
    const completedExercises = logs.filter(
      (log) => log.completed
    )
  
    const totalActiveMinutes = completedWorkouts.reduce(
      (total, workout) =>
        total + Number(workout.duration_minutes || 0),
      0
    )
  
    const todayWorkout =
      todaysWorkouts.find(
        (workout) =>
          !workout.completed &&
          Array.isArray(workout.exercises) &&
          workout.exercises.length > 0
      ) ||
      todaysWorkouts.find(
        (workout) => !workout.completed
      ) ||
      todaysWorkouts[0] ||
      null
  
    return {
      date: today,
  
      today_workout: todayWorkout,
  
      today_workouts: todaysWorkouts,
  
      summary: {
        total_workouts: workouts.length,
        completed_workouts: completedWorkouts.length,
        completed_exercises: completedExercises.length,
        total_active_minutes: totalActiveMinutes,
      },
  
      recent_workouts: workouts.slice(0, 10),
  
      recent_completed_exercises:
        completedExercises.slice(0, 20),
    }
  }
  
  
  module.exports = {
    getWorkoutData,
  }