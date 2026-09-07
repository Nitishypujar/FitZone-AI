import { useEffect, useMemo, useState } from 'react'

const API_URL = 'http://localhost:5000'

function Progress() {
  const [progress, setProgress] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [workoutLogs, setWorkoutLogs] = useState([])
  const [goals, setGoals] = useState([])
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
        logsResponse,
        goalsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/progress`, {
          method: 'GET',
          headers,
        }),

        fetch(`${API_URL}/api/workouts`, {
          method: 'GET',
          headers,
        }),

        fetch(`${API_URL}/api/workout-logs`, {
          method: 'GET',
          headers,
        }),

        fetch(`${API_URL}/api/goals`, {
          method: 'GET',
          headers,
        }),
      ])

      const progressData = await progressResponse.json()
      const workoutsData = await workoutsResponse.json()
      const logsData = await logsResponse.json()
      const goalsData = await goalsResponse.json()

      if (!progressResponse.ok) {
        throw new Error(
          progressData.message ||
            'Unable to load progress data.'
        )
      }

      if (!workoutsResponse.ok) {
        throw new Error(
          workoutsData.message ||
            'Unable to load workouts.'
        )
      }

      if (!logsResponse.ok) {
        throw new Error(
          logsData.message ||
            'Unable to load workout activity.'
        )
      }

      if (!goalsResponse.ok) {
        throw new Error(
          goalsData.message ||
            'Unable to load goals.'
        )
      }

      setProgress(progressData.progress || [])
      setWorkouts(workoutsData.workouts || [])
      setWorkoutLogs(logsData.logs || [])
      setGoals(goalsData.goals || [])
    } catch (err) {
      console.error(
        'Progress loading error:',
        err
      )

      setError(
        err.message ||
          'Unable to load progress.'
      )
    } finally {
      setLoading(false)
    }
  }

  const latestProgress =
    progress.length > 0
      ? progress[progress.length - 1]
      : null

  const latestGoal =
    goals.length > 0
      ? goals[0]
      : null

  /*
   * Total completed workouts.
   *
   * We use the workouts table directly.
   * This prevents one workout with multiple completed
   * exercises from being counted multiple times.
   */
  const totalWorkouts = useMemo(() => {
    return workouts.filter(
      (workout) => workout.completed === true
    ).length
  }, [workouts])

  /*
   * Total completed exercises.
   */
  const totalExercisesCompleted = useMemo(() => {
    return workoutLogs.filter(
      (log) => log.completed === true
    ).length
  }, [workoutLogs])

  /*
   * Total active minutes.
   *
   * Completed workouts contain their actual duration.
   */
  const totalActiveMinutes = useMemo(() => {
    return workouts
      .filter(
        (workout) => workout.completed === true
      )
      .reduce(
        (total, workout) =>
          total +
          Number(workout.duration_minutes || 0),
        0
      )
  }, [workouts])

  const weeklyWorkoutTarget =
    latestGoal?.weekly_workout_target !==
      null &&
    latestGoal?.weekly_workout_target !==
      undefined
      ? Number(
          latestGoal.weekly_workout_target
        )
      : 0

  const weeklyActiveMinuteTarget =
    latestGoal?.weekly_active_minute_target !==
      null &&
    latestGoal?.weekly_active_minute_target !==
      undefined
      ? Number(
          latestGoal.weekly_active_minute_target
        )
      : 0

  function getStartOfWeek(date) {
    const result = new Date(date)

    const day = result.getDay()

    const difference =
      day === 0
        ? -6
        : 1 - day

    result.setDate(
      result.getDate() + difference
    )

    result.setHours(0, 0, 0, 0)

    return result
  }

  const startOfWeek =
    getStartOfWeek(new Date())

  /*
   * Completed workouts this week.
   */
  const completedWorkoutsThisWeek =
    useMemo(() => {
      return workouts.filter((workout) => {
        if (!workout.completed) {
          return false
        }

        const dateSource =
          workout.completed_at ||
          workout.updated_at ||
          workout.created_at ||
          workout.scheduled_date

        if (!dateSource) {
          return false
        }

        const date = new Date(dateSource)

        return date >= startOfWeek
      }).length
    }, [workouts, startOfWeek])

  /*
   * Active minutes this week.
   *
   * Uses completed workouts and their duration.
   */
  const activeMinutesThisWeek =
    useMemo(() => {
      return workouts
        .filter((workout) => {
          if (!workout.completed) {
            return false
          }

          const dateSource =
            workout.completed_at ||
            workout.updated_at ||
            workout.created_at ||
            workout.scheduled_date

          if (!dateSource) {
            return false
          }

          const date = new Date(dateSource)

          return date >= startOfWeek
        })
        .reduce(
          (total, workout) =>
            total +
            Number(
              workout.duration_minutes || 0
            ),
          0
        )
    }, [workouts, startOfWeek])

  /*
   * Weekly workout target percentage.
   */
  const workoutTargetPercentage =
    weeklyWorkoutTarget > 0
      ? Math.min(
          100,
          Math.round(
            (completedWorkoutsThisWeek /
              weeklyWorkoutTarget) *
              100
          )
        )
      : 0

  /*
   * Weekly active-minute target percentage.
   */
  const activeMinuteTargetPercentage =
    weeklyActiveMinuteTarget > 0
      ? Math.min(
          100,
          Math.round(
            (activeMinutesThisWeek /
              weeklyActiveMinuteTarget) *
              100
          )
        )
      : 0

  /*
   * Fitness score.
   *
   * This will eventually be calculated by our AI/ML
   * progress system. For now we use the latest
   * stored value.
   */
  const fitnessScore =
    latestProgress?.fitness_score !== null &&
    latestProgress?.fitness_score !== undefined
      ? Number(latestProgress.fitness_score)
      : 0

  /*
   * Weekly activity chart.
   *
   * One completed workout = one activity.
   */
  const weeklyActivity = useMemo(() => {
    const days = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ]

    return days.map((day, index) => {
      const date = new Date(startOfWeek)

      date.setDate(
        date.getDate() + index
      )

      const dateKey =
        date.toISOString().split('T')[0]

      const workoutCount =
        workouts.filter((workout) => {
          if (!workout.completed) {
            return false
          }

          const dateSource =
            workout.completed_at ||
            workout.updated_at ||
            workout.created_at ||
            workout.scheduled_date

          if (!dateSource) {
            return false
          }

          const workoutDate =
            new Date(dateSource)
              .toISOString()
              .split('T')[0]

          return workoutDate === dateKey
        }).length

      return {
        day,
        workouts: workoutCount,
      }
    })
  }, [workouts, startOfWeek])

  const maxDailyWorkouts = Math.max(
    1,
    ...weeklyActivity.map(
      (item) => item.workouts
    )
  )

  /*
   * Goal display name.
   */
  const goalTitleMap = {
    strength: 'Build Strength',
    muscle: 'Build Muscle',
    'weight-loss': 'Lose Weight',
    fitness: 'Improve Fitness',
  }

  const goalTitle =
    goalTitleMap[latestGoal?.goal_type] ||
    'Set a Fitness Goal'

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <main className="progress-page">
        <section className="progress-header">
          <div>
            <p className="eyebrow">
              PROGRESS INTELLIGENCE
            </p>

            <h1>
              Loading your
              <br />
              <span>progress.</span>
            </h1>

            <p>
              Fetching your latest fitness
              and workout data...
            </p>
          </div>
        </section>
      </main>
    )
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <main className="progress-page">
        <section className="progress-header">
          <div>
            <p className="eyebrow">
              PROGRESS INTELLIGENCE
            </p>

            <h1>
              Something went
              <br />
              <span>wrong.</span>
            </h1>

            <p>{error}</p>

            <button
              type="button"
              className="primary-button"
              onClick={loadProgressData}
            >
              Try Again
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="progress-page">

      {/* HEADER */}
      <section className="progress-header">
        <div>
          <p className="eyebrow">
            PROGRESS INTELLIGENCE
          </p>

          <h1>
            Your fitness
            <br />
            <span>progress.</span>
          </h1>

          <p>
            Track your training consistency,
            activity, and fitness progress.
          </p>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              OVERVIEW
            </p>

            <h2>Your Numbers</h2>
          </div>
        </div>

        <div className="stats-grid">

          <div className="stat-card">
            <span>
              Completed Workouts
            </span>

            <strong>
              {totalWorkouts}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Exercises Completed
            </span>

            <strong>
              {totalExercisesCompleted}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Active Minutes
            </span>

            <strong>
              {totalActiveMinutes}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Fitness Score
            </span>

            <strong>
              {fitnessScore}
            </strong>
          </div>

        </div>
      </section>

      {/* WEEKLY TARGETS */}
      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              WEEKLY TARGETS
            </p>

            <h2>This Week</h2>
          </div>
        </div>

        <div className="progress-grid">

          <div className="progress-card">

            <div className="progress-card-header">
              <span>
                Workouts
              </span>

              <strong>
                {completedWorkoutsThisWeek}
                {' / '}
                {weeklyWorkoutTarget || 0}
              </strong>
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${workoutTargetPercentage}%`,
                }}
              />
            </div>

            <p>
              {weeklyWorkoutTarget === 0
                ? 'Set a weekly workout target in Goals.'
                : `${completedWorkoutsThisWeek} of ${weeklyWorkoutTarget} weekly workouts completed.`}
            </p>

          </div>

          <div className="progress-card">

            <div className="progress-card-header">
              <span>
                Active Minutes
              </span>

              <strong>
                {activeMinutesThisWeek}
                {' / '}
                {weeklyActiveMinuteTarget || 0}
              </strong>
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{
                  width: `${activeMinuteTargetPercentage}%`,
                }}
              />
            </div>

            <p>
              {weeklyActiveMinuteTarget === 0
                ? 'Set an active-minute target in Goals.'
                : `${activeMinutesThisWeek} of ${weeklyActiveMinuteTarget} weekly active minutes completed.`}
            </p>

          </div>

        </div>
      </section>

      {/* WEEKLY ACTIVITY */}
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

          {weeklyActivity.map((item) => {
            const height =
              item.workouts === 0
                ? 4
                : Math.max(
                    12,
                    (item.workouts /
                      maxDailyWorkouts) *
                      100
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
          })}

        </div>
      </section>

      {/* AI INSIGHT */}
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
            {goalTitle}
          </strong>

          <p>
            {weeklyWorkoutTarget === 0
              ? 'Set a weekly workout goal to start tracking your target.'
              : completedWorkoutsThisWeek >=
                  weeklyWorkoutTarget
                ? 'You have reached your current weekly workout target. Keep building consistency.'
                : `You have ${
                    weeklyWorkoutTarget -
                    completedWorkoutsThisWeek
                  } workout${
                    weeklyWorkoutTarget -
                      completedWorkoutsThisWeek ===
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