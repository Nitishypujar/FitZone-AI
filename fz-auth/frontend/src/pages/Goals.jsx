import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const goalOptions = [
  { id: 'fat-loss', title: 'Fat Loss', description: 'Build a sustainable training routine focused on energy expenditure and consistency.' },
  { id: 'weight-gain', title: 'Weight Gain', description: 'Support healthy weight gain with resistance-focused training and consistent activity.' },
  { id: 'muscle-growth', title: 'Muscle Growth', description: 'Prioritize structured resistance training and gradual progression.' },
  { id: 'strength', title: 'Strength', description: 'Develop strength through structured, progressive training.' },
  { id: 'endurance', title: 'Endurance', description: 'Build sustained cardiovascular capacity and training consistency.' },
  { id: 'general-fitness', title: 'General Fitness', description: 'Balance strength, conditioning, mobility, and everyday fitness.' },
  { id: 'maintain-fitness', title: 'Maintain Fitness', description: 'Maintain your current fitness level with a sustainable weekly routine.' },
  { id: 'flexibility', title: 'Flexibility', description: 'Improve mobility, range of motion, and movement quality.' },
  { id: 'stamina', title: 'Stamina', description: 'Improve your ability to sustain effort across longer sessions.' },
]

function Goals() {
  const [selectedGoal, setSelectedGoal] = useState('general-fitness')
  const [weeklyTarget, setWeeklyTarget] = useState(5)
  const [activeMinutes, setActiveMinutes] = useState(200)

  const [goalId, setGoalId] = useState(null)

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      setLoading(true)
      setError('')

      const data = await api.get('/api/goals')

      if (data.goals && data.goals.length > 0) {
        const goal = data.goals[0]

        setGoalId(goal.id)

        if (goal.goal_type) {
          setSelectedGoal(goal.goal_type)
        }

        if (
          goal.weekly_workout_target !== null &&
          goal.weekly_workout_target !== undefined
        ) {
          setWeeklyTarget(
            Number(goal.weekly_workout_target)
          )
        }

        if (
          goal.weekly_active_minute_target !== null &&
          goal.weekly_active_minute_target !== undefined
        ) {
          setActiveMinutes(
            Number(goal.weekly_active_minute_target)
          )
        }
      }
    } catch (err) {
      console.error('Goals loading error:', err)

      setError(
        err.message || 'Unable to load goals.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setSaved(false)
      setError('')

      const goalPayload = {
        goal_type: selectedGoal,
        weekly_workout_target: weeklyTarget,
        weekly_active_minute_target: activeMinutes,
        completed: false,
      }

      const data = goalId
        ? await api.put(`/api/goals/${goalId}`, goalPayload)
        : await api.post('/api/goals', goalPayload)

      if (data.goal?.id) {
        setGoalId(data.goal.id)
      }

      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['recommendation'] })
    } catch (err) {
      console.error('Goals save error:', err)

      setError(
        err.message || 'Unable to save goals.'
      )
    } finally {
      setSaving(false)
    }
  }

  function selectGoal(id) {
    setSelectedGoal(id)
    setSaved(false)
    setError('')
  }

  if (loading) {
    return (
      <main className="goals-page">
        <section className="goals-header">
          <div>
            <p className="eyebrow">YOUR GOALS</p>

            <h1>
              Give your training
              <br />
              <span>a direction.</span>
            </h1>

            <p>Loading your goals...</p>
          </div>
        </section>
      </main>
    )
  }

  const selectedGoalData =
    goalOptions.find(
      (goal) => goal.id === selectedGoal
    )

  const goalCompletion = Math.min(100, Math.round(((weeklyTarget / 7) * 50) + ((activeMinutes / 500) * 50)))

  return (
    <main className="goals-page">
      <section className="goals-header">
        <div>
          <p className="eyebrow">YOUR GOALS</p>

          <h1>
            Give your training
            <br />
            <span>a direction.</span>
          </h1>

          <p>
            Define what you want to achieve. Your goals
            will become one of the key inputs used by the
            FitZone AI personalization engine.
          </p>
        </div>

        <div className="goal-score-card">
          <span>GOAL COMPLETION</span>

          <strong>{goalCompletion}%</strong>

          <div className="goal-score-track">
            <div
              style={{
                width: `${goalCompletion}%`,
              }}
            ></div>
          </div>

          <p>
            {goalCompletion >= 75
              ? 'You are making strong progress.'
              : 'Keep building your consistency.'}
          </p>
        </div>
      </section>

      {error && (
        <div className="auth-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSave}>
        <section className="goal-selection-section">
          <div className="section-heading">
            <p className="eyebrow">
              PRIMARY OBJECTIVE
            </p>

            <h2>
              What are you working toward?
            </h2>
          </div>

          <div className="goal-options">
            {goalOptions.map((goal, index) => (
              <button
                type="button"
                key={goal.id}
                className={`goal-option ${
                  selectedGoal === goal.id
                    ? 'selected'
                    : ''
                }`}
                onClick={() =>
                  selectGoal(goal.id)
                }
              >
                <div className="goal-option-top">
                  <span className="goal-option-radio">
                    {selectedGoal === goal.id
                      ? '✓'
                      : ''}
                  </span>

                  <span className="goal-option-number">
                    {String(index + 1).padStart(
                      2,
                      '0'
                    )}
                  </span>
                </div>

                <h3>{goal.title}</h3>

                <p>{goal.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="goal-targets-section">
          <div className="section-heading">
            <p className="eyebrow">
              WEEKLY TARGETS
            </p>

            <h2>
              Set measurable targets.
            </h2>
          </div>

          <div className="goal-target-grid">
            <article className="goal-target-card">
              <div className="goal-target-heading">
                <div>
                  <span>
                    WORKOUT FREQUENCY
                  </span>

                  <h3>
                    {weeklyTarget} workouts
                  </h3>
                </div>

                <strong>WEEK</strong>
              </div>

              <input
                type="range"
                min="2"
                max="7"
                value={weeklyTarget}
                onChange={(event) => {
                  setWeeklyTarget(
                    Number(event.target.value)
                  )
                  setSaved(false)
                }}
              />

              <div className="range-labels">
                <span>2</span>
                <span>7</span>
              </div>

              <p>
                Number of workouts you want to
                complete each week.
              </p>
            </article>

            <article className="goal-target-card">
              <div className="goal-target-heading">
                <div>
                  <span>
                    ACTIVE MINUTES
                  </span>

                  <h3>
                    {activeMinutes} minutes
                  </h3>
                </div>

                <strong>WEEK</strong>
              </div>

              <input
                type="range"
                min="60"
                max="500"
                step="20"
                value={activeMinutes}
                onChange={(event) => {
                  setActiveMinutes(
                    Number(event.target.value)
                  )
                  setSaved(false)
                }}
              />

              <div className="range-labels">
                <span>60</span>
                <span>500</span>
              </div>

              <p>
                Your desired amount of active training
                time each week.
              </p>
            </article>
          </div>
        </section>

        <section className="goal-summary-section">
          <div className="goal-summary">
            <div>
              <p className="eyebrow">
                CURRENT GOAL PROFILE
              </p>

              <h2>
                {selectedGoalData?.title}
              </h2>
            </div>

            <div className="goal-summary-values">
              <div>
                <span>WORKOUTS</span>

                <strong>
                  {weeklyTarget}/week
                </strong>
              </div>

              <div>
                <span>ACTIVE TIME</span>

                <strong>
                  {activeMinutes} min
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? 'Saving…'
                : saved
                  ? 'Goals Saved ✓'
                  : 'Save Goals'}
            </button>
          </div>

          {saved && (
            <div className="goals-saved-message">
              <span>✓</span>

              <p>
                Your goals have been successfully
                saved to your FitZone AI account.
              </p>
            </div>
          )}
        </section>
      </form>
    </main>
  )
}

export default Goals