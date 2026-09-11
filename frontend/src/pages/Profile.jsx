import { useEffect, useState } from 'react'
import './Profile.css'

const API_BASE = 'http://localhost:5000'

function Profile() {
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    fitness_level: 'Beginner',
    primary_goal: 'Lose Weight',
    workout_days_per_week: '',
    preferred_workout_duration: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem(
    'fitzone_access_token'
  )

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      setError('')

      if (!token) {
        setError('Please log in again.')
        return
      }

      const response = await fetch(
        `${API_BASE}/api/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to load profile'
        )
      }

      const p =
        data.profile ||
        data.data ||
        data

      setProfile({
        full_name: p.full_name ?? '',
        age: p.age ?? '',
        height_cm: p.height_cm ?? '',
        weight_kg: p.weight_kg ?? '',
        fitness_level:
          p.fitness_level ||
          'Beginner',
        primary_goal:
          p.primary_goal ||
          'Lose Weight',
        workout_days_per_week:
          p.workout_days_per_week ?? '',
        preferred_workout_duration:
          p.preferred_workout_duration ?? '',
      })
    } catch (err) {
      console.error(
        'Profile fetch error:',
        err
      )

      setError(
        err.message ||
          'Failed to load profile'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function numberOrNull(value) {
    if (
      value === '' ||
      value === null ||
      value === undefined
    ) {
      return null
    }

    const number = Number(value)

    return Number.isFinite(number)
      ? number
      : null
  }

  async function saveProfile(event) {
    event.preventDefault()

    try {
      setSaving(true)
      setMessage('')
      setError('')

      if (!token) {
        setError('Please log in again.')
        return
      }

      const body = {
        full_name:
          profile.full_name.trim() ||
          null,

        age: numberOrNull(
          profile.age
        ),

        height_cm:
          numberOrNull(
            profile.height_cm
          ),

        weight_kg:
          numberOrNull(
            profile.weight_kg
          ),

        fitness_level:
          profile.fitness_level ||
          null,

        primary_goal:
          profile.primary_goal ||
          null,

        workout_days_per_week:
          numberOrNull(
            profile.workout_days_per_week
          ),

        preferred_workout_duration:
          numberOrNull(
            profile.preferred_workout_duration
          ),
      }

      const response = await fetch(
        `${API_BASE}/api/profile`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify(body),
        }
      )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to save profile'
        )
      }

      setMessage(
        'Profile saved successfully.'
      )

      await fetchProfile()
    } catch (err) {
      console.error(
        'Profile save error:',
        err
      )

      setError(
        err.message ||
          'Failed to save profile'
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p>
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Profile</h1>

          <p>
            Manage your fitness profile
            and personalization data.
          </p>
        </div>
      </div>

      {message && (
        <div className="alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <form
        className="profile-form"
        onSubmit={saveProfile}
      >
        <section className="card">
          <div className="card-header">
            <div>
              <h2>
                Personal Information
              </h2>

              <p>
                Your basic information
                used to personalize
                FitZone.
              </p>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="full_name">
                Full Name
              </label>

              <input
                id="full_name"
                name="full_name"
                type="text"
                value={
                  profile.full_name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="age">
                Age
              </label>

              <input
                id="age"
                name="age"
                type="number"
                min="13"
                max="100"
                value={profile.age}
                onChange={
                  handleChange
                }
                placeholder="Age"
              />
            </div>

            <div className="form-group">
              <label htmlFor="height_cm">
                Height (cm)
              </label>

              <input
                id="height_cm"
                name="height_cm"
                type="number"
                min="50"
                max="250"
                step="0.1"
                value={
                  profile.height_cm
                }
                onChange={
                  handleChange
                }
                placeholder="Height"
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight_kg">
                Weight (kg)
              </label>

              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min="20"
                max="300"
                step="0.1"
                value={
                  profile.weight_kg
                }
                onChange={
                  handleChange
                }
                placeholder="Weight"
              />
            </div>

            <div className="form-group">
              <label htmlFor="fitness_level">
                Fitness Level
              </label>

              <select
                id="fitness_level"
                name="fitness_level"
                value={
                  profile.fitness_level
                }
                onChange={
                  handleChange
                }
              >
                <option value="Beginner">
                  Beginner
                </option>

                <option value="Intermediate">
                  Intermediate
                </option>

                <option value="Advanced">
                  Advanced
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="primary_goal">
                Primary Goal
              </label>

              <select
                id="primary_goal"
                name="primary_goal"
                value={
                  profile.primary_goal
                }
                onChange={
                  handleChange
                }
              >
                <option value="Lose Weight">
                  Lose Weight
                </option>

                <option value="Build Muscle">
                  Build Muscle
                </option>

                <option value="Improve Fitness">
                  Improve Fitness
                </option>

                <option value="Maintain Weight">
                  Maintain Weight
                </option>

                <option value="Improve Endurance">
                  Improve Endurance
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="workout_days_per_week">
                Workout Days / Week
              </label>

              <input
                id="workout_days_per_week"
                name="workout_days_per_week"
                type="number"
                min="0"
                max="7"
                value={
                  profile.workout_days_per_week
                }
                onChange={
                  handleChange
                }
                placeholder="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferred_workout_duration">
                Preferred Workout
                Duration (min)
              </label>

              <input
                id="preferred_workout_duration"
                name="preferred_workout_duration"
                type="number"
                min="5"
                max="300"
                value={
                  profile.preferred_workout_duration
                }
                onChange={
                  handleChange
                }
                placeholder="30"
              />
            </div>
          </div>
        </section>

        <div className="profile-actions">
          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile