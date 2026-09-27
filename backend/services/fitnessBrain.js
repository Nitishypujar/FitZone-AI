const { buildFitnessContext } = require('./fitnessContext')
const { buildIntelligenceFromContext } = require('./intelligence/intelligenceService')
const { dayKeyFromDate } = require('./nutrition/nutritionIntelligence')

async function buildFitnessBrain(supabase, userId, timeZone = 'UTC') {
  if (!supabase) throw new Error('Supabase client is required')
  if (!userId) throw new Error('User ID is required')

  const context = await buildFitnessContext(supabase, userId, timeZone)
  const intelligence = await buildIntelligenceFromContext(supabase, userId, context)
  const today = dayKeyFromDate(new Date(), timeZone)

  const { data: todayWorkouts, error: todayWorkoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .eq('scheduled_date', today)
    .order('created_at', { ascending: false })

  if (todayWorkoutError) throw new Error(todayWorkoutError.message)

  const todayWorkout = (todayWorkouts || []).find((workout) => Array.isArray(workout.exercises) && workout.exercises.length > 0)
    || (todayWorkouts || [])[0]
    || null

  const nextOpenWorkout = (todayWorkouts || []).find((workout) => !workout.completed && Array.isArray(workout.exercises) && workout.exercises.length > 0)
    || (todayWorkouts || []).find((workout) => !workout.completed)
    || (context.recent_workouts || []).find((workout) => !workout.completed && Array.isArray(workout.exercises) && workout.exercises.length > 0)
    || null

  return {
    status: 'success',
    generated_at: intelligence.generated_at,
    timezone: timeZone,
    profile: context.profile,
    goals: context.goals,
    user_state: intelligence.user_state,
    intelligence,
    today_workout: todayWorkout,
    next_open_workout: nextOpenWorkout,
    nutrition_today: context.nutrition_today,
    weekly_workout_progress: context.weekly_workout_progress,
  }
}

module.exports = { buildFitnessBrain }
