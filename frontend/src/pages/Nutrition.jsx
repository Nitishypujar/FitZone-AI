import { useEffect, useMemo, useState } from 'react'

const API_URL = 'http://localhost:5000'

const emptyForm = {
  meal_type: 'BREAKFAST',
  meal_name: '',
  calories: '',
  protein_g: '',
  carbohydrates_g: '',
  fats_g: '',
}

const mealTypes = ['BREAKFAST', 'LUNCH', 'SNACK', 'DINNER']

function Nutrition() {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const token = localStorage.getItem('fitzone_access_token')

  const fetchMeals = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${API_URL}/api/nutrition`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to load nutrition data')
      }

      setMeals(Array.isArray(data.nutrition) ? data.nutrition : [])
    } catch (err) {
      setError(err.message || 'Unable to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeals()
  }, [])

  const todayMeals = useMemo(() => {
    const today = new Date().toDateString()

    return meals.filter((meal) => {
      if (!meal.logged_at) return false
      return new Date(meal.logged_at).toDateString() === today
    })
  }, [meals])

  const totals = useMemo(() => {
    return todayMeals.reduce(
      (total, meal) => ({
        calories: total.calories + Number(meal.calories || 0),
        protein: total.protein + Number(meal.protein_g || 0),
        carbs: total.carbs + Number(meal.carbohydrates_g || 0),
        fats: total.fats + Number(meal.fats_g || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }
    )
  }, [todayMeals])

  const calorieGoal = 2000
  const caloriePercentage = Math.min(
    Math.round((totals.calories / calorieGoal) * 100),
    100
  )

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const openAddForm = () => {
    setEditingMeal(null)
    setForm(emptyForm)
    setShowForm(true)
    setError('')
  }

  const openEditForm = (meal) => {
    setEditingMeal(meal)

    setForm({
      meal_type: meal.meal_type || 'BREAKFAST',
      meal_name: meal.meal_name || '',
      calories: meal.calories ?? '',
      protein_g: meal.protein_g ?? '',
      carbohydrates_g: meal.carbohydrates_g ?? '',
      fats_g: meal.fats_g ?? '',
    })

    setShowForm(true)
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingMeal(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.meal_name.trim()) {
      setError('Meal name is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        meal_type: form.meal_type,
        meal_name: form.meal_name.trim(),
        calories: Number(form.calories) || 0,
        protein_g: Number(form.protein_g) || 0,
        carbohydrates_g: Number(form.carbohydrates_g) || 0,
        fats_g: Number(form.fats_g) || 0,
      }

      const url = editingMeal
        ? `${API_URL}/api/nutrition/${editingMeal.id}`
        : `${API_URL}/api/nutrition`

      const method = editingMeal ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save meal')
      }

      closeForm()
      await fetchMeals()
    } catch (err) {
      setError(err.message || 'Unable to save meal')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (meal) => {
    const confirmed = window.confirm(
      `Delete "${meal.meal_name}" from your nutrition log?`
    )

    if (!confirmed) return

    try {
      setError('')

      const response = await fetch(`${API_URL}/api/nutrition/${meal.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete meal')
      }

      setMeals((previous) =>
        previous.filter((item) => item.id !== meal.id)
      )
    } catch (err) {
      setError(err.message || 'Unable to delete meal')
    }
  }

  const formatMealType = (type) => {
    if (!type) return 'MEAL'

    return type.charAt(0) + type.slice(1).toLowerCase()
  }

  return (
    <main className="dashboard-page nutrition-page">
      <section className="page-header">
        <div>
          <p className="eyebrow">NUTRITION</p>
          <h1>Fuel Your Progress</h1>
          <p>
            Track your meals and understand your daily nutrition at a glance.
          </p>
        </div>

        <button className="primary-button" onClick={openAddForm}>
          + Add Meal
        </button>
      </section>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="nutrition-summary-grid">
        <div className="nutrition-card main-calorie-card">
          <div className="nutrition-card-header">
            <div>
              <span className="card-label">DAILY CALORIES</span>
              <h2>
                {totals.calories}
                <span> / {calorieGoal} kcal</span>
              </h2>
            </div>

            <div className="nutrition-icon">🔥</div>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${caloriePercentage}%` }}
            />
          </div>

          <p className="progress-text">
            {Math.max(calorieGoal - totals.calories, 0)} kcal remaining
          </p>
        </div>

        <div className="nutrition-card">
          <span className="card-label">PROTEIN</span>
          <h2>{Math.round(totals.protein)}g</h2>
          <p>Today's intake</p>
        </div>

        <div className="nutrition-card">
          <span className="card-label">CARBS</span>
          <h2>{Math.round(totals.carbs)}g</h2>
          <p>Today's intake</p>
        </div>

        <div className="nutrition-card">
          <span className="card-label">FATS</span>
          <h2>{Math.round(totals.fats)}g</h2>
          <p>Today's intake</p>
        </div>
      </section>

      <section className="nutrition-section">
        <div className="section-heading">
          <div>
            <span className="card-label">TODAY</span>
            <h2>Meal Log</h2>
          </div>

          <span className="meal-count">
            {todayMeals.length} {todayMeals.length === 1 ? 'meal' : 'meals'}
          </span>
        </div>

        {loading ? (
          <div className="empty-state">
            <h3>Loading nutrition data...</h3>
            <p>Please wait while your meal history is loaded.</p>
          </div>
        ) : todayMeals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🍽️</div>
            <h3>No meals logged today</h3>
            <p>
              Start tracking your nutrition by adding your first meal.
            </p>

            <button className="primary-button" onClick={openAddForm}>
              + Log Your First Meal
            </button>
          </div>
        ) : (
          <div className="meal-list">
            {todayMeals.map((meal) => (
              <article className="meal-card" key={meal.id}>
                <div className="meal-card-left">
                  <div className="meal-type-badge">
                    {formatMealType(meal.meal_type)}
                  </div>

                  <div>
                    <h3>{meal.meal_name}</h3>

                    <div className="meal-macros">
                      <span>{Number(meal.calories || 0)} kcal</span>
                      <span>
                        P {Number(meal.protein_g || 0)}g
                      </span>
                      <span>
                        C {Number(meal.carbohydrates_g || 0)}g
                      </span>
                      <span>
                        F {Number(meal.fats_g || 0)}g
                      </span>
                    </div>
                  </div>
                </div>

                <div className="meal-actions">
                  <button
                    className="secondary-button"
                    onClick={() => openEditForm(meal)}
                  >
                    Edit
                  </button>

                  <button
                    className="danger-button"
                    onClick={() => handleDelete(meal)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nutrition-insight">
        <div className="insight-icon">✨</div>

        <div>
          <span className="card-label">FITZONE AI INSIGHT</span>

          {todayMeals.length === 0 ? (
            <p>
              Start logging your meals and FitZone AI will use your nutrition
              history to generate personalized insights later.
            </p>
          ) : totals.calories < calorieGoal * 0.5 ? (
            <p>
              You've logged {todayMeals.length} meals so far. Keep tracking
              your meals throughout the day for a clearer picture of your
              nutrition.
            </p>
          ) : (
            <p>
              You've logged {Math.round(totals.calories)} kcal today across{' '}
              {todayMeals.length} {todayMeals.length === 1 ? 'meal' : 'meals'}.
              Keep your nutrition log updated to build useful progress data.
            </p>
          )}
        </div>
      </section>

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div
            className="meal-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="card-label">
                  {editingMeal ? 'UPDATE MEAL' : 'NEW MEAL'}
                </span>

                <h2>
                  {editingMeal ? 'Edit Meal' : 'Add Meal'}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                type="button"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="meal_type">Meal Type</label>

                <select
                  id="meal_type"
                  name="meal_type"
                  value={form.meal_type}
                  onChange={handleChange}
                >
                  {mealTypes.map((type) => (
                    <option key={type} value={type}>
                      {formatMealType(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="meal_name">Meal Name</label>

                <input
                  id="meal_name"
                  name="meal_name"
                  type="text"
                  placeholder="e.g. Chicken Rice Bowl"
                  value={form.meal_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="nutrition-form-grid">
                <div className="form-group">
                  <label htmlFor="calories">Calories</label>

                  <input
                    id="calories"
                    name="calories"
                    type="number"
                    min="0"
                    placeholder="500"
                    value={form.calories}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="protein_g">Protein (g)</label>

                  <input
                    id="protein_g"
                    name="protein_g"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="30"
                    value={form.protein_g}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="carbohydrates_g">Carbs (g)</label>

                  <input
                    id="carbohydrates_g"
                    name="carbohydrates_g"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="50"
                    value={form.carbohydrates_g}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fats_g">Fats (g)</label>

                  <input
                    id="fats_g"
                    name="fats_g"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="15"
                    value={form.fats_g}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editingMeal
                      ? 'Update Meal'
                      : 'Save Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default Nutrition