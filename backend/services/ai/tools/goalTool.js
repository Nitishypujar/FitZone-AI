function getTodayDate() {
    const now = new Date()
  
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
  
    return `${year}-${month}-${day}`
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
  
  function calculateRemaining(current, target) {
    if (!target || target <= 0) {
      return 0
    }
  
    return Math.max(target - current, 0)
  }
  
  async function getGoalData(supabase, userId) {
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
  
    if (!userId) {
      throw new Error('User ID is required')
    }
  
    const [
      goalsResult,
      profileResult,
      workoutsResult,
    ] = await Promise.all([
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
  
      supabase
        .from('profiles')
        .select(
          'primary_goal, fitness_level, workout_days_per_week, preferred_workout_duration'
        )
        .eq('id', userId)
        .single(),
  
      supabase
        .from('workouts')
        .select(
          'id, workout_name, workout_type, duration_minutes, scheduled_date, completed, completed_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])
  
    if (goalsResult.error) {
      throw new Error(
        `Unable to retrieve goals: ${goalsResult.error.message}`
      )
    }
  
    if (profileResult.error) {
      throw new Error(
        `Unable to retrieve profile: ${profileResult.error.message}`
      )
    }
  
    if (workoutsResult.error) {
      throw new Error(
        `Unable to retrieve workouts: ${workoutsResult.error.message}`
      )
    }
  
    const goals = goalsResult.data || []
    const profile = profileResult.data || null
    const workouts = workoutsResult.data || []
  
    const activeGoals = goals.filter(
      (goal) => !goal.completed
    )
  
    const completedGoals = goals.filter(
      (goal) => goal.completed
    )
  
    const activeGoal =
      activeGoals[0] ||
      goals[0] ||
      null
  
    const completedWorkouts = workouts.filter(
      (workout) => workout.completed
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
      date: getTodayDate(),
  
      primary_goal:
        profile?.primary_goal || null,
  
      active_goal: activeGoal
        ? {
            id: activeGoal.id,
            goal_type: activeGoal.goal_type,
            target_value: activeGoal.target_value,
            current_value: activeGoal.current_value,
            unit: activeGoal.unit,
            target_date: activeGoal.target_date,
            completed: activeGoal.completed,
  
            weekly_workout_target:
              weeklyWorkoutTarget,
  
            weekly_active_minute_target:
              weeklyActiveMinuteTarget,
  
            current_weekly_workouts:
              currentWeeklyWorkouts,
  
            current_weekly_active_minutes:
              currentWeeklyActiveMinutes,
  
            weekly_workout_completion_percentage:
              calculatePercentage(
                currentWeeklyWorkouts,
                weeklyWorkoutTarget
              ),
  
            weekly_active_minute_completion_percentage:
              calculatePercentage(
                currentWeeklyActiveMinutes,
                weeklyActiveMinuteTarget
              ),
  
            remaining_weekly_workouts:
              calculateRemaining(
                currentWeeklyWorkouts,
                weeklyWorkoutTarget
              ),
  
            remaining_weekly_active_minutes:
              calculateRemaining(
                currentWeeklyActiveMinutes,
                weeklyActiveMinuteTarget
              ),
          }
        : null,
  
      summary: {
        total_goals: goals.length,
        active_goals: activeGoals.length,
        completed_goals: completedGoals.length,
        completed_workouts:
          completedWorkouts.length,
      },
  
      all_goals: goals,
  
      profile: {
        fitness_level:
          profile?.fitness_level || null,
  
        workout_days_per_week:
          profile?.workout_days_per_week || null,
  
        preferred_workout_duration:
          profile?.preferred_workout_duration || null,
      },
    }
  }
  
  module.exports = {
    getGoalData,
  }