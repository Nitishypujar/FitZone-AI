import { useEffect, useMemo, useState } from 'react'

const API_URL = 'http://localhost:5000'

function Nutrition() {
  const [meals, setMeals] = useState([])

  const [targets, setTargets] = useState({
    calories: 2000,
    protein_g: 120,
    carbohydrates_g: 225,
    fats_g: 65,
  })

  const [insight, setInsight] = useState(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingMeal, setEditingMeal] = useState(null)

  const [form, setForm] = useState({
    meal_type: 'Breakfast',
    meal_name: '',
    calories: '',
    protein_g: '',
    carbohydrates_g: '',
    fats_g: '',
  })

  const token = localStorage.getItem('fitzone_access_token')

  async function loadNutrition() {
    try {
      setLoading(true)
      setError('')

      const headers = {
        Authorization: `Bearer ${token}`,
      }

      const [nutritionResponse, targetsResponse, insightResponse] =
        await Promise.all([
          fetch(`${API_URL}/api/nutrition`, {
            headers,
          }),
          fetch(`${API_URL}/api/nutrition/targets`, {
            headers,
          }),
          fetch(`${API_URL}/api/nutrition/insight`, {
            headers,
          }),
        ])

      const nutritionData = await nutritionResponse.json()
      const targetsData = await targetsResponse.json()
      const insightData = await insightResponse.json()

      if (!nutritionResponse.ok) {
        throw new Error(
          nutritionData.message || 'Unable to load nutrition data'
        )
      }

      if (!targetsResponse.ok) {
        throw new Error(
          targetsData.message || 'Unable to load nutrition targets'
        )
      }

      if (!insightResponse.ok) {
        throw new Error(
          insightData.message || 'Unable to load nutrition insight'
        )
      }

      setMeals(nutritionData.nutrition || [])

      if (targetsData.targets) {
        setTargets(targetsData.targets)
      }

      if (insightData.insight) {
        setInsight(insightData.insight)
      }
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to load nutrition data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNutrition()
  }, [])

  const todayMeals = useMemo(() => {
    const today = new Date()

    return meals.filter((meal) => {
      if (!meal.logged_at) return false

      const mealDate = new Date(meal.logged_at)

      return (
        mealDate.getFullYear() === today.getFullYear() &&
        mealDate.getMonth() === today.getMonth() &&
        mealDate.getDate() === today.getDate()
      )
    })
  }, [meals])

  const totals = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories || 0)
        acc.protein_g += Number(meal.protein_g || 0)
        acc.carbohydrates_g += Number(meal.carbohydrates_g || 0)
        acc.fats_g += Number(meal.fats_g || 0)

        return acc
      },
      {
        calories: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fats_g: 0,
      }
    )
  }, [todayMeals])

  function percentage(current, target) {
    if (!target) return 0

    return Math.min(Math.round((current / target) * 100), 100)
  }

  function updateForm(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function resetForm() {
    setForm({
      meal_type: 'Breakfast',
      meal_name: '',
      calories: '',
      protein_g: '',
      carbohydrates_g: '',
      fats_g: '',
    })

    setEditingMeal(null)
  }

  function startEditing(meal) {
    setEditingMeal(meal)

    setForm({
      meal_type: meal.meal_type || 'Breakfast',
      meal_name: meal.meal_name || '',
      calories: meal.calories ?? '',
      protein_g: meal.protein_g ?? '',
      carbohydrates_g: meal.carbohydrates_g ?? '',
      fats_g: meal.fats_g ?? '',
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!form.meal_name.trim()) {
      setError('Please enter a meal name.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        meal_type: form.meal_type,
        meal_name: form.meal_name.trim(),
        calories: Number(form.calories || 0),
        protein_g: Number(form.protein_g || 0),
        carbohydrates_g: Number(form.carbohydrates_g || 0),
        fats_g: Number(form.fats_g || 0),
      }

      const url = editingMeal
        ? `${API_URL}/api/nutrition/${editingMeal.id}`
        : `${API_URL}/api/nutrition`

      const method = editingMeal ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to save meal')
      }

      resetForm()
      await loadNutrition()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to save meal')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this meal?'
    )

    if (!confirmed) return

    try {
      setError('')

      const response = await fetch(`${API_URL}/api/nutrition/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Unable to delete meal')
      }

      await loadNutrition()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Unable to delete meal')
    }
  }

  if (loading) {
    return (
      <main className="page-shell">
        <section className="dashboard-page">
          <div className="page-header">
            <div>
              <p className="eyebrow">NUTRITION</p>
              <h1>Fuel your progress</h1>
              <p>Loading your personalized nutrition data...</p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-page">

        {/* PAGE HEADER */}
        <div className="page-header">
          <div>
            <p className="eyebrow">NUTRITION</p>

            <h1>Fuel your progress</h1>

            <p>
              Track what you eat and compare it with your personalized
              daily targets.
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            className="dashboard-card"
            style={{ marginBottom: '20px' }}
          >
            <p>{error}</p>
          </div>
        )}

        {/* AI INSIGHT */}
        {insight && (
          <div
            className="dashboard-card"
            style={{
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <p className="eyebrow">FITZONE AI</p>

            <h2>{insight.title}</h2>

            <p>{insight.message}</p>

            {insight.remaining_calories !== undefined && (
              <p>
                <strong>
                  {insight.remaining_calories} kcal
                </strong>{' '}
                remaining
                {' · '}
                <strong>
                  {insight.protein_remaining_g}g
                </strong>{' '}
                protein remaining
              </p>
            )}
          </div>
        )}

        {/* DAILY NUTRITION */}
        <div className="dashboard-grid">

          {/* CALORIES */}
          <div className="dashboard-card">
            <p className="eyebrow">DAILY CALORIES</p>

            <h2>
              {totals.calories.toLocaleString()} /{' '}
              {Number(targets.calories || 0).toLocaleString()} kcal
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage(
                    totals.calories,
                    targets.calories
                  )}%`,
                }}
              />
            </div>

            <p>
              {percentage(
                totals.calories,
                targets.calories
              )}
              % of your personalized target
            </p>
          </div>

          {/* PROTEIN */}
          <div className="dashboard-card">
            <p className="eyebrow">PROTEIN</p>

            <h2>
              {totals.protein_g} / {targets.protein_g} g
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage(
                    totals.protein_g,
                    targets.protein_g
                  )}%`,
                }}
              />
            </div>

            <p>
              {percentage(
                totals.protein_g,
                targets.protein_g
              )}
              % complete
            </p>
          </div>

          {/* CARBS */}
          <div className="dashboard-card">
            <p className="eyebrow">CARBOHYDRATES</p>

            <h2>
              {totals.carbohydrates_g} /{' '}
              {targets.carbohydrates_g} g
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage(
                    totals.carbohydrates_g,
                    targets.carbohydrates_g
                  )}%`,
                }}
              />
            </div>

            <p>
              {percentage(
                totals.carbohydrates_g,
                targets.carbohydrates_g
              )}
              % complete
            </p>
          </div>

          {/* FATS */}
          <div className="dashboard-card">
            <p className="eyebrow">FATS</p>

            <h2>
              {totals.fats_g} / {targets.fats_g} g
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${percentage(
                    totals.fats_g,
                    targets.fats_g
                  )}%`,
                }}
              />
            </div>

            <p>
              {percentage(
                totals.fats_g,
                targets.fats_g
              )}
              % complete
            </p>
          </div>

        </div>

        {/* PERSONALIZED TARGET + TODAY */}
        <div
          className="dashboard-grid"
          style={{ marginTop: '24px' }}
        >

          <div className="dashboard-card">
            <p className="eyebrow">
              YOUR PERSONALIZED TARGET
            </p>

            <h2>
              {Number(targets.calories).toLocaleString()} kcal/day
            </h2>

            <p>
              Protein: {targets.protein_g}g · Carbs:{' '}
              {targets.carbohydrates_g}g · Fats:{' '}
              {targets.fats_g}g
            </p>

            <small>
              Target generated from your fitness profile and goal.
            </small>
          </div>

          <div className="dashboard-card">
            <p className="eyebrow">TODAY</p>

            <h2>{todayMeals.length} meals logged</h2>

            <p>
              {totals.calories.toLocaleString()} calories
              consumed so far.
            </p>
          </div>

        </div>

        {/* ADD / EDIT MEAL */}
        <div
          className="dashboard-card"
          style={{ marginTop: '24px' }}
        >
          <div className="page-header">
            <div>
              <p className="eyebrow">
                {editingMeal ? 'EDIT MEAL' : 'ADD MEAL'}
              </p>

              <h2>
                {editingMeal
                  ? 'Update your meal'
                  : 'Log a meal'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="dashboard-grid">

              <div>
                <label>Meal type</label>

                <select
                  value={form.meal_type}
                  onChange={(event) =>
                    updateForm(
                      'meal_type',
                      event.target.value
                    )
                  }
                >
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
              </div>

              <div>
                <label>Meal name</label>

                <input
                  type="text"
                  value={form.meal_name}
                  onChange={(event) =>
                    updateForm(
                      'meal_name',
                      event.target.value
                    )
                  }
                  placeholder="e.g. Paneer rice bowl"
                />
              </div>

              <div>
                <label>Calories</label>

                <input
                  type="number"
                  min="0"
                  value={form.calories}
                  onChange={(event) =>
                    updateForm(
                      'calories',
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>Protein (g)</label>

                <input
                  type="number"
                  min="0"
                  value={form.protein_g}
                  onChange={(event) =>
                    updateForm(
                      'protein_g',
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>Carbohydrates (g)</label>

                <input
                  type="number"
                  min="0"
                  value={form.carbohydrates_g}
                  onChange={(event) =>
                    updateForm(
                      'carbohydrates_g',
                      event.target.value
                    )
                  }
                />
              </div>

              <div>
                <label>Fats (g)</label>

                <input
                  type="number"
                  min="0"
                  value={form.fats_g}
                  onChange={(event) =>
                    updateForm(
                      'fats_g',
                      event.target.value
                    )
                  }
                />
              </div>

            </div>

            <div style={{ marginTop: '20px' }}>

              <button
                type="submit"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingMeal
                    ? 'Update Meal'
                    : 'Add Meal'}
              </button>

              {editingMeal && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{ marginLeft: '10px' }}
                >
                  Cancel
                </button>
              )}

            </div>

          </form>
        </div>

        {/* TODAY'S MEALS */}
        <div
          className="dashboard-card"
          style={{ marginTop: '24px' }}
        >
          <div className="page-header">
            <div>
              <p className="eyebrow">TODAY'S LOG</p>
              <h2>Your meals</h2>
            </div>
          </div>

          {todayMeals.length === 0 ? (
            <p>No meals logged today yet.</p>
          ) : (
            <div>

              {todayMeals.map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '16px 0',
                    borderBottom:
                      '1px solid rgba(255,255,255,0.08)',
                  }}
                >

                  <div>
                    <strong>{meal.meal_name}</strong>

                    <p>
                      {meal.meal_type} · {meal.calories} kcal ·{' '}
                      {meal.protein_g}g protein ·{' '}
                      {meal.carbohydrates_g}g carbs ·{' '}
                      {meal.fats_g}g fats
                    </p>
                  </div>

                  <div>

                    <button
                      onClick={() =>
                        startEditing(meal)
                      }
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteMeal(meal.id)
                      }
                      style={{ marginLeft: '8px' }}
                    >
                      Delete
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

      </section>
    </main>
  )
}

export default Nutrition