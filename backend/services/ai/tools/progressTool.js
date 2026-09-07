function getTodayDate() {
    const now = new Date()
  
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
  
    return `${year}-${month}-${day}`
  }
  
  
  function getStartOfWeek(date = new Date()) {
    const start = new Date(date)
    const day = start.getDay()
  
    // Monday = 0, Sunday = 6
    const daysFromMonday = day === 0 ? 6 : day - 1
  
    start.setDate(start.getDate() - daysFromMonday)
    start.setHours(0, 0, 0, 0)
  
    return start
  }
  
  
  function getEndOfWeek(date = new Date()) {
    const end = new Date(date)
    const start = getStartOfWeek(end)
  
    end.setTime(start.getTime())
    end.setDate(end.getDate() + 7)
  
    return end
  }
  
  
  function calculatePercentage(current, target) {
    if (!target || target <= 0) {
      return 0
    }
  
    return Math.min(
      Math.round((current / target) * 100),
      100
    )
  }
  
  
  async function getProgressData(supabase, userId) {
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
  
    if (!userId) {
      throw new Error('User ID is required')
    }
  
    const today = getTodayDate()
    const weekStart = getStartOfWeek()
    const weekEnd = getEndOfWeek()
  
    const weekStartIso = weekStart.toISOString()
    const weekEndIso = weekEnd.toISOString()
  
    const [
      workoutsResult,
      workoutLogsResult,
      goalsResult,
      progressResult,
    ] = await Promise.all([
      supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
  
      supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('logged_at', { ascending: false })
        .limit(100),
  
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
  
      supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', userId)
        .order('recorded_at', { ascending: false })
        .limit(20),
    ])
  
    if (workoutsResult.error) {
      throw new Error(
        `Unable to retrieve workouts: ${workoutsResult.error.message}`
      )
    }
  
    if (workoutLogsResult.error) {
      throw new Error(
        `Unable to retrieve workout logs: ${workoutLogsResult.error.message}`
      )
    }
  
    if (goalsResult.error) {
      throw new Error(
        `Unable to retrieve goals: ${goalsResult.error.message}`
      )
    }
  
    if (progressResult.error) {
      throw new Error(
        `Unable to retrieve progress records: ${progressResult.error.message}`
      )
    }
  
    const workouts = workoutsResult.data || []
    const workoutLogs = workoutLogsResult.data || []
    const goals = goalsResult.data || []
    const progress = progressResult.data || []
  
    // -----------------------------------------
    // Overall workout statistics
    // -----------------------------------------
  
    const completedWorkouts = workouts.filter(
      (workout) => workout.completed
    )
  
    const completedExercises = workoutLogs.filter(
      (log) => log.completed
    )
  
    const totalActiveMinutes = completedWorkouts.reduce(
      (total, workout) =>
        total + Number(workout.duration_minutes || 0),
      0
    )
  
    // -----------------------------------------
    // Current week statistics
    // -----------------------------------------
  
    const weeklyCompletedWorkouts =
      completedWorkouts.filter((workout) => {
        const completedAt =
          workout.completed_at || workout.updated_at
  
        if (!completedAt) {
          return false
        }
  
        const completedDate = new Date(completedAt)
  
        return (
          completedDate >= weekStart &&
          completedDate < weekEnd
        )
      })
  
    const weeklyActiveMinutes =
      weeklyCompletedWorkouts.reduce(
        (total, workout) =>
          total + Number(workout.duration_minutes || 0),
        0
      )
  
    const weeklyWorkoutLogs = workoutLogs.filter(
      (log) => {
        if (!log.logged_at) {
          return false
        }
  
        const loggedDate = new Date(log.logged_at)
  
        return (
          loggedDate >= weekStart &&
          loggedDate < weekEnd &&
          log.completed
        )
      }
    )
  
    // -----------------------------------------
    // Weekly targets
    // -----------------------------------------
  
    const activeGoal = goals.find(
      (goal) => !goal.completed
    ) || goals[0] || null
  
    const weeklyWorkoutTarget =
      Number(
        activeGoal?.weekly_workout_target
      ) || 0
  
    const weeklyActiveMinuteTarget =
      Number(
        activeGoal?.weekly_active_minute_target
      ) || 0
  
    const weeklyWorkoutPercentage =
      calculatePercentage(
        weeklyCompletedWorkouts.length,
        weeklyWorkoutTarget
      )
  
    const weeklyActiveMinutePercentage =
      calculatePercentage(
        weeklyActiveMinutes,
        weeklyActiveMinuteTarget
      )
  
    // -----------------------------------------
    // Today's completed activity
    // -----------------------------------------
  
    const todayCompletedWorkouts =
      completedWorkouts.filter((workout) => {
        const completedAt =
          workout.completed_at || workout.updated_at
  
        if (!completedAt) {
          return false
        }
  
        const date = new Date(completedAt)
  
        const year = date.getFullYear()
        const month = String(
          date.getMonth() + 1
        ).padStart(2, '0')
        const day = String(
          date.getDate()
        ).padStart(2, '0')
  
        return `${year}-${month}-${day}` === today
      })
  
    const todayActiveMinutes =
      todayCompletedWorkouts.reduce(
        (total, workout) =>
          total + Number(workout.duration_minutes || 0),
        0
      )
  
    // -----------------------------------------
    // Progress records
    // -----------------------------------------
  
    const latestProgress =
      progress.length > 0
        ? progress[0]
        : null
  
    return {
      date: today,
  
      week: {
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      },
  
      overall: {
        total_workouts: workouts.length,
        completed_workouts: completedWorkouts.length,
        completed_exercises: completedExercises.length,
        total_active_minutes: totalActiveMinutes,
      },
  
      today: {
        completed_workouts:
          todayCompletedWorkouts.length,
        active_minutes: todayActiveMinutes,
      },
  
      weekly: {
        completed_workouts:
          weeklyCompletedWorkouts.length,
        completed_exercises:
          weeklyWorkoutLogs.length,
        active_minutes:
          weeklyActiveMinutes,
        workout_target:
          weeklyWorkoutTarget,
        active_minute_target:
          weeklyActiveMinuteTarget,
        workout_completion_percentage:
          weeklyWorkoutPercentage,
        active_minute_completion_percentage:
          weeklyActiveMinutePercentage,
      },
  
      latest_progress: latestProgress,
  
      recent_progress:
        progress.slice(0, 10),
    }
  }
  
  
  module.exports = {
    getProgressData,
  }