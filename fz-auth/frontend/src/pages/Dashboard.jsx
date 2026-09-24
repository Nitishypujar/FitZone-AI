import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [recommendationUpdating, setRecommendationUpdating] = useState(false)
  const [recommendationError, setRecommendationError] = useState('')

  const token = localStorage.getItem('fitzone_access_token')

  // Shared cache key. Any page (Workout, Progress, etc.) can call
  // queryClient.invalidateQueries({ queryKey: ['dashboard'] }) after a
  // mutation so this page picks up fresh data next time it's viewed,
  // instead of each page holding its own disconnected copy of the state.
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: reloadDashboard,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Please log in to view your dashboard.')
      }

      const [dashboardData, intelligenceData, workoutsData, currentWorkoutData, recommendationData] =
        await Promise.all([
          api.get('/api/dashboard/summary'),
          api.get('/api/intelligence/snapshot'),
          api.get('/api/workouts'),
          api.get('/api/workouts/current').catch(() => null),
          api.get('/api/recommendation'),
        ])

      return {
        dashboard: dashboardData,
        intelligence: intelligenceData.data || null,
        workouts: workoutsData.workouts || [],
        currentWorkout: currentWorkoutData?.workout || null,
        recommendation: recommendationData.recommendation || null,
        recommendationEventId: recommendationData.event_id || null,
      }
    },
  })

  const dashboard = data?.dashboard || null
  const intelligence = data?.intelligence || null
  const workouts = data?.workouts || []
  const currentWorkout = data?.currentWorkout || null
  const recommendation = data?.recommendation || null
  const recommendationEventId = data?.recommendationEventId || null
  const error = queryError?.message || ''

  async function updateRecommendation(updates) {
    if (!recommendationEventId || !token) {
      setRecommendationError(
        'Recommendation session is unavailable.'
      )
      return
    }

    try {
      setRecommendationUpdating(true)
      setRecommendationError('')

      const responseData = await api.put(
        `/api/recommendation/events/${recommendationEventId}`,
        updates
      )

      const updatedEvent = responseData.event || {}

      queryClient.setQueryData(['dashboard'], (current) => {
        if (!current) return current
        return {
          ...current,
          recommendation: {
            ...(current.recommendation || {}),
            event_status: {
              ...(current.recommendation?.event_status || {}),
              ...updatedEvent,
              ...updates,
            },
          },
        }
      })

      console.log(
        'Recommendation event updated:',
        updatedEvent
      )
    } catch (error) {
      console.error(
        'Recommendation update error:',
        error
      )

      setRecommendationError(
        error.message ||
          'Unable to update recommendation.'
      )
    } finally {
      setRecommendationUpdating(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">
              FITZONE AI DASHBOARD
            </p>

            <h1>
              Loading your
              <br />
              <span>fitness dashboard.</span>
            </h1>

            <p>
              Getting your latest fitness data...
            </p>
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
            <p className="eyebrow">
              FITZONE AI DASHBOARD
            </p>

            <h1>
              Something went
              <br />
              <span>wrong.</span>
            </h1>

            <p>{error}</p>
          </div>

          <button
            className="primary-button"
            onClick={reloadDashboard}
          >
            Try Again
          </button>
        </section>
      </main>
    )
  }

  const summary =
    dashboard?.summary ||
    dashboard ||
    {}

  const goalState = intelligence?.user_state?.goal_state || {}

  const weeklyWorkouts = Number(
    goalState.current_weekly_workouts ??
      summary.weekly_completed_workouts ??
      summary.weekly_workouts ??
      summary.completed_workouts_this_week ??
      0
  )

  const weeklyActiveMinutes = Number(
    goalState.current_weekly_active_minutes ??
      summary.weekly_active_minutes ??
      summary.active_minutes_this_week ??
      0
  )

  const weeklyWorkoutTarget = Number(
    goalState.weekly_workout_target ??
      summary.weekly_workout_target ??
      summary.workout_target ??
      0
  )

  const weeklyActiveMinuteTarget = Number(
    goalState.weekly_active_minute_target ??
      summary.weekly_active_minute_target ??
      summary.active_minute_target ??
      0
  )

  const totalCompletedWorkouts = Number(
    summary.total_completed_workouts ??
      summary.completed_workouts ??
      0
  )

  const weeklyWorkoutPercentage =
    weeklyWorkoutTarget > 0
      ? Math.min(
          Math.round(
            (weeklyWorkouts /
              weeklyWorkoutTarget) *
              100
          ),
          100
        )
      : 0

  const weeklyMinutesPercentage =
    weeklyActiveMinuteTarget > 0
      ? Math.min(
          Math.round(
            (weeklyActiveMinutes /
              weeklyActiveMinuteTarget) *
              100
          ),
          100
        )
      : 0

  const consistency =
    weeklyWorkoutTarget > 0
      ? Math.min(
          Math.round(
            (weeklyWorkouts /
              weeklyWorkoutTarget) *
              100
          ),
          100
        )
      : 0

  const weeklyScore = Math.round(
    (weeklyWorkoutPercentage +
      weeklyMinutesPercentage) /
      2
  )

  const today =
    new Date()
      .toISOString()
      .split('T')[0]

  const todaysWorkout =
    (currentWorkout && Array.isArray(currentWorkout.exercises) && currentWorkout.exercises.length > 0
      ? currentWorkout
      : null) ||
    workouts.find(
      (workout) =>
        workout.scheduled_date === today &&
        !workout.completed &&
        Array.isArray(workout.exercises) &&
        workout.exercises.length > 0
    ) ||
    workouts.find(
      (workout) =>
        !workout.completed &&
        Array.isArray(workout.exercises) &&
        workout.exercises.length > 0
    ) ||
    workouts.find(
      (workout) =>
        Array.isArray(workout.exercises) &&
        workout.exercises.length > 0
    ) ||
    null

  const exercises =
    todaysWorkout?.exercises || []

  const workoutIntensity =
    todaysWorkout?.difficulty
      ? todaysWorkout.difficulty
          .charAt(0)
          .toUpperCase() +
        todaysWorkout.difficulty.slice(1)
      : 'Moderate'

  const activityDays = [
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
  ]

  function getDayDate(dayIndex) {
    const currentDate = new Date()
    const currentDay =
      currentDate.getDay()

    const mondayOffset =
      currentDay === 0
        ? -6
        : 1 - currentDay

    const monday =
      new Date(currentDate)

    monday.setDate(
      currentDate.getDate() +
        mondayOffset
    )

    const date =
      new Date(monday)

    date.setDate(
      monday.getDate() +
        dayIndex
    )

    return date
      .toISOString()
      .split('T')[0]
  }

  function getActivityForDay(dayIndex) {
    const date =
      getDayDate(dayIndex)

    const completedWorkout =
      workouts.find(
        (workout) => {
          const completionDate =
            workout.completed_at
              ? workout.completed_at.split(
                  'T'
                )[0]
              : workout.scheduled_date

          return (
            workout.completed &&
            completionDate === date
          )
        }
      )

    if (!completedWorkout) {
      return {
        completed: false,
        height: '12%',
      }
    }

    const duration =
      Number(
        completedWorkout.duration_minutes ||
          30
      )

    const height =
      Math.min(
        Math.max(
          Math.round(
            (duration / 60) * 100
          ),
          25
        ),
        100
      )

    return {
      completed: true,
      height: `${height}%`,
    }
  }

  const nextAction =
    intelligence?.next_best_action ||
    recommendation?.next_action

  const eventStatus =
    recommendation?.event_status || {}

  const accepted =
    eventStatus.accepted

  const completed =
    eventStatus.completed

  const actionLabel = nextAction?.action
    ? nextAction.action
        .replaceAll('-', ' ')
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    : 'Recommendation unavailable'

  const actionScore =
    nextAction?.score ??
    recommendation?.score ??
    null

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            FITZONE AI DASHBOARD
          </p>

          <h1>
            Welcome back,
            <br />
            <span>
              let&apos;s get moving.
            </span>
          </h1>

          <p>
            Your fitness journey at a
            glance. Track today&apos;s
            activity, monitor your
            progress, and stay
            consistent.
          </p>
        </div>

        <Link
          to="/services"
          className="secondary-button"
        >
          Explore Fitness Tools
        </Link>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span>WEEKLY SCORE</span>

          <strong>
            {weeklyScore}
          </strong>

          <p>
            {weeklyScore >= 75
              ? 'Great momentum'
              : 'Keep building consistency'}
          </p>
        </article>

        <article className="dashboard-stat-card">
          <span>WORKOUTS</span>

          <strong>
            {weeklyWorkouts}
          </strong>

          <p>
            of {weeklyWorkoutTarget}{' '}
            weekly goal
          </p>
        </article>

        <article className="dashboard-stat-card">
          <span>ACTIVE TIME</span>

          <strong>
            {(
              weeklyActiveMinutes /
              60
            ).toFixed(1)}
            h
          </strong>

          <p>This week</p>
        </article>

        <article className="dashboard-stat-card">
          <span>CONSISTENCY</span>

          <strong>
            {consistency}%
          </strong>

          <p>
            {consistency >= 75
              ? 'Great momentum'
              : 'Keep going'}
          </p>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card today-workout">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">
                TODAY&apos;S PLAN
              </p>

              <h2>
                {todaysWorkout
                  ? todaysWorkout.workout_name
                  : 'No workout scheduled'}
              </h2>
            </div>

            <span className="dashboard-status">
              {todaysWorkout?.completed
                ? 'DONE'
                : 'READY'}
            </span>
          </div>

          <p className="dashboard-card-description">
            {todaysWorkout
              ? 'Your current workout plan based on your fitness profile and goals.'
              : 'Generate a personalized workout plan from the AI Plan page.'}
          </p>

          <div className="workout-details">
            <div>
              <span>DURATION</span>

              <strong>
                {todaysWorkout?.duration_minutes ||
                  0}{' '}
                min
              </strong>
            </div>

            <div>
              <span>EXERCISES</span>

              <strong>
                {exercises.length}
              </strong>
            </div>

            <div>
              <span>INTENSITY</span>

              <strong>
                {workoutIntensity}
              </strong>
            </div>
          </div>

          {todaysWorkout ? (
            <button
              className="primary-button"
              onClick={() =>
                navigate('/workout')
              }
            >
              Start Workout
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={() =>
                navigate('/ai-plan')
              }
            >
              Generate Workout
            </button>
          )}
        </article>

        <article className="dashboard-card ai-insight">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">
                FITZONE AI
              </p>

              <h2>
                Next best action
              </h2>
            </div>

            <span className="ai-badge">
              AI
            </span>
          </div>

          {nextAction ? (
            <>
              <div className="ai-insight-content">
                <div className="ai-score">
                  <strong>
                    {actionLabel}
                  </strong>

                  <span>
                    Score:{' '}
                    {actionScore !== null
                      ? actionScore
                      : '—'}
                  </span>
                </div>

                <p>
                  {nextAction.reason}
                </p>
              </div>

              {recommendationError && (
                <p
                  style={{
                    marginTop: '10px',
                  }}
                >
                  {recommendationError}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  marginTop: '16px',
                }}
              >
                <button
                  className="primary-button"
                  onClick={() =>
                    updateRecommendation({
                      accepted: true,
                    })
                  }
                  disabled={
                    recommendationUpdating ||
                    accepted === true
                  }
                >
                  {accepted === true
                    ? 'Accepted'
                    : recommendationUpdating
                      ? 'Updating...'
                      : 'Accept'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateRecommendation({
                      accepted: false,
                    })
                  }
                  disabled={
                    recommendationUpdating ||
                    accepted === false
                  }
                >
                  {accepted === false
                    ? 'Skipped'
                    : 'Skip'}
                </button>

                <button
                  className="secondary-button"
                  onClick={() =>
                    updateRecommendation({
                      completed: true,
                    })
                  }
                  disabled={
                    recommendationUpdating ||
                    completed === true
                  }
                >
                  {completed === true
                    ? 'Completed'
                    : 'Mark Complete'}
                </button>
              </div>
            </>
          ) : (
            <div className="ai-insight-content">
              <p>
                Your adaptive fitness
                recommendation is
                unavailable right now.
              </p>
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card progress-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">
                PROGRESS
              </p>

              <h2>
                Weekly activity
              </h2>
            </div>

            <span className="progress-percent">
              {consistency}%
            </span>
          </div>

          <div className="weekly-chart">
            {activityDays.map(
              (day, index) => {
                const activity =
                  getActivityForDay(
                    index
                  )

                return (
                  <div
                    className="chart-day"
                    key={day}
                  >
                    <div
                      className={`chart-bar ${
                        activity.completed
                          ? 'completed'
                          : ''
                      }`}
                      style={{
                        height:
                          activity.height,
                      }}
                    ></div>

                    <span>
                      {day}
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </article>

        <article className="dashboard-card goals-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">
                YOUR GOALS
              </p>

              <h2>
                Current focus
              </h2>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>
                Weekly workouts
              </span>

              <strong>
                {weeklyWorkouts} /{' '}
                {weeklyWorkoutTarget}
              </strong>
            </div>

            <div className="goal-progress">
              <div
                style={{
                  width: `${weeklyWorkoutPercentage}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>
                Active minutes
              </span>

              <strong>
                {weeklyActiveMinutes} /{' '}
                {weeklyActiveMinuteTarget}
              </strong>
            </div>

            <div className="goal-progress">
              <div
                style={{
                  width: `${weeklyMinutesPercentage}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>
                Completed workouts
              </span>

              <strong>
                {totalCompletedWorkouts}
              </strong>
            </div>

            <div className="goal-progress">
              <div
                style={{
                  width: `${Math.min(
                    totalCompletedWorkouts *
                      10,
                    100
                  )}%`,
                }}
              ></div>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default Dashboard