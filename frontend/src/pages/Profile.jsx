import { useEffect, useState } from 'react'
import './Profile.css'
function Profile() {
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    fitness_level: '',
    primary_goal: '',
    workout_days_per_week: '',
    preferred_workout_duration: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        setError('Please sign in to view your profile.')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load profile.')
      }

      setProfile({
        full_name: data.profile.full_name || '',
        age: data.profile.age || '',
        height_cm: data.profile.height_cm || '',
        weight_kg: data.profile.weight_kg || '',
        fitness_level: data.profile.fitness_level || '',
        primary_goal: data.profile.primary_goal || '',
        workout_days_per_week:
          data.profile.workout_days_per_week || '',
        preferred_workout_duration:
          data.profile.preferred_workout_duration || '',
      })
    } catch (error) {
      console.error('Profile loading error:', error)
      setError(error.message || 'Unable to load your profile.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))

    setSuccess('')
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setError('')
    setSuccess('')

    const token = localStorage.getItem('fitzone_access_token')

    if (!token) {
      setError('Please sign in again.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          age: profile.age ? Number(profile.age) : null,
          height_cm: profile.height_cm
            ? Number(profile.height_cm)
            : null,
          weight_kg: profile.weight_kg
            ? Number(profile.weight_kg)
            : null,
          fitness_level: profile.fitness_level,
          primary_goal: profile.primary_goal,
          workout_days_per_week: profile.workout_days_per_week
            ? Number(profile.workout_days_per_week)
            : null,
          preferred_workout_duration:
            profile.preferred_workout_duration
              ? Number(profile.preferred_workout_duration)
              : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to update profile.')
      }

      setProfile({
        full_name: data.profile.full_name || '',
        age: data.profile.age || '',
        height_cm: data.profile.height_cm || '',
        weight_kg: data.profile.weight_kg || '',
        fitness_level: data.profile.fitness_level || '',
        primary_goal: data.profile.primary_goal || '',
        workout_days_per_week:
          data.profile.workout_days_per_week || '',
        preferred_workout_duration:
          data.profile.preferred_workout_duration || '',
      })

      setSuccess('Profile updated successfully.')
    } catch (error) {
      console.error('Profile update error:', error)
      setError(error.message || 'Unable to update your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-section">
          <p>Loading your profile...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-section">
        <div className="page-heading">
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>

            <h1>My Profile</h1>

            <p>
              Keep your fitness information updated so FitZone AI can
              personalize your experience.
            </p>
          </div>
        </div>

        <form className="profile-card" onSubmit={handleSubmit}>
          <div className="profile-card-header">
            <div>
              <h2>Personal information</h2>

              <p>
                Your profile will be used for personalized workouts,
                goals, progress tracking, and AI recommendations.
              </p>
            </div>
          </div>

          <div className="profile-form-grid">
            <label>
              Full name

              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Your full name"
              />
            </label>

            <label>
              Age

              <input
                type="number"
                name="age"
                value={profile.age}
                onChange={handleChange}
                placeholder="e.g. 21"
                min="13"
                max="100"
              />
            </label>

            <label>
              Height (cm)

              <input
                type="number"
                name="height_cm"
                value={profile.height_cm}
                onChange={handleChange}
                placeholder="e.g. 175"
                min="100"
                max="250"
                step="0.1"
              />
            </label>

            <label>
              Weight (kg)

              <input
                type="number"
                name="weight_kg"
                value={profile.weight_kg}
                onChange={handleChange}
                placeholder="e.g. 70"
                min="20"
                max="300"
                step="0.1"
              />
            </label>

            <label>
              Fitness level

              <select
                name="fitness_level"
                value={profile.fitness_level}
                onChange={handleChange}
              >
                <option value="">Select your level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>

            <label>
              Primary goal

              <select
                name="primary_goal"
                value={profile.primary_goal}
                onChange={handleChange}
              >
                <option value="">Select your goal</option>
                <option value="Build Muscle">Build Muscle</option>
                <option value="Lose Weight">Lose Weight</option>
                <option value="Improve Fitness">
                  Improve Fitness
                </option>
                <option value="Increase Strength">
                  Increase Strength
                </option>
                <option value="Improve Endurance">
                  Improve Endurance
                </option>
                <option value="General Wellness">
                  General Wellness
                </option>
              </select>
            </label>

            <label>
              Workout days per week

              <select
                name="workout_days_per_week"
                value={profile.workout_days_per_week}
                onChange={handleChange}
              >
                <option value="">Select days</option>
                <option value="1">1 day</option>
                <option value="2">2 days</option>
                <option value="3">3 days</option>
                <option value="4">4 days</option>
                <option value="5">5 days</option>
                <option value="6">6 days</option>
                <option value="7">7 days</option>
              </select>
            </label>

            <label>
              Preferred workout duration

              <select
                name="preferred_workout_duration"
                value={profile.preferred_workout_duration}
                onChange={handleChange}
              >
                <option value="">Select duration</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </label>
          </div>

          {error && <p className="auth-error">{error}</p>}

          {success && <p className="profile-success">{success}</p>}

          <div className="profile-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        <div className="profile-note">
          <strong>Why this matters</strong>

          <p>
            The information in your profile will eventually power
            FitZone AI's personalized workout plans, progress insights,
            nutrition guidance, and fitness assistant.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Profile