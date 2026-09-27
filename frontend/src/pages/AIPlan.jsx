import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useFitnessBrain, getFitnessTimeZone } from '../hooks/useFitnessBrain'

function AIPlan() {
  const queryClient = useQueryClient()
  const [workout, setWorkout] = useState(null)
  const [generationMeta, setGenerationMeta] = useState(null)
  const timeZone = getFitnessTimeZone()
  const brainQuery = useFitnessBrain({ timeZone })

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/api/profile'),
  })

  const intelligenceQuery = brainQuery

  const generateMutation = useMutation({
    mutationFn: () => {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      return api.post(`/api/workouts/generate?timezone=${encodeURIComponent(timeZone)}`, {})
    },
    onSuccess: (data) => {
      setWorkout(data?.workout || null)
      setGenerationMeta(data || null)
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
    queryClient.invalidateQueries({ queryKey: ['fitness-brain'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation'] })
    },
  })

  if (profileQuery.isLoading) {
    return <div className="page"><h1>AI Plan</h1><p>Loading your profile...</p></div>
  }

  const profile = profileQuery.data?.profile
  if (!profile) {
    return <div className="page"><h1>AI Plan</h1><p>{profileQuery.error?.message || 'Profile not found.'}</p></div>
  }

  const intelligence = intelligenceQuery.data?.intelligence || intelligenceQuery.data
  const effectiveProfile = intelligence?.user_state?.profile || profile
  const nextAction = intelligence?.next_best_action
  const requiredProfileFields = [
    ['primary_goal', effectiveProfile.primary_goal],
    ['fitness_level', effectiveProfile.fitness_level],
    ['workout_days_per_week', effectiveProfile.workout_days_per_week],
    ['preferred_workout_duration', effectiveProfile.preferred_workout_duration],
  ]
  const missingProfileFields = requiredProfileFields.filter(([, value]) => value === null || value === undefined || value === '').map(([field]) => field)
  const profileReady = missingProfileFields.length === 0
  const error = generateMutation.error?.message || profileQuery.error?.message

  return (
    <main className="ai-plan-page">
      <section className="ai-plan-hero">
        <div>
          <p className="eyebrow">ADAPTIVE WORKOUT ENGINE</p>
          <h1>Your plan, <span>built around you.</span></h1>
          <p>FitZone combines your effective goal, fitness level, weekly progress, readiness, training load, and learned outcomes before generating your next session.</p>
          {error && <div className="ai-plan-error">{error}</div>}
          {!profileReady && (
            <div className="ai-plan-profile-warning" role="status">
              <strong>Complete your training profile first.</strong>
              <span>FitZone will not invent missing preferences. Set your goal, fitness level, training days and session duration in Profile before generating an adaptive workout.</span>
              <Link className="ai-plan-profile-link" to="/profile">Complete Profile →</Link>
            </div>
          )}
          <div className="ai-plan-actions">
            <button className="primary-button" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending || !profileReady}>
              {generateMutation.isPending ? 'Building your session…' : profileReady ? 'Generate my workout' : 'Profile required'}
            </button>
            <Link className="secondary-button" to="/workout">Open My Workout</Link>
          </div>
        </div>
        <div className="ai-plan-intelligence-card">
          <span className="ai-plan-card-label">NEXT BEST ACTION</span>
          <strong>{nextAction?.action || 'Synchronizing'}</strong>
          <p>{nextAction?.reason || 'FitZone is reading your latest state.'}</p>
          <div className="ai-plan-metrics">
            <div><span>GOAL</span><b>{effectiveProfile.primary_goal || 'Not set'}</b></div>
            <div><span>LEVEL</span><b>{effectiveProfile.fitness_level || 'Not set'}</b></div>
            <div><span>READINESS</span><b>{nextAction?.readiness?.score ?? '—'}</b></div>
            <div><span>MODEL</span><b>{nextAction?.ml_source || 'unavailable'}</b></div>
          </div>
        </div>
      </section>

      <section className="ai-plan-profile-grid">
        <article><span>PRIMARY GOAL</span><strong>{effectiveProfile.primary_goal || 'Not set'}</strong><p>Canonical goal used by the intelligence layer.</p></article>
        <article><span>TRAINING FREQUENCY</span><strong>{effectiveProfile.workout_days_per_week != null ? `${effectiveProfile.workout_days_per_week} days` : 'Not set'}</strong><p>Targeted weekly training frequency.</p></article>
        <article><span>SESSION WINDOW</span><strong>{effectiveProfile.preferred_workout_duration != null ? `${effectiveProfile.preferred_workout_duration} min` : 'Not set'}</strong><p>Preferred duration used for generation.</p></article>
        <article><span>FITNESS LEVEL</span><strong>{effectiveProfile.fitness_level || 'Not set'}</strong><p>Used to scale prescriptions.</p></article>
      </section>

      {workout && (
        <section className="ai-plan-generated">
          <div className="ai-plan-generated-header">
            <div><p className="eyebrow">GENERATED SESSION</p><h2>{workout.workout_name}</h2><p>{workout.workout_type} · {workout.duration_minutes} min · {workout.difficulty}</p></div>
            <div className="ai-plan-event"><span>RECOMMENDATION LINK</span><strong>{generationMeta?.event_id ? 'Exact event linked' : 'Legacy / pending link'}</strong></div>
          </div>
          <div className="ai-plan-exercises">
            {(workout.exercises || []).map((exercise, index) => (
              <article key={`${exercise.name}-${index}`}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div><strong>{exercise.name}</strong><p>{exercise.sets ? `${exercise.sets} sets` : ''}{exercise.repetitions ? ` × ${exercise.repetitions} reps` : ''}{exercise.duration_seconds ? ` · ${exercise.duration_seconds}s` : ''}{exercise.rest_seconds ? ` · ${exercise.rest_seconds}s rest` : ''}</p></div>
                <em>{exercise.target || 'adaptive'}</em>
              </article>
            ))}
          </div>
          <div className="ai-plan-generated-footer">
            <span>Generated workout ID: <strong>{workout.id}</strong></span>
            <Link className="primary-button" to="/workout">Start this workout →</Link>
          </div>
        </section>
      )}
    </main>
  )
}

export default AIPlan
