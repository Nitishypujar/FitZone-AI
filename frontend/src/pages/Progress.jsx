import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { getFitnessTimeZone } from '../hooks/useFitnessBrain'

const ranges = [
  { key: '7d', label: '7D' },
  { key: '4w', label: '4W' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
]

const goalLabels = {
  'fat-loss': 'Fat Loss',
  'weight-loss': 'Fat Loss',
  'weight-gain': 'Weight Gain',
  'muscle-growth': 'Muscle Growth',
  muscle: 'Muscle Growth',
  strength: 'Strength',
  endurance: 'Endurance',
  'general-fitness': 'General Fitness',
  fitness: 'General Fitness',
  'maintain-fitness': 'Maintain Fitness',
  flexibility: 'Flexibility',
  stamina: 'Stamina',
}

function getTodayGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T12:00:00Z`)
}

function addDays(dateKey, amount) {
  const date = parseDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function getCurrentWeekKeys(todayKey) {
  if (!todayKey) return []
  const date = parseDateKey(todayKey)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return Array.from({ length: 7 }, (_, index) => addDays(todayKey, mondayOffset + index))
}

function getIsoWeekStart(dateKey) {
  const date = parseDateKey(dateKey)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return addDays(dateKey, mondayOffset)
}

function formatDate(dateKey, options = {}) {
  if (!dateKey) return '—'
  return new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(parseDateKey(dateKey))
}

function intensity(day) {
  if (!day) return 0
  if (day.workouts_completed >= 2 || day.active_minutes >= 90) return 4
  if (day.workouts_completed === 1 && day.active_minutes >= 45) return 3
  if (day.workouts_completed === 1 || day.active_minutes > 0) return 2
  if (day.nutrition_logged) return 1
  return 0
}

function Progress() {
  const [goals, setGoals] = useState([])
  const [activity, setActivity] = useState(null)
  const [range, setRange] = useState('4w')
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activityLoading, setActivityLoading] = useState(true)
  const [error, setError] = useState('')
  const [brain, setBrain] = useState(null)

  async function loadBaseData() {
    const [goalsData, brainData] = await Promise.all([
      api.get('/api/goals'),
      api.get(`/api/fitness/state?timezone=${encodeURIComponent(getFitnessTimeZone())}`).catch(() => null),
    ])
    setGoals(goalsData.goals || [])
    setBrain(brainData || null)
  }

  async function loadActivity(nextRange = range) {
    try {
      setActivityLoading(true)
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      const data = await api.get(`/api/activity/daily?range=${nextRange}&timezone=${encodeURIComponent(timeZone)}`)
      setActivity(data)
      setSelectedDate((current) => current || data.today?.date || data.days?.at(-1)?.date)
    } catch (err) {
      setError(err.message || 'Unable to load your activity history.')
    } finally {
      setActivityLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    setLoading(true)
    Promise.all([loadBaseData(), loadActivity('4w')])
      .catch((err) => {
        if (mounted) setError(err.message || 'Unable to load your progress.')
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  function changeRange(nextRange) {
    setRange(nextRange)
    setSelectedDate(null)
    loadActivity(nextRange)
  }

  const latestGoal = brain?.user_state?.goal_state?.active_goal || goals.find((goal) => !goal.completed) || goals[0] || null
  const workoutTarget = latestGoal?.weekly_workout_target ?? null
  const minuteTarget = latestGoal?.weekly_active_minute_target ?? null
  const today = activity?.today
  const selected = activity?.days?.find((day) => day.date === selectedDate) || today
  const summary = activity?.summary || {}

  const weeklyDays = useMemo(() => {
    const days = activity?.days || []
    const todayKey = today?.date || activity?.end_date
    if (!todayKey) return []
    const weekKeys = new Set(getCurrentWeekKeys(todayKey))
    return days.filter((day) => weekKeys.has(day.date))
  }, [activity, today?.date])

  const trendDays = useMemo(() => {
    const days = activity?.days || []
    if (!days.length) return []

    if (range === '7d' || range === '4w') {
      return days.map((day) => ({
        ...day,
        label: formatDate(day.date, { month: 'short', day: 'numeric' }),
      }))
    }

    const groups = new Map()
    for (const day of days) {
      const key = range === '3m'
        ? getIsoWeekStart(day.date)
        : day.date.slice(0, 7)
      const current = groups.get(key) || {
        date: key,
        workouts_completed: 0,
        active_minutes: 0,
        label: '',
      }
      current.workouts_completed += Number(day.workouts_completed || 0)
      current.active_minutes += Number(day.active_minutes || 0)
      groups.set(key, current)
    }

    return Array.from(groups.values()).map((group) => ({
      ...group,
      label: range === '3m'
        ? formatDate(group.date, { month: 'short', day: 'numeric' })
        : formatDate(`${group.date}-01`, { month: 'short', year: 'numeric' }),
    }))
  }, [activity, range])

  const maxTrendMinutes = Math.max(1, ...trendDays.map((day) => Number(day.active_minutes || 0)))
  const weeklyWorkoutTotal = weeklyDays.reduce((sum, day) => sum + Number(day.workouts_completed || 0), 0)
  const weeklyWorkoutPercent = workoutTarget ? Math.min(100, Math.round((weeklyWorkoutTotal / Number(workoutTarget)) * 100)) : null
  const weeklyMinuteTotal = weeklyDays.reduce((sum, day) => sum + Number(day.active_minutes || 0), 0)
  const weeklyMinutePercent = minuteTarget ? Math.min(100, Math.round((weeklyMinuteTotal / Number(minuteTarget)) * 100)) : null
  const trendGranularity = range === '1y' ? 'Monthly' : range === '3m' ? 'Weekly' : 'Daily'
  const goalTitle = goalLabels[String(latestGoal?.goal_type || '').toLowerCase()] || (latestGoal ? 'Your current goal' : 'No goal set')

  if (loading) {
    return <main className="progress-page"><section className="progress-loading"><div className="progress-loading-orb"></div><p className="eyebrow">PROGRESS INTELLIGENCE</p><h1>Building your <span>fitness story.</span></h1><p>Reading your real workout history and activity data…</p></section></main>
  }

  if (error && !activity) {
    return <main className="progress-page"><section className="progress-error"><p className="eyebrow">PROGRESS INTELLIGENCE</p><h1>We couldn't load your <span>activity.</span></h1><p>{error}</p><button className="primary-button" type="button" onClick={() => { setError(''); loadActivity(range) }}>Try again</button></section></main>
  }

  return (
    <main className="progress-page">
      <section className="progress-hero-new">
        <div>
          <p className="eyebrow">PROGRESS INTELLIGENCE</p>
          <h1>{getTodayGreeting()},<br /><span>here's your story.</span></h1>
          <p className="progress-date-line">{formatDate(today?.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <p className="progress-hero-copy">Your activity history stays with you. FitZone reads completed workouts, real active minutes, exercise logs and nutrition activity instead of resetting the story every week.</p>
        </div>
        <div className="progress-today-card">
          <div className="progress-today-top"><span>TODAY</span><strong>{formatDate(today?.date, { month: 'short', day: 'numeric' })}</strong></div>
          <div className="progress-today-metrics">
            <div><strong>{today?.workouts_completed || 0}</strong><span>WORKOUTS</span></div>
            <div><strong>{today?.active_minutes || 0}</strong><span>ACTIVE MIN</span></div>
            <div><strong>{today?.exercises_completed || 0}</strong><span>EXERCISES</span></div>
          </div>
          <p>{today?.nutrition_logged ? 'Nutrition activity is logged today.' : 'No nutrition activity logged today.'}</p>
        </div>
      </section>

      <section className="progress-range-bar">
        <div><span>HISTORY</span><strong>{range === '7d' ? 'Last 7 days' : range === '4w' ? 'Last 4 weeks' : range === '3m' ? 'Last 3 months' : 'Last year'}</strong></div>
        <div className="progress-range-tabs">
          {ranges.map((item) => <button key={item.key} type="button" className={range === item.key ? 'active' : ''} onClick={() => changeRange(item.key)}>{item.label}</button>)}
        </div>
      </section>

      <section className="progress-kpi-grid">
        <article><span>COMPLETED WORKOUTS</span><strong>{summary.total_workouts || 0}</strong><small>{summary.workout_days || 0} workout days in view</small></article>
        <article><span>ACTIVE MINUTES</span><strong>{summary.total_active_minutes || 0}</strong><small>from completed sessions</small></article>
        <article><span>ACTIVE DAYS</span><strong>{summary.active_days || 0}</strong><small>workout or nutrition activity</small></article>
        <article><span>WORKOUT STREAK</span><strong>{summary.current_workout_streak || 0}<em> days</em></strong><small>Best: {summary.best_workout_streak || 0} days</small></article>
      </section>

      <section className="progress-section-new">
        <div className="progress-section-title"><div><p className="eyebrow">ACTIVITY CALENDAR</p><h2>Your real daily rhythm.</h2></div><span className="progress-calendar-note">{activityLoading ? 'Updating…' : 'Every cell is a real recorded day'}</span></div>
        <div className={`progress-heatmap ${range === '1y' ? 'year-view' : ''}`}>
          {(activity?.days || []).map((day) => (
            <button key={day.date} type="button" title={`${formatDate(day.date, { month: 'short', day: 'numeric', year: 'numeric' })} · ${day.workouts_completed} workout${day.workouts_completed === 1 ? '' : 's'} · ${day.active_minutes} active min`} className={`activity-cell level-${intensity(day)} ${selectedDate === day.date ? 'selected' : ''}`} onClick={() => setSelectedDate(day.date)}>
              <span>{new Date(`${day.date}T12:00:00Z`).getUTCDate()}</span>
            </button>
          ))}
        </div>
        <div className="progress-legend"><span>LESS</span><i className="level-0"></i><i className="level-1"></i><i className="level-2"></i><i className="level-3"></i><i className="level-4"></i><span>MORE</span></div>
      </section>

      <section className="progress-two-column">
        <div className="progress-panel">
          <div className="progress-section-title compact"><div><p className="eyebrow">{trendGranularity.toUpperCase()} TREND</p><h2>Active minutes</h2></div><span>{range.toUpperCase()}</span></div>
          <div className="daily-trend-chart">
            {trendDays.map((day) => {
              const height = Math.max(3, Math.round((Number(day.active_minutes || 0) / maxTrendMinutes) * 100))
              return <div className="trend-column" key={day.date}><div className="trend-bar" style={{ height: `${height}%` }} title={`${day.active_minutes} active minutes`}><span>{day.active_minutes > 0 ? day.active_minutes : ''}</span></div><small>{day.label || formatDate(day.date, { month: 'short', day: 'numeric' })}</small></div>
            })}
          </div>
        </div>

        <div className="progress-panel selected-day-panel">
          <div className="progress-section-title compact"><div><p className="eyebrow">DAY DETAIL</p><h2>{formatDate(selected?.date, { weekday: 'short', month: 'short', day: 'numeric' })}</h2></div><span>{selected?.date === today?.date ? 'TODAY' : 'HISTORY'}</span></div>
          {selected ? <div className="selected-day-content">
            <div className="selected-day-main"><strong>{selected.active_minutes}</strong><span>active minutes</span></div>
            <div className="selected-day-grid">
              <div><span>WORKOUTS</span><strong>{selected.workouts_completed}</strong></div>
              <div><span>EXERCISES</span><strong>{selected.exercises_completed}</strong></div>
              <div><span>NUTRITION</span><strong>{selected.nutrition_logged ? `${selected.nutrition_entries} log${selected.nutrition_entries === 1 ? '' : 's'}` : 'None'}</strong></div>
              <div><span>SESSION</span><strong>{selected.workout_names?.[0] || 'No workout recorded'}</strong></div>
            </div>
          </div> : <p className="muted-copy">Select a day above to inspect its real activity.</p>}
        </div>
      </section>

      <section className="progress-two-column">
        <div className="progress-panel goal-progress-panel">
          <div className="progress-section-title compact"><div><p className="eyebrow">YOUR GOAL</p><h2>{goalTitle}</h2></div><span>{latestGoal ? 'ACTIVE' : 'NOT SET'}</span></div>
          {latestGoal ? <div className="goal-progress-list">
            <div><div><span>WEEKLY WORKOUTS</span><strong>{weeklyWorkoutTotal} / {workoutTarget ?? '—'}</strong></div><div className="goal-track"><i style={{ width: `${weeklyWorkoutPercent ?? 0}%` }}></i></div></div>
            <div><div><span>ACTIVE MINUTES</span><strong>{weeklyMinuteTotal} / {minuteTarget ?? '—'}</strong></div><div className="goal-track"><i style={{ width: `${weeklyMinutePercent ?? 0}%` }}></i></div></div>
          </div> : <div className="not-enough-data"><strong>There is no active goal yet.</strong><span>Set a goal in Goals and FitZone will compare future activity against it without inventing a target.</span></div>}
        </div>

        <div className="progress-panel progress-insight-panel">
          <p className="eyebrow">FITZONE AI</p>
          <h2>{summary.total_workouts || summary.total_active_minutes ? 'Your progress has a real trail.' : 'Your story starts here.'}</h2>
          <p>{summary.total_workouts || summary.total_active_minutes ? `FitZone has recorded ${summary.total_workouts || 0} completed workout${summary.total_workouts === 1 ? '' : 's'} and ${summary.total_active_minutes || 0} active minutes in this view. Use the daily calendar to see where your routine is actually happening.` : 'There is not enough activity data yet for a meaningful trend. Complete a workout or log nutrition and this page will update from the real event.'}</p>
          <a href="/assistant" className="insight-link">Open FitZone AI Assistant →</a>
        </div>
      </section>

      {error && <div className="progress-inline-error">{error}</div>}
    </main>
  )
}

export default Progress
