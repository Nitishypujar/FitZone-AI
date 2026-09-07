import { useEffect, useState } from 'react'

function Workout() {
  const [workouts, setWorkouts] = useState([])
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('fitzone_access_token')

  useEffect(() => {
    loadWorkouts()
  }, [])

  async function loadWorkouts() {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(
        'http://localhost:5000/api/workouts',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load workouts.')
      }

      const workoutList = data.workouts || []

      setWorkouts(workoutList)

      if (workoutList.length > 0) {
        setSelectedWorkout(workoutList[0])
        await loadWorkoutLogs(workoutList[0].id)
      }
    } catch (error) {
      console.error('Workout loading error:', error)
      setError(error.message || 'Unable to load workout.')
    } finally {
      setLoading(false)
    }
  }

  async function loadWorkoutLogs(workoutId) {
    try {
      const response = await fetch(
        'http://localhost:5000/api/workout-logs',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load workout logs.')
      }

      const logs = data.logs || []

      const completed = logs
        .filter(
          (log) =>
            log.workout_id === workoutId &&
            log.completed === true
        )
        .map((log) => log.exercise_name)

      setCompletedExercises(completed)
    } catch (error) {
      console.error('Workout logs error:', error)
    }
  }

  async function selectWorkout(workout) {
    setSelectedWorkout(workout)
    await loadWorkoutLogs(workout.id)
  }

  async function toggleExercise(exercise) {
    if (!selectedWorkout) return

    const isCompleted = completedExercises.includes(exercise.name)

    try {
      if (isCompleted) {
        setCompletedExercises((previous) =>
          previous.filter((name) => name !== exercise.name)
        )
        return
      }

      const response = await fetch(
        'http://localhost:5000/api/workout-logs',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workout_id: selectedWorkout.id,
            exercise_name: exercise.name,
            sets: exercise.sets || null,
            repetitions: exercise.repetitions || null,
            duration_seconds: exercise.duration_seconds || null,
            completed: true,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save exercise.')
      }

      setCompletedExercises((previous) => [
        ...previous,
        exercise.name,
      ])
    } catch (error) {
      console.error('Exercise completion error:', error)
      setError(error.message || 'Unable to save exercise.')
    }
  }

  async function completeWorkout() {
    if (!selectedWorkout) return

    try {
      const response = await fetch(
        `http://localhost:5000/api/workouts/${selectedWorkout.id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            completed: true,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to complete workout.'
        )
      }

      const updatedWorkout = {
        ...selectedWorkout,
        completed: true,
      }

      setSelectedWorkout(updatedWorkout)

      setWorkouts((previous) =>
        previous.map((workout) =>
          workout.id === selectedWorkout.id
            ? updatedWorkout
            : workout
        )
      )
    } catch (error) {
      console.error('Workout completion error:', error)
      setError(error.message || 'Unable to complete workout.')
    }
  }

  if (loading) {
    return (
      <div className="page">
        <h1>My Workout</h1>
        <p>Loading your workouts...</p>
      </div>
    )
  }

  if (error && workouts.length === 0) {
    return (
      <div className="page">
        <h1>My Workout</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (!selectedWorkout) {
    return (
      <div className="page">
        <h1>My Workout</h1>
        <p>No workouts found.</p>
      </div>
    )
  }

  const exercises = selectedWorkout.exercises || []

  const completedCount = completedExercises.length

  const progress =
    exercises.length > 0
      ? Math.round((completedCount / exercises.length) * 100)
      : 0

  return (
    <div className="page">
      <h1>My Workout</h1>

      {error && <p>{error}</p>}

      {workouts.length > 1 && (
        <section>
          <h2>Your Workouts</h2>

          {workouts.map((workout) => (
            <button
              key={workout.id}
              onClick={() => selectWorkout(workout)}
            >
              {workout.workout_name}
            </button>
          ))}
        </section>
      )}

      <section>
        <h2>{selectedWorkout.workout_name}</h2>

        <p>
          {selectedWorkout.workout_type} ·{' '}
          {selectedWorkout.duration_minutes} min ·{' '}
          {selectedWorkout.difficulty}
        </p>

        <h3>Session Progress</h3>

        <p>
          {completedCount} / {exercises.length} exercises
        </p>

        <p>{progress}%</p>
      </section>

      <section>
        <h2>Exercises</h2>

        {exercises.length === 0 ? (
          <p>
            This workout does not have exercises configured yet.
          </p>
        ) : (
          exercises.map((exercise, index) => {
            const completed = completedExercises.includes(
              exercise.name
            )

            return (
              <div key={`${exercise.name}-${index}`}>
                <h3>
                  {index + 1}. {exercise.name}
                </h3>

                <p>
                  {exercise.sets} sets
                  {exercise.repetitions
                    ? ` × ${exercise.repetitions} reps`
                    : ''}
                  {exercise.duration_seconds
                    ? ` × ${exercise.duration_seconds} sec`
                    : ''}
                  {exercise.rest_seconds
                    ? ` · ${exercise.rest_seconds}s rest`
                    : ''}
                </p>

                <button
                  onClick={() => toggleExercise(exercise)}
                >
                  {completed ? 'Completed ✓' : 'Complete Exercise'}
                </button>
              </div>
            )
          })
        )}
      </section>

      {exercises.length > 0 && (
        <section>
          <button
            onClick={completeWorkout}
            disabled={selectedWorkout.completed}
          >
            {selectedWorkout.completed
              ? 'Workout completed ✓'
              : 'Complete Workout'}
          </button>

          {selectedWorkout.completed && (
            <p>
              Great work. Your completed workout has been
              recorded.
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default Workout