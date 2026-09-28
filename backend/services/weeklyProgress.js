function formatDateKey(parts) {
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )
  return `${values.year}-${values.month}-${values.day}`
}

function dayKeyFromDate(value, timeZone = 'UTC') {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateKey(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date)
  )
}

function addDaysToKey(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  )
  return asUtc - date.getTime()
}

function zonedMidnightUtc(dateKey, timeZone) {
  let utc = new Date(`${dateKey}T00:00:00Z`)
  return new Date(utc.getTime() - getTimeZoneOffsetMs(utc, timeZone))
}

function getCurrentWeekRange(referenceDate = new Date(), timeZone = 'UTC') {
  const localToday = dayKeyFromDate(referenceDate, timeZone)
  const localDate = new Date(`${localToday}T12:00:00Z`)
  const currentDay = localDate.getUTCDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const weekStartKey = addDaysToKey(localToday, mondayOffset)
  const weekEndKey = addDaysToKey(weekStartKey, 7)

  return {
    weekStart: zonedMidnightUtc(weekStartKey, timeZone),
    weekEnd: zonedMidnightUtc(weekEndKey, timeZone),
    weekStartKey,
    weekEndKey,
  }
}

function getWorkoutCompletionDate(workout) {
  if (!workout?.completed) return null

  // New completions use completed_at. Older valid completed rows may predate
  // that field being populated, so preserve their history using the best
  // recorded date available instead of silently dropping them from weekly state.
  const candidate = workout.completed_at || workout.scheduled_date || workout.created_at
  if (!candidate) return null
  const date = new Date(candidate)
  return Number.isNaN(date.getTime()) ? null : date
}

function calculateWeeklyWorkoutProgress(
  workouts,
  referenceDate = new Date(),
  timeZone = 'UTC'
) {
  const safeWorkouts = Array.isArray(workouts) ? workouts : []
  const { weekStart, weekEnd, weekStartKey, weekEndKey } = getCurrentWeekRange(referenceDate, timeZone)

  const weeklyCompletedWorkouts = safeWorkouts.filter((workout) => {
    if (!workout?.completed) return false
    const completionDate = getWorkoutCompletionDate(workout)
    return Boolean(completionDate && completionDate >= weekStart && completionDate < weekEnd)
  })

  const weeklyActiveMinutes = weeklyCompletedWorkouts.reduce(
    (total, workout) => total + Number(workout.duration_minutes || 0),
    0
  )

  return {
    weekly_completed_workouts: weeklyCompletedWorkouts.length,
    weekly_active_minutes: weeklyActiveMinutes,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    week_start_date: weekStartKey,
    week_end_date: weekEndKey,
    time_zone: timeZone,
  }
}

module.exports = {
  getCurrentWeekRange,
  calculateWeeklyWorkoutProgress,
}
