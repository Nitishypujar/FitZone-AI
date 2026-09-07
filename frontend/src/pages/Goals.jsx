import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000'

const goalOptions = [
  {
    id: 'strength',
    title: 'Build Strength',
    description:
      'Increase your strength and improve overall performance.',
  },
  {
    id: 'muscle',
    title: 'Build Muscle',
    description:
      'Focus on muscle growth with structured resistance training.',
  },
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    description:
      'Build an active routine focused on sustainable progress.',
  },
  {
    id: 'fitness',
    title: 'Improve Fitness',
    description:
      'Improve endurance, mobility, strength, and overall fitness.',
  },
]

function Goals() {
  const [selectedGoal, setSelectedGoal] = useState('strength')
  const [weeklyTarget, setWeeklyTarget] = useState(5)
  const [activeMinutes, setActiveMinutes] = useState(200)

  const [goalId, setGoalId] = useState(null)

  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        setError('Please log in to access your goals.')
        return
      }

      const response = await fetch(`${API_URL}/api/goals`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to fetch goals.'
        )
      }

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

      const token = localStorage.getItem(
        'fitzone_access_token'
      )

      if (!token) {
        setError(
          'Please log in to save your goals.'
        )
        return
      }

      const goalPayload = {
        goal_type: selectedGoal,
        weekly_workout_target: weeklyTarget,
        weekly_active_minute_target: activeMinutes,
        completed: false,
      }

      let response

      if (goalId) {
        response = await fetch(
          `${API_URL}/api/goals/${goalId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(goalPayload),
          }
        )
      } else {
        response = await fetch(
          `${API_URL}/api/goals`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(goalPayload),
          }
        )
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Unable to save goals.'
        )
      }

      if (data.goal?.id) {
        setGoalId(data.goal.id)
      }

      setSaved(true)
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

  const goalCompletion = Math.min(
    Math.round(
      ((weeklyTarget / 7) +
        (activeMinutes / 380)) *
        50
    ),
    100
  )

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
                ? 'Saving...'
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