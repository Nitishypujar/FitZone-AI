import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import './Profile.css'

const FITNESS_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const GOALS = [
  { value: 'Fat Loss', label: 'Fat Loss' },
  { value: 'Weight Gain', label: 'Weight Gain' },
  { value: 'Muscle Growth', label: 'Muscle Growth' },
  { value: 'Strength', label: 'Strength' },
  { value: 'Endurance', label: 'Endurance' },
  { value: 'General Fitness', label: 'General Fitness' },
  { value: 'Maintain Fitness', label: 'Maintain Fitness' },
  { value: 'Flexibility', label: 'Flexibility' },
  { value: 'Stamina', label: 'Stamina' },
]

const initialProfile = {
  full_name: '',
  age: '',
  height_cm: '',
  weight_kg: '',
  fitness_level: '',
  primary_goal: '',
  workout_days_per_week: '',
  preferred_workout_duration: '',
}

function normalizeFitnessLevel(value) {
  const normalized = String(value || '').toLowerCase().trim()
  if (!normalized) return ''
  return FITNESS_LEVELS.some((item) => item.value === normalized) ? normalized : ''
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function validateIntegerField(value, label, min, max, optional = true) {
  if (value === '' || value === null || value === undefined) {
    return optional ? '' : `${label} is required.`
  }

  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) {
    return `${label} must be an integer between ${min} and ${max}.`
  }

  return ''
}

function validateNumberField(value, label, min, max, optional = true) {
  if (value === '' || value === null || value === undefined) {
    return optional ? '' : `${label} is required.`
  }

  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max) {
    return `${label} must be between ${min} and ${max}.`
  }

  return ''
}

function getFriendlyName(profile, email) {
  const name = String(profile.full_name || '').trim()
  if (name) return name
  if (email) return email.split('@')[0]
  return 'Fitness Member'
}

