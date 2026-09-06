import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000'

function Progress() {
  const [progress, setProgress] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [goal, setGoal] = useState(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgressData()
  }, [])

  async function loadProgressData() {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        setError('Please log in to view your progress.')
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [
        progressResponse,
        workoutsResponse,
        goalsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/progress`, { headers }),
        fetch(`${API_URL}/api/workouts`, { headers }),
        fetch(`${API_URL}/api/goals`, { headers }),
      ])

      const progressData = await progressResponse.json()
      const workoutsData = await workoutsResponse.json()
      const goalsData = await goalsResponse.json()

      if (!progressResponse.ok) {
        throw new Error(
          progressData.message ||
            'Failed to load progress data.',
        )
      }

      if (!workoutsResponse.ok) {
        throw new Error(
          workoutsData.message ||
            'Failed to load workouts.',
        )
      }

      if (!goalsResponse.ok) {
        throw new Error(
          goalsData.message ||
            'Failed to load goals.',
        )
      }

      setProgress(progressData.progress || [])
      setWorkouts(workoutsData.workouts || [])

      if (
        goalsData.goals &&
        goalsData.goals.length > 0
      ) {
        setGoal(goalsData.goals[0])
      } else {
        setGoal(null)
      }
    } catch (err) {
      console.error('Progress loading error:', err)

      setError(
        err.message ||
          'Something went wrong while loading progress.',
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * Use the latest progress entry when available.
   */
  const latestProgress =
    progress.length > 0
      ? progress[0]
      : null

  /*
   * Read the current goal fields.
   */
  const weeklyWorkoutTarget =
    goal?.weekly_workout_target !== null &&
    goal?.weekly_workout_target !== undefined
      ? Number(goal.weekly_workout_target)
      : 0

  const weeklyActiveMinuteTarget =
    goal?.weekly_active_minute_target !== null &&
    goal?.weekly_active_minute_target !== undefined
      ? Number(goal.weekly_active_minute_target)
      : 0

  /*
   * Determine the beginning of the current week.
   * Monday is treated as the first day.
   */
  function getStartOfWeek(date) {
    const result = new Date(date)
    const day = result.getDay()

    const difference =
      day === 0
        ? -6
        : 1 - day

    result.setDate(
      result.getDate() + difference,
    )

    result.setHours(0, 0, 0, 0)

    return result
  }

  const startOfWeek =
    getStartOfWeek(new Date())

  /*
   * Only COMPLETED workouts count toward progress.
   *
   * We intentionally use the workouts table here
   * instead of workout_logs.
   *
   * One workout can contain many exercise logs,
   * so counting exercise logs would inflate progress.
   */
  const completedWorkoutsThisWeek =
    workouts.filter((workout) => {
      if (!workout.completed) {
        return false
      }

      const workoutDate =
        workout.scheduled_date
          ? new Date(
              `${workout.scheduled_date}T00:00:00`,
            )
          : new Date(workout.created_at)

      return workoutDate >= startOfWeek
    })

  /*
   * Number of completed workouts this week.
   */
  const completedWorkoutCount =
    completedWorkoutsThisWeek.length

  /*
   * Active minutes come from the workout's
   * duration_minutes field.
   *
   * This is more accurate than adding individual
   * exercise duration_seconds values.
   */
  const activeMinutesThisWeek =
    Math.round(
      completedWorkoutsThisWeek.reduce(
        (total, workout) => {
          const duration =
            Number(
              workout.duration_minutes,
            ) || 0

          return total + duration
        },
        0,
      ),
    )

  /*
   * Percent calculations.
   */
  const workoutPercentage =
    weeklyWorkoutTarget > 0
      ? Math.min(
          100,
          Math.round(
            (completedWorkoutCount /
              weeklyWorkoutTarget) *
              100,
          ),
        )
      : 0

  const activeMinutesPercentage =
    weeklyActiveMinuteTarget > 0
      ? Math.min(
          100,
          Math.round(
            (activeMinutesThisWeek /
              weeklyActiveMinuteTarget) *
              100,
          ),
        )
      : 0

  /*
   * Fitness score.
   */
  const fitnessScore =
    latestProgress?.fitness_score !== null &&
    latestProgress?.fitness_score !== undefined
      ? Number(latestProgress.fitness_score)
      : 0

  /*
   * Weekly activity chart.
   *
   * Each completed workout is counted once
   * on its scheduled/created day.
   */
  const weeklyActivity = [
    { day: 'Mon', workouts: 0 },
    { day: 'Tue', workouts: 0 },
    { day: 'Wed', workouts: 0 },
    { day: 'Thu', workouts: 0 },
    { day: 'Fri', workouts: 0 },
    { day: 'Sat', workouts: 0 },
    { day: 'Sun', workouts: 0 },
  ]

  completedWorkoutsThisWeek.forEach(
    (workout) => {
      const workoutDate =
        workout.scheduled_date
          ? new Date(
              `${workout.scheduled_date}T00:00:00`,
            )
          : new Date(workout.created_at)

      const day = workoutDate.getDay()

      const dayIndex =
        day === 0
          ? 6
          : day - 1

      weeklyActivity[dayIndex].workouts += 1
    },
  )

  const maxDailyWorkouts = Math.max(
    1,
    ...weeklyActivity.map(
      (item) => item.workouts,
    ),
  )

  /*
   * Consistency represents how evenly the user
   * has distributed workouts across the week.
   */
  const activeDays =
    weeklyActivity.filter(
      (item) => item.workouts > 0,
    ).length

  const averageWeeklyActivity =
    Math.round(
      (activeDays / 7) * 100,
    )

  /*
   * Current goal display name.
   */
  const goalTitleMap = {
    strength: 'Build Strength',
    muscle: 'Build Muscle',
    'weight-loss': 'Lose Weight',
    fitness: 'Improve Fitness',
  }

  const goalTitle =
    goalTitleMap[goal?.goal_type] ||
    'Set a Fitness Goal'

  if (loading) {
    return (
      <main className="page-container">
        <section className="page-header">
          <p className="eyebrow">
            PROGRESS
          </p>

          <h1>
            Track Your Progress
          </h1>

          <p>
            Loading your latest fitness
            data...
          </p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-container">
        <section className="page-header">
          <p className="eyebrow">
            PROGRESS
          </p>

          <h1>
            Track Your Progress
          </h1>

          <p>{error}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-container">
      <section className="page-header">
        <p className="eyebrow">
          PROGRESS
        </p>

        <h1>
          Track Your Progress
        </h1>

        <p>
          Monitor your workouts,
          activity, consistency, and
          progress toward your current
          fitness goal.
        </p>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">
            WEEKLY SCORE
          </span>

          <strong className="stat-value">
            {fitnessScore || 0}
          </strong>

          <span className="stat-meta">
            Current fitness score
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            WORKOUTS
          </span>

          <strong className="stat-value">
            {completedWorkoutCount}

            <span className="stat-target">
              / {weeklyWorkoutTarget || 0}
            </span>
          </strong>

          <span className="stat-meta">
            Weekly workout goal
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            ACTIVE TIME
          </span>

          <strong className="stat-value">
            {activeMinutesThisWeek}

            <span className="stat-target">
              {' '}
              min
            </span>
          </strong>

          <span className="stat-meta">
            Target:{' '}
            {weeklyActiveMinuteTarget ||
              0}{' '}
            min
          </span>
        </div>

        <div className="stat-card">
          <span className="stat-label">
            CONSISTENCY
          </span>

          <strong className="stat-value">
            {averageWeeklyActivity}%
          </strong>

          <span className="stat-meta">
            Weekly activity
          </span>
        </div>
      </section>

      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              CURRENT GOAL
            </p>

            <h2>{goalTitle}</h2>
          </div>
        </div>

        {!goal ? (
          <div className="empty-state">
            <p>
              No fitness goal has
              been created yet.
            </p>

            <p>
              Go to the Goals page and
              create your first goal.
            </p>
          </div>
        ) : (
          <div className="goal-progress-grid">
            <div className="progress-card">
              <div className="progress-card-header">
                <div>
                  <span>
                    WEEKLY WORKOUTS
                  </span>

                  <h3>
                    {completedWorkoutCount}{' '}
                    /{' '}
                    {weeklyWorkoutTarget}
                  </h3>
                </div>

                <strong>
                  {workoutPercentage}%
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${workoutPercentage}%`,
                  }}
                />
              </div>
            </div>

            <div className="progress-card">
              <div className="progress-card-header">
                <div>
                  <span>
                    ACTIVE MINUTES
                  </span>

                  <h3>
                    {activeMinutesThisWeek}{' '}
                    /{' '}
                    {weeklyActiveMinuteTarget}{' '}
                    min
                  </h3>
                </div>

                <strong>
                  {activeMinutesPercentage}%
                </strong>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${activeMinutesPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              WEEKLY ACTIVITY
            </p>

            <h2>
              Your Activity This Week
            </h2>
          </div>
        </div>

        <div className="weekly-chart">
          {weeklyActivity.map(
            (item) => {
              const height =
                item.workouts === 0
                  ? 4
                  : Math.max(
                      12,
                      (item.workouts /
                        maxDailyWorkouts) *
                        100,
                    )

              return (
                <div
                  className="chart-column"
                  key={item.day}
                >
                  <div className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${height}%`,
                      }}
                      title={`${item.workouts} workout(s)`}
                    />
                  </div>

                  <span>
                    {item.day}
                  </span>
                </div>
              )
            },
          )}
        </div>
      </section>

      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              AI INSIGHT
            </p>

            <h2>
              Progress Snapshot
            </h2>
          </div>
        </div>

        <div className="insight-card">
          <strong>
            {completedWorkoutCount} /{' '}
            {weeklyWorkoutTarget || 0}{' '}
            weekly workouts completed.
          </strong>

          <p>
            {weeklyWorkoutTarget === 0
              ? 'Set a weekly workout goal to start tracking your target.'
              : completedWorkoutCount >=
                weeklyWorkoutTarget
                ? 'You have reached your current weekly workout target. Keep building consistency.'
                : `You have ${
                    weeklyWorkoutTarget -
                    completedWorkoutCount
                  } workout${
                    weeklyWorkoutTarget -
                      completedWorkoutCount ===
                    1
                      ? ''
                      : 's'
                  } remaining to reach your weekly target.`}
          </p>
        </div>
      </section>
    </main>
  )
}

export default Progress