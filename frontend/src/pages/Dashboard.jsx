import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useMemo, useState } from 'react'

const RANGES = [
  { key: '7d', label: '7D' },
  { key: '4w', label: '4W' },
  { key: '3m', label: '3M' },
  { key: '1y', label: '1Y' },
]

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

function getTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDayLabel(dateKey, timeZone, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  if (!dateKey) return 'Today'
  const date = new Date(`${dateKey}T12:00:00Z`)
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(date)
}

function localDateKey(date = new Date(), timeZone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function addDaysToKey(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}

function getCurrentWeekKeys(todayKey) {
  const date = new Date(`${todayKey}T12:00:00Z`)
  const day = date.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return Array.from({ length: 7 }, (_, index) => addDaysToKey(todayKey, mondayOffset + index))
}

function formatGoal(value) {
  if (!value) return 'Not set'
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function intensityClass(entry) {
  if (!entry?.active) return 'empty'
  if (entry.intensity === 'high') return 'high'
  if (entry.intensity === 'moderate') return 'moderate'
  return 'light'
}

function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [range, setRange] = useState('4w')
  const [selectedDate, setSelectedDate] = useState(null)
  const token = localStorage.getItem('fitzone_access_token')
  const timeZone = getTimeZone()
  const now = new Date()
  let storedUser = null
  try {
    storedUser = JSON.parse(localStorage.getItem('fitzone_user') || 'null')
  } catch {
    storedUser = null
  }
  const displayName = storedUser?.user_metadata?.full_name || storedUser?.full_name || storedUser?.email?.split('@')[0] || 'there'


  const dashboardQuery = useQuery({
    queryKey: ['dashboard', timeZone, range],
    enabled: Boolean(token),
    refetchInterval: 60_000,
    queryFn: async () => {
      const [dashboardData, brainData, recommendationData, activityData, nutritionData] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get(`/api/fitness/state?timezone=${encodeURIComponent(timeZone)}`),
        api.get(`/api/recommendation?timezone=${encodeURIComponent(timeZone)}`),
        api.get(`/api/activity/daily?range=${range}&timezone=${encodeURIComponent(timeZone)}`),
        api.get(`/api/nutrition/summary?days=7&timezone=${encodeURIComponent(timeZone)}`),
      ])
      return {
        dashboard: dashboardData?.summary || dashboardData || {},
        brain: brainData || null,
        intelligence: brainData?.intelligence || null,
        currentWorkout: brainData?.today_workout || brainData?.next_open_workout || null,
        recommendation: recommendationData?.recommendation || null,
        recommendationEventId: recommendationData?.event_id || null,
        activity: activityData || null,
        nutrition: nutritionData || null,
      }
    },
  })

  const data = dashboardQuery.data
  const error = dashboardQuery.error?.message || ''
  const activity = data?.activity || {}
  const entries = activity.entries || []
  const activitySummary = activity.summary || {}
  const intelligence = data?.brain?.intelligence || data?.intelligence || {}
  const goalState = intelligence?.user_state?.goal_state || {}
  const recommendation = data?.recommendation || null
  const nextAction = intelligence?.next_best_action || recommendation?.next_action || null
  const currentWorkout = data?.brain?.today_workout || data?.brain?.next_open_workout || data?.currentWorkout || null
  const nutrition = data?.nutrition || {}
  const nutritionToday = nutrition.today || {}
  const nutritionTargets = nutrition.targets || {}

  const currentWeekKeys = useMemo(() => new Set(getCurrentWeekKeys(localDateKey(now, timeZone))), [now, timeZone])
  const weeklyEntries = useMemo(() => entries.filter((entry) => currentWeekKeys.has(entry.date)), [entries, currentWeekKeys])
  const weeklyWorkouts = weeklyEntries.reduce((sum, entry) => sum + Number(entry.completed_workouts || 0), 0)
  const weeklyMinutes = weeklyEntries.reduce((sum, entry) => sum + Number(entry.workout_minutes || 0), 0)
  const weeklyNutritionDays = weeklyEntries.filter((entry) => Number(entry.meals_logged || 0) > 0).length
  const weeklyActiveDays = weeklyEntries.filter((entry) => entry.active).length
  const weeklyWorkoutTarget = Number(goalState.weekly_workout_target) > 0 ? Number(goalState.weekly_workout_target) : null
  const weeklyMinuteTarget = Number(goalState.weekly_active_minute_target) > 0 ? Number(goalState.weekly_active_minute_target) : null
  const workoutTargetPercent = weeklyWorkoutTarget > 0 ? Math.min(Math.round((weeklyWorkouts / weeklyWorkoutTarget) * 100), 100) : null
  const minuteTargetPercent = weeklyMinuteTarget > 0 ? Math.min(Math.round((weeklyMinutes / weeklyMinuteTarget) * 100), 100) : null
  const selectedEntry = useMemo(() => entries.find((entry) => entry.date === selectedDate) || entries[entries.length - 1] || null, [entries, selectedDate])

  const heatmapEntries = useMemo(() => {
    const slice = entries.slice(-28)
    const padded = [...Array(Math.max(0, 28 - slice.length)).fill(null), ...slice]
    return padded
  }, [entries])

  const recentChart = useMemo(() => {
    return entries.map((entry) => ({
      ...entry,
      bar: Math.max(0.06, Number(entry.activity_score || 0)),
    }))
  }, [entries])

  const nowGreeting = getGreeting(now.getHours())
  const formattedToday = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone,
  }).format(now)

  const todaysWorkout = currentWorkout && Array.isArray(currentWorkout.exercises) && currentWorkout.exercises.length ? currentWorkout : null
  const actionLabel = nextAction?.action
    ? nextAction.action.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    : null

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['intelligence'] })
    queryClient.invalidateQueries({ queryKey: ['fitness-brain'] })
    queryClient.invalidateQueries({ queryKey: ['nutrition'] })
  }

  async function handleRecommendation(decision) {
    if (!data?.recommendationEventId) return
    try {
      await api.put(`/api/recommendation/events/${data.recommendationEventId}`, decision)
      invalidateAll()
    } catch (requestError) {
      console.error('Recommendation update failed:', requestError)
    }
  }

  if (!token) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-empty-page">
          <p className="eyebrow">FITZONE AI</p>
          <h1>Sign in to see your <span>real fitness state.</span></h1>
          <p>Your dashboard is backed by your saved workouts, nutrition and progress history.</p>
          <Link className="primary-button" to="/login">Sign in</Link>
        </section>
      </main>
    )
  }

  if (dashboardQuery.isLoading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-header dashboard-loading-state">
          <div>
            <p className="eyebrow">FITZONE AI DASHBOARD</p>
            <h1>Syncing your <span>real activity.</span></h1>
            <p>Pulling the latest workout, nutrition and adaptive intelligence state.</p>
          </div>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">FITZONE AI DASHBOARD</p>
            <h1>We couldn&apos;t load your <span>live state.</span></h1>
            <p>{error}</p>
          </div>
          <button className="primary-button" onClick={() => dashboardQuery.refetch()}>Try again</button>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header dashboard-header-enhanced">
        <div>
          <p className="eyebrow">FITZONE AI DASHBOARD</p>
          <h1>
            {nowGreeting}, {displayName.split(' ')[0]}<br />
            <span>let&apos;s build the day.</span>
          </h1>
          <p className="dashboard-date-line">{formattedToday}</p>
          <p>
            Your dashboard updates from saved activity. No fabricated streaks, calories, workout counts or progress numbers.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/nutrition" className="secondary-button">Log nutrition</Link>
          <Link to="/workout" className="primary-button">Open workout</Link>
        </div>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span>THIS WEEK</span>
          <strong>{weeklyWorkouts}</strong>
          <p>{weeklyWorkoutTarget ? `of ${weeklyWorkoutTarget} planned workouts` : 'completed workouts'}</p>
        </article>
        <article className="dashboard-stat-card">
          <span>ACTIVE MINUTES</span>
          <strong>{numberFormat.format(weeklyMinutes)}</strong>
          <p>{weeklyMinuteTarget ? `of ${weeklyMinuteTarget} planned minutes` : 'from completed workouts'}</p>
        </article>
        <article className="dashboard-stat-card">
          <span>ACTIVE DAYS</span>
          <strong>{weeklyActiveDays}</strong>
          <p>real workout days this calendar week</p>
        </article>
        <article className="dashboard-stat-card">
          <span>NUTRITION DAYS</span>
          <strong>{weeklyNutritionDays}</strong>
          <p>days with saved food entries</p>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card today-workout">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">TODAY&apos;S PLAN</p>
              <h2>{todaysWorkout?.workout_name || 'No current workout'}</h2>
            </div>
            <span className="dashboard-status">{todaysWorkout ? (todaysWorkout.completed ? 'DONE' : 'READY') : 'OPEN AI PLAN'}</span>
          </div>
          <p className="dashboard-card-description">
            {todaysWorkout
              ? 'Your saved workout plan stays separate from recommendation outcomes. Completion is recorded only when the workout itself is finished.'
              : 'No usable current workout is available. Open AI Plan to generate one from your current profile and goal state.'}
          </p>
          <div className="workout-details">
            <div><span>DURATION</span><strong>{todaysWorkout?.duration_minutes || '—'}{todaysWorkout ? ' min' : ''}</strong></div>
            <div><span>EXERCISES</span><strong>{todaysWorkout?.exercises?.length || '—'}</strong></div>
            <div><span>GOAL</span><strong>{formatGoal(goalState.primary_goal || intelligence?.user_state?.primary_goal)}</strong></div>
          </div>
          <button className="primary-button" onClick={() => navigate(todaysWorkout ? '/workout' : '/ai-plan')}>
            {todaysWorkout?.completed ? 'View completed workout' : todaysWorkout ? 'Start workout' : 'Open AI plan'}
          </button>
        </article>

        <article className="dashboard-card ai-insight">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">ADAPTIVE INTELLIGENCE</p>
              <h2>Next best action</h2>
            </div>
            <span className="ai-badge">AI</span>
          </div>
          {nextAction ? (
            <>
              <div className="ai-insight-content">
                <div className="ai-score">
                  <strong>{actionLabel}</strong>
                  <span>{nextAction.score != null ? `Priority ${nextAction.score}` : 'Context-aware'}</span>
                </div>
                <p>{nextAction.reason || nextAction.message || 'FitZone has selected an action from your current state.'}</p>
              </div>
              <div className="recommendation-actions">
                {nextAction.action === 'complete-profile' ? (
                  <Link className="primary-button" to="/profile">Complete Profile →</Link>
                ) : (
                  <>
                    <button className="primary-button" onClick={() => handleRecommendation({ accepted: true })}>Accept</button>
                    <button className="secondary-button" onClick={() => handleRecommendation({ accepted: false })}>Skip</button>
                  </>
                )}
                <Link className="text-link" to="/assistant">Ask FitZone AI</Link>
              </div>
            </>
          ) : (
            <div className="ai-insight-content"><p>Your adaptive recommendation is unavailable right now. The rest of your dashboard remains based on saved data.</p></div>
          )}
        </article>
      </section>

      <section className="dashboard-card dashboard-activity-card">
        <div className="dashboard-card-heading dashboard-activity-heading">
          <div>
            <p className="eyebrow">REAL ACTIVITY</p>
            <h2>Every day, preserved</h2>
            <p className="dashboard-section-copy">Each point comes from completed workouts and saved nutrition entries. Hover or select a day to inspect the underlying activity.</p>
          </div>
          <div className="activity-range-switcher" role="group" aria-label="Activity range">
            {RANGES.map((item) => (
              <button key={item.key} className={range === item.key ? 'active' : ''} onClick={() => { setRange(item.key); setSelectedDate(null) }}>{item.label}</button>
            ))}
          </div>
        </div>

        <div className="activity-summary-strip">
          <div><span>ACTIVE DAYS</span><strong>{activitySummary.active_days || 0}</strong></div>
          <div><span>WORKOUT DAYS</span><strong>{activitySummary.workout_days || 0}</strong></div>
          <div><span>WORKOUT MINUTES</span><strong>{numberFormat.format(activitySummary.active_minutes || 0)}</strong></div>
          <div><span>CURRENT STREAK</span><strong>{activitySummary.current_streak || 0}</strong></div>
        </div>

        <div className="activity-chart" aria-label="Daily activity chart">
          {recentChart.map((entry) => (
            <button
              type="button"
              className={`activity-chart-column ${entry.date === selectedDate ? 'selected' : ''}`}
              key={entry.date}
              title={`${formatDayLabel(entry.date, timeZone)} · ${entry.completed_workouts} workouts · ${entry.workout_minutes} min`}
              onClick={() => setSelectedDate(entry.date)}
            >
              <span className="activity-bar" style={{ height: `${Math.round(entry.bar * 100)}%` }} />
              <span className="activity-chart-label">{entry.date.slice(8)}</span>
            </button>
          ))}
        </div>

        <div className="activity-matrix-wrap">
          <div className="activity-matrix-title">ACTIVITY JOURNEY · LAST 28 DAYS</div>
          <div className="activity-matrix" aria-label="Activity history for the last 28 days">
            {heatmapEntries.map((entry, index) => (
              entry ? (
                <button
                  type="button"
                  key={entry.date}
                  className={`activity-matrix-cell ${intensityClass(entry)} ${entry.date === selectedDate ? 'selected' : ''}`}
                  title={`${formatDayLabel(entry.date, timeZone)} · ${entry.active ? `${entry.workout_minutes} min workout` : ''}${entry.meals_logged ? ` · ${entry.meals_logged} meal${entry.meals_logged > 1 ? 's' : ''}` : ''}`}
                  onClick={() => setSelectedDate(entry.date)}
                  aria-label={`${formatDayLabel(entry.date, timeZone)} activity details`}
                />
              ) : <span aria-hidden="true" key={`placeholder-${index}`} className="activity-matrix-cell placeholder" />
            ))}
          </div>
          <div className="activity-matrix-legend"><span>Less</span><i className="empty" /><i className="light" /><i className="moderate" /><i className="high" /><span>More</span></div>
        </div>

        {selectedEntry && (
          <div className="activity-day-detail">
            <div>
              <p className="eyebrow">SELECTED DAY</p>
              <h3>{formatDayLabel(selectedEntry.date, timeZone, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            </div>
            <div className="activity-detail-metrics">
              <span><strong>{selectedEntry.completed_workouts}</strong> workouts</span>
              <span><strong>{selectedEntry.workout_minutes}</strong> active min</span>
              <span><strong>{selectedEntry.meals_logged}</strong> meals</span>
              <span><strong>{oneDecimal.format(selectedEntry.protein_logged_g || 0)}g</strong> protein</span>
            </div>
            <Link className="secondary-button" to="/progress">Open progress</Link>
          </div>
        )}
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card goals-card">
          <div className="dashboard-card-heading">
            <div><p className="eyebrow">GOAL-DRIVEN</p><h2>Weekly focus</h2></div>
            <Link className="text-link" to="/goals">Manage goals</Link>
          </div>
          <div className="goal-item">
            <div><span>Workouts</span><strong>{weeklyWorkouts}{weeklyWorkoutTarget ? ` / ${weeklyWorkoutTarget}` : ''}</strong></div>
            {weeklyWorkoutTarget ? <div className="goal-progress"><div style={{ width: `${workoutTargetPercent}%` }} /></div> : <p className="goal-missing">Set a weekly workout target to see goal progress.</p>}
          </div>
          <div className="goal-item">
            <div><span>Active minutes</span><strong>{weeklyMinutes}{weeklyMinuteTarget ? ` / ${weeklyMinuteTarget}` : ''}</strong></div>
            {weeklyMinuteTarget ? <div className="goal-progress"><div style={{ width: `${minuteTargetPercent}%` }} /></div> : <p className="goal-missing">Your current goal has no weekly minute target yet.</p>}
          </div>
        </article>

        <article className="dashboard-card nutrition-snapshot-card">
          <div className="dashboard-card-heading">
            <div><p className="eyebrow">NUTRITION</p><h2>Today at a glance</h2></div>
            <Link className="text-link" to="/nutrition">Open nutrition</Link>
          </div>
          <div className="nutrition-snapshot-grid">
            <div><span>CALORIES</span><strong>{numberFormat.format(nutritionToday.totals?.calories || 0)}</strong><small>{nutritionTargets.available ? `of ${numberFormat.format(nutritionTargets.calories)} target` : 'logged'}</small></div>
            <div><span>PROTEIN</span><strong>{oneDecimal.format(nutritionToday.totals?.protein_g || 0)}g</strong><small>{nutritionTargets.available ? `of ${numberFormat.format(nutritionTargets.protein_g)}g target` : 'logged'}</small></div>
            <div><span>MEALS</span><strong>{nutritionToday.meals_logged || 0}</strong><small>saved today</small></div>
          </div>
          {nutritionTargets.available && nutritionToday.percentages?.protein_g != null ? (
            <p className="dashboard-inline-insight">Protein progress: {nutritionToday.percentages.protein_g}% of today&apos;s planning target.</p>
          ) : (
            <p className="dashboard-inline-insight">Complete the profile fields needed for personalized nutrition planning.</p>
          )}
        </article>
      </section>
    </main>
  )
}

export default Dashboard
