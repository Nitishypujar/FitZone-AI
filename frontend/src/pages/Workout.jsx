import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000'

const exercises = [
  {
    id: 1,
    name: 'Push Ups',
    category: 'CHEST',
    sets: 3,
    reps: 12,
    rest: '60 sec',
  },
  {
    id: 2,
    name: 'Dumbbell Shoulder Press',
    category: 'SHOULDERS',
    sets: 3,
    reps: 10,
    rest: '75 sec',
  },
  {
    id: 3,
    name: 'Dumbbell Row',
    category: 'BACK',
    sets: 3,
    reps: 10,
    rest: '75 sec',
  },
  {
    id: 4,
    name: 'Bicep Curls',
    category: 'ARMS',
    sets: 3,
    reps: 12,
    rest: '60 sec',
  },
  {
    id: 5,
    name: 'Tricep Extensions',
    category: 'ARMS',
    sets: 3,
    reps: 12,
    rest: '60 sec',
  },
  {
    id: 6,
    name: 'Plank',
    category: 'CORE',
    sets: 3,
    reps: '45 sec',
    rest: '45 sec',
  },
]

function Workout() {
  const [completedExercises, setCompletedExercises] = useState([])
  const [workout, setWorkout] = useState(null)

  const [loading, setLoading] = useState(true)
  const [savingExercise, setSavingExercise] = useState(null)
  const [completingWorkout, setCompletingWorkout] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchWorkout()
  }, [])

  async function fetchWorkout() {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        setError('Please sign in to view your workouts.')
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // --------------------------------------------
      // 1. LOAD USER WORKOUTS
      // --------------------------------------------

      const workoutResponse = await fetch(
        `${API_URL}/api/workouts`,
        {
          method: 'GET',
          headers,
        }
      )

      const workoutData = await workoutResponse.json()

      if (!workoutResponse.ok) {
        throw new Error(
          workoutData.message ||
            'Unable to load workouts.'
        )
      }

      const workouts = Array.isArray(
        workoutData.workouts
      )
        ? workoutData.workouts
        : []

      if (workouts.length === 0) {
        setWorkout(null)
        setCompletedExercises([])
        return
      }

      // --------------------------------------------
      // 2. SELECT MOST RECENT WORKOUT
      // --------------------------------------------

      const sortedWorkouts = workouts
        .slice()
        .sort((a, b) => {
          const dateA = new Date(
            a.created_at || 0
          ).getTime()

          const dateB = new Date(
            b.created_at || 0
          ).getTime()

          if (dateB !== dateA) {
            return dateB - dateA
          }

          return Number(b.id) - Number(a.id)
        })

      const currentWorkout = sortedWorkouts[0]

      if (!currentWorkout) {
        setWorkout(null)
        setCompletedExercises([])
        return
      }

      setWorkout(currentWorkout)

      // --------------------------------------------
      // 3. LOAD LOGS FOR THIS SPECIFIC WORKOUT
      // --------------------------------------------

      const logsResponse = await fetch(
        `${API_URL}/api/workout-logs?workout_id=${encodeURIComponent(
          currentWorkout.id
        )}`,
        {
          method: 'GET',
          headers,
        }
      )

      const logsData = await logsResponse.json()

      if (!logsResponse.ok) {
        throw new Error(
          logsData.message ||
            'Unable to load workout progress.'
        )
      }

      // Backend must return:
      // {
      //   status: 'success',
      //   workout_logs: [...]
      // }

      const logs = Array.isArray(
        logsData.workout_logs
      )
        ? logsData.workout_logs
        : []

      // --------------------------------------------
      // 4. REBUILD COMPLETED EXERCISES
      // --------------------------------------------

      const completedIds = []

      logs.forEach((log) => {
        const isCompleted =
          log.completed === true ||
          log.completed === 'true' ||
          log.completed === 1 ||
          log.completed === '1'

        if (!isCompleted) {
          return
        }

        if (
          !log.exercise_name ||
          typeof log.exercise_name !== 'string'
        ) {
          return
        }

        const savedName = log.exercise_name
          .trim()
          .toLowerCase()

        const matchingExercise =
          exercises.find(
            (exercise) =>
              exercise.name
                .trim()
                .toLowerCase() === savedName
          )

        if (matchingExercise) {
          completedIds.push(
            Number(matchingExercise.id)
          )
        }
      })

      // Remove duplicates
      const uniqueCompletedIds = [
        ...new Set(completedIds),
      ]

      setCompletedExercises(
        uniqueCompletedIds
      )

      console.log(
        'FitZone workout loaded:',
        currentWorkout
      )

      console.log(
        'FitZone workout logs:',
        logs
      )

      console.log(
        'FitZone completed exercise IDs:',
        uniqueCompletedIds
      )
    } catch (error) {
      console.error(
        'Workout loading error:',
        error
      )

      setError(
        error.message ||
          'Unable to load your workout.'
      )
    } finally {
      setLoading(false)
    }
  }

  // --------------------------------------------
  // TOGGLE INDIVIDUAL EXERCISE
  // --------------------------------------------

  async function toggleExercise(exercise) {
    if (!workout) {
      return
    }

    if (savingExercise !== null) {
      return
    }

    const token = localStorage.getItem(
      'fitzone_access_token'
    )

    if (!token) {
      setError('Please sign in again.')
      return
    }

    const exerciseId = Number(exercise.id)

    const isCurrentlyCompleted =
      completedExercises.includes(exerciseId)

    const newCompletedState =
      !isCurrentlyCompleted

    try {
      setSavingExercise(exerciseId)
      setError('')
      setSuccess('')

      // ------------------------------------------
      // SAVE TO BACKEND
      // ------------------------------------------

      const response = await fetch(
        `${API_URL}/api/workout-logs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workout_id: Number(workout.id),
            exercise_name: exercise.name,
            sets: exercise.sets,

            repetitions:
              typeof exercise.reps === 'number'
                ? exercise.reps
                : null,

            duration_seconds:
              typeof exercise.reps === 'string'
                ? 45
                : null,

            completed: newCompletedState,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to save exercise progress.'
        )
      }

      // ------------------------------------------
      // UPDATE UI ONLY AFTER BACKEND SUCCESS
      // ------------------------------------------

      setCompletedExercises(
        (previous) => {
          const currentIds = new Set(
            previous.map(Number)
          )

          if (newCompletedState) {
            currentIds.add(exerciseId)
          } else {
            currentIds.delete(exerciseId)
          }

          return [...currentIds]
        }
      )

      setSuccess(
        newCompletedState
          ? `${exercise.name} completed.`
          : `${exercise.name} marked incomplete.`
      )

      console.log(
        'FitZone exercise saved:',
        data
      )
    } catch (error) {
      console.error(
        'Exercise update error:',
        error
      )

      setError(
        error.message ||
          'Unable to save exercise progress.'
      )
    } finally {
      setSavingExercise(null)
    }
  }

  // --------------------------------------------
  // COMPLETE ENTIRE WORKOUT
  // --------------------------------------------

  async function completeWorkout() {
    if (!workout) {
      return
    }

    if (
      completedExercises.length !==
      exercises.length
    ) {
      setError(
        'Complete all exercises before finishing the workout.'
      )
      return
    }

    const token = localStorage.getItem(
      'fitzone_access_token'
    )

    if (!token) {
      setError('Please sign in again.')
      return
    }

    try {
      setCompletingWorkout(true)
      setError('')
      setSuccess('')

      const response = await fetch(
        `${API_URL}/api/workouts/${workout.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: true,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Unable to complete workout.'
        )
      }

      setWorkout((previous) => ({
        ...previous,
        completed: true,
      }))

      setSuccess(
        'Workout completed successfully. Great work!'
      )

      console.log(
        'FitZone workout completed:',
        data
      )
    } catch (error) {
      console.error(
        'Workout completion error:',
        error
      )

      setError(
        error.message ||
          'Unable to complete workout.'
      )
    } finally {
      setCompletingWorkout(false)
    }
  }

  // --------------------------------------------
  // CALCULATED VALUES
  // --------------------------------------------

  const completedCount =
    completedExercises.length

  const progress =
    exercises.length > 0
      ? Math.round(
          (completedCount /
            exercises.length) *
            100
        )
      : 0

  const allExercisesCompleted =
    completedCount === exercises.length

  // --------------------------------------------
  // LOADING
  // --------------------------------------------

  if (loading) {
    return (
      <main className="workout-page">
        <section className="workout-header">
          <div>
            <p className="eyebrow">
              MY WORKOUT
            </p>

            <h1>
              Loading your
              <br />
              <span>workout.</span>
            </h1>

            <p>
              Loading your latest workout from
              FitZone AI.
            </p>
          </div>
        </section>
      </main>
    )
  }

  // --------------------------------------------
  // ERROR WITHOUT WORKOUT
  // --------------------------------------------

  if (error && !workout) {
    return (
      <main className="workout-page">
        <section className="workout-header">
          <div>
            <p className="eyebrow">
              MY WORKOUT
            </p>

            <h1>
              Something went
              <br />
              <span>wrong.</span>
            </h1>

            <p>{error}</p>
          </div>
        </section>
      </main>
    )
  }

  // --------------------------------------------
  // NO WORKOUT
  // --------------------------------------------

  if (!workout) {
    return (
      <main className="workout-page">
        <section className="workout-header">
          <div>
            <p className="eyebrow">
              MY WORKOUT
            </p>

            <h1>
              No workout
              <br />
              <span>scheduled.</span>
            </h1>

            <p>
              You don't have a workout in your
              account yet. Once a workout is
              created, it will appear here.
            </p>
          </div>
        </section>
      </main>
    )
  }

  // --------------------------------------------
  // MAIN PAGE
  // --------------------------------------------

  return (
    <main className="workout-page">

      {/* HEADER */}
      <section className="workout-header">
        <div>
          <p className="eyebrow">
            MY WORKOUT
          </p>

          <h1>
            {workout.workout_name}
            <br />

            <span>
              {workout.workout_type ||
                'Training'}
              .
            </span>
          </h1>

          <p>
            Complete today's session and keep
            building your consistency with
            FitZone AI.
          </p>
        </div>

        <div className="workout-summary">
          <span>
            SESSION PROGRESS
          </span>

          <strong>
            {progress}%
          </strong>

          <div className="workout-progress-track">
            <div
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <p>
            {completedCount} of{' '}
            {exercises.length} exercises
            completed
          </p>
        </div>
      </section>

      {/* WORKOUT META */}
      <section className="workout-meta">

        <div>
          <span>DURATION</span>

          <strong>
            {workout.duration_minutes
              ? `${workout.duration_minutes} min`
              : '—'}
          </strong>
        </div>

        <div>
          <span>EXERCISES</span>

          <strong>
            {exercises.length}
          </strong>
        </div>

        <div>
          <span>DIFFICULTY</span>

          <strong>
            {workout.difficulty || '—'}
          </strong>
        </div>

        <div>
          <span>TYPE</span>

          <strong>
            {workout.workout_type || '—'}
          </strong>
        </div>

      </section>

      {/* ERROR MESSAGE */}
      {error && (
        <p className="auth-error">
          {error}
        </p>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <p className="profile-success">
          {success}
        </p>
      )}

      {/* EXERCISES */}
      <section className="exercise-section">

        <div className="section-heading">
          <p className="eyebrow">
            TODAY'S EXERCISES
          </p>

          <h2>
            Complete your session.
          </h2>
        </div>

        <div className="exercise-list">

          {exercises.map(
            (exercise, index) => {
              const completed =
                completedExercises.includes(
                  Number(exercise.id)
                )

              const saving =
                savingExercise ===
                Number(exercise.id)

              return (
                <article
                  className={`exercise-card ${
                    completed
                      ? 'completed'
                      : ''
                  }`}
                  key={exercise.id}
                >

                  <div className="exercise-number">
                    {String(index + 1).padStart(
                      2,
                      '0'
                    )}
                  </div>

                  <div className="exercise-main">

                    <div className="exercise-title-row">

                      <div>
                        <span className="exercise-category">
                          {exercise.category}
                        </span>

                        <h3>
                          {exercise.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        className="exercise-check"
                        onClick={() =>
                          toggleExercise(
                            exercise
                          )
                        }
                        disabled={
                          saving ||
                          completingWorkout
                        }
                        aria-label={`Mark ${
                          exercise.name
                        } as ${
                          completed
                            ? 'incomplete'
                            : 'complete'
                        }`}
                      >
                        {saving
                          ? '...'
                          : completed
                          ? '✓'
                          : ''}
                      </button>

                    </div>

                    <div className="exercise-details">

                      <div>
                        <span>
                          SETS
                        </span>

                        <strong>
                          {exercise.sets}
                        </strong>
                      </div>

                      <div>
                        <span>
                          REPS
                        </span>

                        <strong>
                          {exercise.reps}
                        </strong>
                      </div>

                      <div>
                        <span>
                          REST
                        </span>

                        <strong>
                          {exercise.rest}
                        </strong>
                      </div>

                    </div>

                  </div>

                </article>
              )
            }
          )}

        </div>

      </section>

      {/* WORKOUT COMPLETE */}
      {allExercisesCompleted && (
        <section className="workout-complete">

          <div>

            <span className="complete-icon">
              ✓
            </span>

            <div>

              <p className="eyebrow">
                SESSION COMPLETE
              </p>

              <h2>
                Great work.
              </h2>

              <p>
                You completed all exercises.
                Finish the session to record
                this workout in your progress.
              </p>

              {!workout.completed && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    completeWorkout
                  }
                  disabled={
                    completingWorkout
                  }
                >
                  {completingWorkout
                    ? 'Completing...'
                    : 'Complete Workout'}
                </button>
              )}

              {workout.completed && (
                <p>
                  ✓ This workout has already
                  been recorded as completed.
                </p>
              )}

            </div>

          </div>

        </section>
      )}

    </main>
  )
}

export default Workout