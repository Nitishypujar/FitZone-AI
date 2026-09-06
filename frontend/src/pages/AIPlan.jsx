import { useState } from 'react'

const initialProfile = {
  goal: 'Build strength',
  experience: 'Beginner',
  days: '4 days / week',
  duration: '45 minutes',
}

const plans = {
  'Build strength': [
    ['MON', 'Upper Body Strength', '45 min'],
    ['TUE', 'Lower Body Strength', '45 min'],
    ['THU', 'Full Body Strength', '50 min'],
    ['SAT', 'Core & Conditioning', '35 min'],
  ],
  'Lose weight': [
    ['MON', 'Full Body Conditioning', '40 min'],
    ['TUE', 'Cardio & Core', '35 min'],
    ['THU', 'Strength Circuit', '45 min'],
    ['SAT', 'Cardio Conditioning', '40 min'],
  ],
  'Build muscle': [
    ['MON', 'Chest & Triceps', '50 min'],
    ['TUE', 'Back & Biceps', '50 min'],
    ['THU', 'Legs & Shoulders', '55 min'],
    ['SAT', 'Upper Body Volume', '45 min'],
  ],
  'Improve fitness': [
    ['MON', 'Full Body Fitness', '40 min'],
    ['TUE', 'Cardio Conditioning', '35 min'],
    ['THU', 'Strength & Mobility', '45 min'],
    ['SAT', 'Endurance Session', '40 min'],
  ],
}

function AIPlan() {
  const [profile, setProfile] = useState(initialProfile)
  const [generated, setGenerated] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))

    setGenerated(false)
  }

  function generatePlan(event) {
    event.preventDefault()
    setGenerated(true)
  }

  const selectedPlan = plans[profile.goal] || plans['Build strength']

  return (
    <main className="ai-plan-page">
      <section className="ai-plan-header">
        <div>
          <p className="eyebrow">FITZONE AI</p>

          <h1>
            Your plan,
            <br />
            <span>built around you.</span>
          </h1>

          <p>
            Tell FitZone AI a little about your goals and training preferences.
            Your profile will eventually power an adaptive workout planning
            system.
          </p>
        </div>

        <div className="ai-plan-badge">
          <span className="ai-badge">AI</span>
          <strong>PERSONALIZATION ENGINE</strong>
          <p>Prototype mode</p>
        </div>
      </section>

      <section className="ai-plan-grid">
        <article className="ai-profile-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">YOUR PROFILE</p>
              <h2>Training preferences</h2>
            </div>
          </div>

          <form className="ai-profile-form" onSubmit={generatePlan}>
            <label>
              Primary goal

              <select
                name="goal"
                value={profile.goal}
                onChange={handleChange}
              >
                <option>Build strength</option>
                <option>Lose weight</option>
                <option>Build muscle</option>
                <option>Improve fitness</option>
              </select>
            </label>

            <label>
              Experience level

              <select
                name="experience"
                value={profile.experience}
                onChange={handleChange}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label>
              Training frequency

              <select
                name="days"
                value={profile.days}
                onChange={handleChange}
              >
                <option>3 days / week</option>
                <option>4 days / week</option>
                <option>5 days / week</option>
                <option>6 days / week</option>
              </select>
            </label>

            <label>
              Session duration

              <select
                name="duration"
                value={profile.duration}
                onChange={handleChange}
              >
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
                <option>75 minutes</option>
              </select>
            </label>

            <button type="submit" className="primary-button">
              Generate My Plan
            </button>
          </form>
        </article>

        <article className="ai-plan-result">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">GENERATED PLAN</p>
              <h2>{profile.goal}</h2>
            </div>

            <span className="ai-badge">AI</span>
          </div>

          <div className="plan-summary">
            <div>
              <span>LEVEL</span>
              <strong>{profile.experience}</strong>
            </div>

            <div>
              <span>FREQUENCY</span>
              <strong>{profile.days}</strong>
            </div>

            <div>
              <span>SESSION</span>
              <strong>{profile.duration}</strong>
            </div>
          </div>

          <div className="generated-plan-list">
            {selectedPlan.map(([day, workout, duration]) => (
              <div className="generated-plan-item" key={day}>
                <span>{day}</span>

                <div>
                  <strong>{workout}</strong>
                  <small>{duration}</small>
                </div>

                <span className="plan-arrow">→</span>
              </div>
            ))}
          </div>

          {generated && (
            <div className="plan-generated-message">
              <span>✓</span>
              <p>
                Your prototype plan has been generated from the preferences
                above.
              </p>
            </div>
          )}

          <p className="prototype-note">
            Prototype planning logic. In a later phase, this interface will
            send your profile to the FitZone AI backend and receive a
            dynamically generated plan.
          </p>
        </article>
      </section>
    </main>
  )
}

export default AIPlan