function Profile() {
  const [profile, setProfile] = useState(initialProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const token = localStorage.getItem('fitzone_access_token')
  const storedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('fitzone_user') || 'null') || null
    } catch {
      return null
    }
  }, [])
  const queryClient = useQueryClient()

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      setError('')

      if (!token) {
        setError('Please log in again.')
        return
      }

      const data = await api.get('/api/profile')
      const profileData = data.profile || data.data || data

      setProfile({
        full_name: profileData.full_name ?? '',
        age: profileData.age ?? '',
        height_cm: profileData.height_cm ?? '',
        weight_kg: profileData.weight_kg ?? '',
        fitness_level: normalizeFitnessLevel(profileData.fitness_level),
        primary_goal: profileData.primary_goal ?? initialProfile.primary_goal,
        workout_days_per_week: profileData.workout_days_per_week ?? '',
        preferred_workout_duration: profileData.preferred_workout_duration ?? '',
      })
      setFieldErrors({})
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err.message || 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setProfile((previous) => ({ ...previous, [name]: value }))
    setMessage('')
    setError('')
    setFieldErrors((previous) => ({ ...previous, [name]: '' }))
  }

  function validateProfile() {
    const nextErrors = {}
    if (profile.full_name.trim().length > 100) {
      nextErrors.full_name = 'Full name must be 100 characters or fewer.'
    }

    const ageError = validateIntegerField(profile.age, 'Age', 13, 100)
    const heightError = validateNumberField(profile.height_cm, 'Height', 50, 250)
    const weightError = validateNumberField(profile.weight_kg, 'Weight', 20, 300)
    const daysError = validateIntegerField(profile.workout_days_per_week, 'Workout days', 0, 7)
    const durationError = validateIntegerField(profile.preferred_workout_duration, 'Workout duration', 5, 300)

    if (ageError) nextErrors.age = ageError
    if (heightError) nextErrors.height_cm = heightError
    if (weightError) nextErrors.weight_kg = weightError
    if (daysError) nextErrors.workout_days_per_week = daysError
    if (durationError) nextErrors.preferred_workout_duration = durationError

    if (profile.fitness_level && !FITNESS_LEVELS.some((item) => item.value === profile.fitness_level)) {
      nextErrors.fitness_level = 'Select a valid fitness level.'
    }
    if (profile.primary_goal && profile.primary_goal.trim().length > 100) {
      nextErrors.primary_goal = 'Select a valid primary goal.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function saveProfile(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!token) {
      setError('Please log in again.')
      return
    }

    if (!validateProfile()) {
      setError('Please fix the highlighted fields before saving.')
      return
    }

    try {
      setSaving(true)

      const body = {
        full_name: profile.full_name.trim() || null,
        age: numberOrNull(profile.age),
        height_cm: numberOrNull(profile.height_cm),
        weight_kg: numberOrNull(profile.weight_kg),
        fitness_level: normalizeFitnessLevel(profile.fitness_level),
        primary_goal: profile.primary_goal.trim() || null,
        workout_days_per_week: numberOrNull(profile.workout_days_per_week),
        preferred_workout_duration: numberOrNull(profile.preferred_workout_duration),
      }

      const response = await api.put('/api/profile', body)
      const savedProfile = response.profile || body

      setProfile((previous) => ({
        ...previous,
        ...savedProfile,
        fitness_level: normalizeFitnessLevel(savedProfile.fitness_level),
      }))
      setMessage('Profile saved successfully. FitZone AI will use these details for personalization.')
      setFieldErrors({})

      await queryClient.invalidateQueries({ queryKey: ['profile'] })
      await queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['recommendation'] })
      await queryClient.invalidateQueries({ queryKey: ['nutrition'] })
    } catch (err) {
      console.error('Profile save error:', err)
      setError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const email = storedUser?.email || ''
  const displayName = getFriendlyName(profile, email)
  const avatar = displayName.trim().charAt(0).toUpperCase() || 'F'
  const personalizationFields = [
    profile.primary_goal,
    profile.fitness_level,
    profile.workout_days_per_week,
    profile.preferred_workout_duration,
  ].filter(Boolean).length

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-loading-card">
          <div className="profile-loading-orb" />
          <p className="profile-kicker">YOUR PROFILE</p>
          <h1>Loading your fitness profile.</h1>
          <p>Reading the details FitZone uses to personalize your experience.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-copy">
          <p className="profile-kicker">YOUR PROFILE</p>
          <h1>Make FitZone <span>understand you.</span></h1>
          <p>
            Keep your core fitness details current so workout generation, goals,
            nutrition targets and adaptive recommendations stay aligned with you.
          </p>
        </div>

        <div className="profile-identity-card">
          <div className="profile-avatar" aria-hidden="true">{avatar}</div>
          <div className="profile-identity-copy">
            <span>FITNESS MEMBER</span>
            <strong>{displayName}</strong>
            <small>{email || 'Your saved FitZone account'}</small>
          </div>
          <div className="profile-personalization-status">
            <i />
            <span>{personalizationFields}/4 personalization signals set</span>
          </div>
        </div>
      </section>

      {message && <div className="profile-alert profile-alert-success" role="status">{message}</div>}
      {error && <div className="profile-alert profile-alert-error" role="alert">{error}</div>}

      <form className="profile-form" onSubmit={saveProfile} noValidate>
        <section className="profile-card">
          <header className="profile-card-header">
            <div>
              <p className="profile-kicker">01 · PERSONAL INFORMATION</p>
              <h2>The basics</h2>
              <p>These values help FitZone interpret your training context and calculate relevant guidance.</p>
            </div>
          </header>

          <div className="profile-form-grid">
            <div className="profile-field profile-field-wide">
              <label htmlFor="full_name">Full name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength="100"
                aria-invalid={Boolean(fieldErrors.full_name)}
              />
              {fieldErrors.full_name ? <small className="profile-field-error">{fieldErrors.full_name}</small> : <small>Use the name you want FitZone to display.</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min="13"
                max="100"
                step="1"
                inputMode="numeric"
                value={profile.age}
                onChange={handleChange}
                placeholder="21"
                aria-invalid={Boolean(fieldErrors.age)}
              />
              {fieldErrors.age && <small className="profile-field-error">{fieldErrors.age}</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="height_cm">Height <span>cm</span></label>
              <input
                id="height_cm"
                name="height_cm"
                type="number"
                min="50"
                max="250"
                step="0.1"
                inputMode="decimal"
                value={profile.height_cm}
                onChange={handleChange}
                placeholder="175"
                aria-invalid={Boolean(fieldErrors.height_cm)}
              />
              {fieldErrors.height_cm && <small className="profile-field-error">{fieldErrors.height_cm}</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="weight_kg">Weight <span>kg</span></label>
              <input
                id="weight_kg"
                name="weight_kg"
                type="number"
                min="20"
                max="300"
                step="0.1"
                inputMode="decimal"
                value={profile.weight_kg}
                onChange={handleChange}
                placeholder="70"
                aria-invalid={Boolean(fieldErrors.weight_kg)}
              />
              {fieldErrors.weight_kg && <small className="profile-field-error">{fieldErrors.weight_kg}</small>}
            </div>
          </div>
        </section>

        <section className="profile-card">
          <header className="profile-card-header">
            <div>
              <p className="profile-kicker">02 · FITNESS & TRAINING</p>
              <h2>Your training context</h2>
              <p>Tell FitZone how you train today. These choices influence personalized workout selection and recommendations.</p>
            </div>
          </header>

          <div className="profile-form-grid">
            <div className="profile-field">
              <label htmlFor="fitness_level">Fitness level</label>
              <select
                id="fitness_level"
                name="fitness_level"
                value={profile.fitness_level || ''}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.fitness_level)}
              >
                <option value="">Select your fitness level</option>
                {FITNESS_LEVELS.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
              </select>
              {fieldErrors.fitness_level ? <small className="profile-field-error">{fieldErrors.fitness_level}</small> : <small>Optional to save; required before FitZone can generate a personalized workout.</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="primary_goal">Primary goal</label>
              <select
                id="primary_goal"
                name="primary_goal"
                value={profile.primary_goal || ''}
                onChange={handleChange}
                aria-invalid={Boolean(fieldErrors.primary_goal)}
              >
                <option value="">Select your primary goal</option>
                {GOALS.map((goal) => <option value={goal.value} key={goal.value}>{goal.label}</option>)}
              </select>
              {fieldErrors.primary_goal ? <small className="profile-field-error">{fieldErrors.primary_goal}</small> : <small>Optional to save; required before FitZone can generate a personalized workout.</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="workout_days_per_week">Workout days <span>/ week</span></label>
              <input
                id="workout_days_per_week"
                name="workout_days_per_week"
                type="number"
                min="1"
                max="7"
                step="1"
                inputMode="numeric"
                value={profile.workout_days_per_week}
                onChange={handleChange}
                placeholder="4"
                aria-invalid={Boolean(fieldErrors.workout_days_per_week)}
              />
              {fieldErrors.workout_days_per_week ? <small className="profile-field-error">{fieldErrors.workout_days_per_week}</small> : <small>How many days you realistically expect to train.</small>}
            </div>

            <div className="profile-field">
              <label htmlFor="preferred_workout_duration">Preferred duration <span>min</span></label>
              <input
                id="preferred_workout_duration"
                name="preferred_workout_duration"
                type="number"
                min="5"
                max="300"
                step="1"
                inputMode="numeric"
                value={profile.preferred_workout_duration}
                onChange={handleChange}
                placeholder="45"
                aria-invalid={Boolean(fieldErrors.preferred_workout_duration)}
              />
              {fieldErrors.preferred_workout_duration ? <small className="profile-field-error">{fieldErrors.preferred_workout_duration}</small> : <small>FitZone adapts sessions around this preference.</small>}
            </div>
          </div>
        </section>

        <section className="profile-actions-card">
          <div>
            <p className="profile-kicker">PERSONALIZATION ENGINE</p>
            <strong>Keep this profile current.</strong>
            <span>Saved changes refresh your dashboard and adaptive intelligence context.</span>
          </div>
          <button type="submit" className="primary-button profile-save-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
            {!saving && <span aria-hidden="true">→</span>}
          </button>
        </section>
      </form>

      <aside className="profile-note">
        <strong>Why FitZone asks for this</strong>
        <p>
          Your profile is one input to the adaptive system. FitZone combines it with actual
          workout completion, recent activity, goals, nutrition and recommendation outcomes.
          A recommendation is never treated as a completed workout until the workout itself is finished.
        </p>
      </aside>
    </main>
  )
}

export default Profile
