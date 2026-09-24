import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

function Workout() {
  const queryClient = useQueryClient()
  const [workouts, setWorkouts] = useState([])
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [completedExercises, setCompletedExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadWorkouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadWorkouts() {
    try {
      setLoading(true)
      setError('')

      const [data, current] = await Promise.all([
        api.get('/api/workouts'),
        api.get('/api/workouts/current').catch(() => null),
      ])

      const workoutList = Array.isArray(data.workouts) ? data.workouts : []
      setWorkouts(workoutList)

      const exactWorkoutId = current?.workout?.id
      const preferredWorkout =
        workoutList.find((workout) => String(workout.id) === String(exactWorkoutId)) ||
        workoutList.find((workout) => workout.completed !== true && Array.isArray(workout.exercises) && workout.exercises.length > 0) ||
        workoutList.find((workout) => Array.isArray(workout.exercises) && workout.exercises.length > 0) ||
        workoutList[0]

      if (preferredWorkout) {
        setSelectedWorkout(preferredWorkout)
        await loadWorkoutLogs(preferredWorkout.id)
      }
    } catch (error) {
      console.error('Workout loading error:', error)
      setError(
        error.message || 'Unable to load workout.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadWorkoutLogs(workoutId) {
    try {
      const data = await api.get('/api/workout-logs')

      const logs = Array.isArray(data.logs)
        ? data.logs
        : []

      const completed = logs
        .filter(
          (log) =>
            Number(log.workout_id) === Number(workoutId) &&
            log.completed === true
        )
        .map((log) => log.exercise_name)

      setCompletedExercises(completed)
    } catch (error) {
      console.error('Workout logs error:', error)
    }
  }

  async function selectWorkout(workout) {
    setError('')
    setSelectedWorkout(workout)
    await loadWorkoutLogs(workout.id)
  }

  async function toggleExercise(exercise) {
    if (!selectedWorkout) return

    setError('')

    const isCompleted = completedExercises.includes(
      exercise.name
    )

    try {
      if (isCompleted) {
        setCompletedExercises((previous) =>
          previous.filter(
            (name) => name !== exercise.name
          )
        )
        return
      }

      await api.post('/api/workout-logs', {
        workout_id: selectedWorkout.id,
        exercise_name: exercise.name,
        sets: exercise.sets || null,
        repetitions: exercise.repetitions || null,
        weight_kg: null,
        duration_seconds: exercise.duration_seconds || null,
        completed: true,
      })

      setCompletedExercises((previous) => [
        ...previous,
        exercise.name,
      ])

      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation'] })
      queryClient.invalidateQueries({ queryKey: ['progress'] })
      queryClient.invalidateQueries({ queryKey: ['nutrition'] })
    } catch (error) {
      console.error(
        'Exercise completion error:',
        error
      )

      setError(
        error.message || 'Unable to save exercise.'
      )
    }
  }

  async function completeWorkout() {
    if (!selectedWorkout) return

    setError('')

    try {
      const data = await api.put(
        `/api/workouts/${selectedWorkout.id}`,
        { completed: true }
      )

      const updatedWorkout = {
        ...selectedWorkout,
        completed: true,
        completed_at:
          data.workout?.completed_at ||
          new Date().toISOString(),
      }

      setSelectedWorkout(updatedWorkout)

      setWorkouts((previous) =>
        previous.map((workout) =>
          Number(workout.id) ===
          Number(selectedWorkout.id)
            ? updatedWorkout
            : workout
        )
      )

      // The Dashboard (and any other page reading this cache) currently
      // has a stale copy of workouts/recommendation/intelligence data.
      // Invalidate it so the next time the user navigates there, it
      // refetches fresh state instead of showing what it loaded before
      // this workout was completed. This is the direct fix for "old
      // data comes back when I navigate away and come back."
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (error) {
      console.error(
        'Workout completion error:',
        error
      )

      setError(
        error.message ||
          'Unable to complete workout.'
      )
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

  const exercises = Array.isArray(
    selectedWorkout.exercises
  )
    ? selectedWorkout.exercises
    : []

  const completedCount =
    completedExercises.length

  const progress =
    exercises.length > 0
      ? Math.min(
          100,
          Math.round(
            (completedCount / exercises.length) *
              100
          )
        )
      : 0

  const availableWorkouts = workouts.filter(
    (workout) =>
      workout.completed !== true &&
      Array.isArray(workout.exercises) &&
      workout.exercises.length > 0
  )

  return (
    <main className="workout-page">
      <section className="workout-hero">
        <div>
          <p className="eyebrow">MY WORKOUT</p>
          <h1>{selectedWorkout.workout_name}</h1>
          <p className="workout-subtitle">{selectedWorkout.workout_type} · {selectedWorkout.duration_minutes} min · {selectedWorkout.difficulty}</p>
        </div>
        <div className="workout-progress-ring">
          <strong>{progress}%</strong><span>COMPLETE</span>
        </div>
      </section>

      {error && <div className="workout-error">{error}</div>}

      <section className="workout-session-bar">
        <div><span>SESSION PROGRESS</span><strong>{completedCount} / {exercises.length} exercises</strong></div>
        <div className="workout-progress-track"><i style={{ width: `${progress}%` }} /></div>
        <div className="workout-session-note">{selectedWorkout.completed ? 'Workout recorded' : 'Complete each exercise, then finish the session.'}</div>
      </section>

      {availableWorkouts.length > 1 && (
        <section className="workout-switcher">
          <div><p className="eyebrow">AVAILABLE SESSIONS</p><h2>Choose a workout</h2></div>
          <div>{availableWorkouts.map((workout) => (
            <button className={String(selectedWorkout.id) === String(workout.id) ? 'active' : ''} key={workout.id} onClick={() => selectWorkout(workout)}>
              <span>{workout.workout_type}</span><strong>{workout.workout_name}</strong>
            </button>
          ))}</div>
        </section>
      )}

      <section className="workout-exercise-list">
        <div className="section-heading"><p className="eyebrow">EXERCISES</p><h2>Work through your session.</h2></div>
        {exercises.map((exercise, index) => {
          const completed = completedExercises.includes(exercise.name)
          return (
            <article className={`workout-exercise-card ${completed ? 'completed' : ''}`} key={`${exercise.name}-${index}`}>
              <div className="exercise-index">{String(index + 1).padStart(2, '0')}</div>
              <div className="exercise-main"><span className="exercise-type">{exercise.type || 'FITNESS'}</span><h3>{exercise.name}</h3><p>{exercise.sets ? `${exercise.sets} sets` : ''}{exercise.repetitions ? ` × ${exercise.repetitions} reps` : ''}{exercise.duration_seconds ? ` · ${exercise.duration_seconds}s` : ''}{exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ''}</p></div>
              <button className="exercise-complete" onClick={() => toggleExercise(exercise)}>{completed ? 'Completed ✓' : 'Complete'}</button>
            </article>
          )
        })}
      </section>

      <section className="workout-finish">
        <div><p className="eyebrow">SESSION CHECKOUT</p><h2>{selectedWorkout.completed ? 'Session complete.' : 'Finish the workout when all work is done.'}</h2><p>{selectedWorkout.completed ? 'Your completion time is stored and the adaptive learning loop can use this outcome.' : 'Completion is the authoritative outcome signal used by FitZone learning.'}</p></div>
        <div>
          <button className="primary-button" onClick={completeWorkout} disabled={selectedWorkout.completed}>{selectedWorkout.completed ? 'Workout completed ✓' : 'Complete workout'}</button>
          <Link className="secondary-button" to="/progress">View progress</Link>
        </div>
      </section>
    </main>
  )}

export default Workout