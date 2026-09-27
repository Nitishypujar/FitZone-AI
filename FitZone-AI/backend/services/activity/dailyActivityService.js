function dayKeyFromDate(value, timeZone = 'UTC') {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

function enumerateDays(startKey, endKey) {
  const result = []
  const current = new Date(`${startKey}T12:00:00Z`)
  const end = new Date(`${endKey}T12:00:00Z`)
  while (current <= end) {
    result.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}

function getDateRange(range = '28') {
  const requested = String(range).toLowerCase()
  const days = requested === '7d' || requested === '7' ? 7
    : requested === '4w' || requested === '28' ? 28
      : requested === '3m' || requested === '90' ? 90
        : requested === '1y' || requested === '365' ? 365 : 28
  return { days, key: requested }
}

function calculateWorkoutStreaks(workouts = [], timeZone = 'UTC', endKey) {
  const allWorkoutDates = Array.from(new Set(
    (Array.isArray(workouts) ? workouts : [])
      .filter((workout) => workout?.completed)
      .map((workout) => dayKeyFromDate(workout.completed_at || workout.scheduled_date || workout.created_at, timeZone))
      .filter(Boolean)
  )).sort()

  const todayKey = endKey || dayKeyFromDate(new Date(), timeZone)

  const previousDay = (dateKey) => {
    const date = new Date(`${dateKey}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() - 1)
    return date.toISOString().slice(0, 10)
  }

  const nextDay = (dateKey) => {
    const date = new Date(`${dateKey}T12:00:00Z`)
    date.setUTCDate(date.getUTCDate() + 1)
    return date.toISOString().slice(0, 10)
  }

  const workoutDateSet = new Set(allWorkoutDates)
  let current = 0
  let cursor = workoutDateSet.has(todayKey) ? todayKey : previousDay(todayKey)
  while (workoutDateSet.has(cursor)) {
    current += 1
    cursor = previousDay(cursor)
  }

  let best = 0
  let running = 0
  for (let index = 0; index < allWorkoutDates.length; index += 1) {
    if (index > 0 && allWorkoutDates[index] === nextDay(allWorkoutDates[index - 1])) running += 1
    else running = 1
    best = Math.max(best, running)
  }

  return { current, best }
}

function buildDailyActivity({ workouts = [], workoutLogs = [], nutritionLogs = [], timeZone = 'UTC', range = '28', now = new Date() }) {
  const { days, key } = getDateRange(range)
  const endKey = dayKeyFromDate(now, timeZone)
  const endDate = new Date(`${endKey}T12:00:00Z`)
  const startDate = new Date(endDate)
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1))
  const startKey = startDate.toISOString().slice(0, 10)
  const dayKeys = enumerateDays(startKey, endKey)
  const map = new Map(dayKeys.map((date) => [date, {
    date,
    completed_workouts: 0,
    workout_minutes: 0,
    completed_exercises: 0,
    meals_logged: 0,
    calories_logged: 0,
    protein_logged_g: 0,
    active: false,
    intensity: 'none',
  }]))

  for (const workout of Array.isArray(workouts) ? workouts : []) {
    if (!workout?.completed) continue
    const day = dayKeyFromDate(workout.completed_at || workout.scheduled_date || workout.created_at, timeZone)
    if (!day || !map.has(day)) continue
    const row = map.get(day)
    row.completed_workouts += 1
    row.workout_minutes += Number(workout.duration_minutes || 0)
    row.active = true
  }

  for (const log of Array.isArray(workoutLogs) ? workoutLogs : []) {
    if (!log?.completed) continue
    const day = dayKeyFromDate(log.completed_at || log.created_at, timeZone)
    if (!day || !map.has(day)) continue
    map.get(day).completed_exercises += 1
  }

  for (const log of Array.isArray(nutritionLogs) ? nutritionLogs : []) {
    const day = dayKeyFromDate(log.logged_at || log.created_at, timeZone)
    if (!day || !map.has(day)) continue
    const row = map.get(day)
    row.meals_logged += 1
    row.calories_logged += Number(log.calories || 0)
    row.protein_logged_g += Number(log.protein_g || 0)
  }

  const entries = Array.from(map.values())
  for (const row of entries) {
    const score = Math.min(row.workout_minutes / 45, 1)
    row.activity_score = Number(score.toFixed(2))
    row.intensity = score >= 0.75 ? 'high' : score >= 0.4 ? 'moderate' : row.active ? 'light' : 'none'
    row.calories_logged = Number(row.calories_logged.toFixed(1))
    row.protein_logged_g = Number(row.protein_logged_g.toFixed(1))
    row.total_minutes = row.workout_minutes
  }

  function streakFromEntries(sourceEntries, predicate = (entry) => entry.active) {
    let current = 0
    let startIndex = sourceEntries.length - 1
    if (startIndex >= 0 && !predicate(sourceEntries[startIndex])) startIndex -= 1
    for (let index = startIndex; index >= 0; index -= 1) {
      if (predicate(sourceEntries[index])) current += 1
      else break
    }

    let best = 0
    let run = 0
    for (const entry of sourceEntries) {
      if (predicate(entry)) {
        run += 1
        best = Math.max(best, run)
      } else run = 0
    }
    return { current, best }
  }

  const workoutDays = entries.filter((entry) => entry.completed_workouts > 0).length
  const activeDays = entries.filter((entry) => entry.active).length
  const nutritionDays = entries.filter((entry) => entry.meals_logged > 0).length
  const minutes = entries.reduce((sum, entry) => sum + entry.workout_minutes, 0)

  // Streaks describe the member's real history, not the selected chart window.
  const workoutStreak = calculateWorkoutStreaks(workouts, timeZone, endKey)
  const activeStreak = streakFromEntries(entries)

  // Keep one canonical activity representation for every consumer.
  // Dashboard uses `entries`, while Progress historically used `days`;
  // both now come from exactly the same calculated rows so they cannot drift.
  const daysView = entries.map((entry) => ({
    date: entry.date,
    workouts_completed: entry.completed_workouts,
    active_minutes: entry.workout_minutes,
    exercises_completed: entry.completed_exercises,
    nutrition_logged: entry.meals_logged > 0,
    nutrition_entries: entry.meals_logged,
    workout_names: [],
    calories_logged: entry.calories_logged,
    protein_logged_g: entry.protein_logged_g,
  }))

  const today = daysView.find((entry) => entry.date === endKey) || null

  return {
    status: 'success',
    time_zone: timeZone,
    timezone: timeZone,
    range: key,
    days: daysView,
    start_date: startKey,
    end_date: endKey,
    entries,
    today,
    summary: {
      active_days: activeDays,
      workout_days: workoutDays,
      nutrition_days: nutritionDays,
      active_minutes: minutes,
      total_active_minutes: minutes,
      total_workouts: entries.reduce((sum, entry) => sum + entry.completed_workouts, 0),
      total_exercises: entries.reduce((sum, entry) => sum + entry.completed_exercises, 0),
      current_streak: workoutStreak.current,
      max_streak: workoutStreak.best,
      current_workout_streak: workoutStreak.current,
      best_workout_streak: workoutStreak.best,
      current_active_streak: activeStreak.current,
      max_active_streak: activeStreak.best,
    },
  }
}

async function getDailyActivity(supabase, userId, { timeZone = 'UTC', range = '28', now = new Date() } = {}) {
  if (!supabase || !userId) throw new Error('Supabase client and user ID are required')

  const [workoutsResult, logsResult, nutritionResult] = await Promise.all([
    supabase
      .from('workouts')
      .select('id,completed,completed_at,scheduled_date,duration_minutes,created_at,workout_name,workout_type')
      .eq('user_id', userId)
      .limit(10000),
    supabase
      .from('workout_logs')
      .select('id,workout_id,completed,logged_at,created_at,exercise_name')
      .eq('user_id', userId)
      .limit(20000),
    supabase
      .from('nutrition_logs')
      .select('id,calories,protein_g,logged_at,created_at')
      .eq('user_id', userId)
      .limit(10000),
  ])

  const sourceError = workoutsResult.error || logsResult.error || nutritionResult.error
  if (sourceError) throw sourceError

  const activity = buildDailyActivity({
    workouts: workoutsResult.data || [],
    workoutLogs: logsResult.data || [],
    nutritionLogs: nutritionResult.data || [],
    timeZone,
    range,
    now,
  })

  // Preserve workout names for the shared day-detail UI without creating a
  // second aggregation implementation.
  const namesByDay = new Map()
  for (const workout of workoutsResult.data || []) {
    if (!workout?.completed || !workout.workout_name) continue
    const day = dayKeyFromDate(workout.completed_at || workout.scheduled_date || workout.created_at, timeZone)
    if (!day) continue
    const names = namesByDay.get(day) || []
    if (!names.includes(workout.workout_name)) names.push(workout.workout_name)
    namesByDay.set(day, names)
  }

  activity.days = activity.days.map((day) => ({ ...day, workout_names: namesByDay.get(day.date) || [] }))
  activity.today = activity.today ? { ...activity.today, workout_names: namesByDay.get(activity.today.date) || [] } : activity.today
  activity.entries = activity.entries.map((entry) => ({ ...entry, workout_names: namesByDay.get(entry.date) || [] }))

  return activity
}

module.exports = {
  dayKeyFromDate,
  calculateWorkoutStreaks,
  buildDailyActivity,
  getDailyActivity,
}
