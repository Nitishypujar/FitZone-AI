import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useQueryClient } from '@tanstack/react-query'

const EMPTY_FORM = {
  meal_type: 'Breakfast',
  meal_name: '',
  calories: '',
  protein_g: '',
  carbohydrates_g: '',
  fats_g: '',
}

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
  const [form, setForm] = useState(EMPTY_FORM)

  const queryClient = useQueryClient()

  async function loadNutrition() {
    try {
      setLoading(true)
      setError('')

      const [nutritionData, targetsData, insightData] = await Promise.all([
        api.get('/api/nutrition'),
        api.get('/api/nutrition/targets'),
        api.get('/api/nutrition/insight'),
      ])

      setMeals(nutritionData.nutrition || [])
      if (targetsData.targets) setTargets(targetsData.targets)
      setInsight(insightData.insight || null)
    } catch (err) {
      console.error('Nutrition loading error:', err)
      setError(err.message || 'Unable to load nutrition data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNutrition()
  }, [])

  const todayMeals = useMemo(() => {
    const now = new Date()
    return meals.filter((meal) => {
      if (!meal.logged_at) return false
      const date = new Date(meal.logged_at)
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
      )
    })
  }, [meals])

  const totals = useMemo(() => todayMeals.reduce((acc, meal) => ({
    calories: acc.calories + Number(meal.calories || 0),
    protein_g: acc.protein_g + Number(meal.protein_g || 0),
    carbohydrates_g: acc.carbohydrates_g + Number(meal.carbohydrates_g || 0),
    fats_g: acc.fats_g + Number(meal.fats_g || 0),
  }), {
    calories: 0,
    protein_g: 0,
    carbohydrates_g: 0,
    fats_g: 0,
  }), [todayMeals])

  function percentage(current, target) {
    if (!target) return 0
    return Math.min(Math.round((current / target) * 100), 100)
  }

  function updateForm(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setError('')
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingMeal(null)
    setError('')
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
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const mealName = form.meal_name.trim()
    if (!mealName) {
      setError('Please enter a meal name.')
      return
    }

    const numericValues = ['calories', 'protein_g', 'carbohydrates_g', 'fats_g']
    const hasInvalidNumber = numericValues.some((field) => {
      const value = form[field]
      return value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0)
    })

    if (hasInvalidNumber) {
      setError('Nutrition values must be non-negative numbers.')
      return
    }

    try {
      setSaving(true)
      setError('')

      const payload = {
        meal_type: form.meal_type,
        meal_name: mealName,
        calories: Number(form.calories || 0),
        protein_g: Number(form.protein_g || 0),
        carbohydrates_g: Number(form.carbohydrates_g || 0),
        fats_g: Number(form.fats_g || 0),
      }

      if (editingMeal) {
        await api.put(`/api/nutrition/${editingMeal.id}`, payload)
      } else {
        await api.post('/api/nutrition', payload)
      }

      resetForm()
      await loadNutrition()
      queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Nutrition save error:', err)
      setError(err.message || 'Unable to save meal.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(id) {
    if (!window.confirm('Delete this meal from your nutrition log?')) return

    try {
      setError('')
      await api.delete(`/api/nutrition/${id}`)
      await loadNutrition()
      queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      console.error('Nutrition delete error:', err)
      setError(err.message || 'Unable to delete meal.')
    }
  }

  if (loading) {
    return (
      <main className="nutrition-page">
        <section className="nutrition-header">
          <div>
            <p className="eyebrow">NUTRITION</p>
            <h1>Fuel your <span>progress.</span></h1>
            <p>Loading your personalized nutrition data...</p>
          </div>
        </section>
      </main>
    )
  }

  const macroCards = [
    ['PROTEIN', totals.protein_g, targets.protein_g, 'g'],
    ['CARBOHYDRATES', totals.carbohydrates_g, targets.carbohydrates_g, 'g'],
    ['FATS', totals.fats_g, targets.fats_g, 'g'],
    ['MEALS LOGGED', todayMeals.length, null, 'today'],
  ]

  return (
    <main className="nutrition-page">
      <section className="nutrition-header">
        <div>
          <p className="eyebrow">NUTRITION</p>
          <h1>Fuel your <span>progress.</span></h1>
          <p>
            Log what you eat, see how today compares with your personalized targets,
            and give FitZone AI another signal for your next recommendation.
          </p>
        </div>

        <div className="nutrition-calorie-card">
          <span>TODAY&apos;S CALORIES</span>
          <strong>{totals.calories.toLocaleString()}</strong>
          <p>of {Number(targets.calories || 0).toLocaleString()} kcal target</p>
          <div className="nutrition-progress-track" aria-label="Daily calorie progress">
            <div style={{ width: `${percentage(totals.calories, targets.calories)}%` }} />
          </div>
          <small>{percentage(totals.calories, targets.calories)}% of today&apos;s target</small>
        </div>
      </section>

      {error && (
        <div className="nutrition-error" role="alert">
          <strong>Couldn&apos;t complete that action.</strong>
          <span>{error}</span>
        </div>
      )}

      {insight && (
        <section className="nutrition-ai-insight" aria-label="FitZone AI nutrition insight">
          <div className="nutrition-ai-icon">AI</div>
          <div>
            <p className="eyebrow">FITZONE AI</p>
            <h2>{insight.title}</h2>
            <p>{insight.message}</p>
          </div>
        </section>
      )}

      <section className="nutrition-macros" aria-label="Daily nutrition summary">
        {macroCards.map(([label, current, target, unit]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{current}{target !== null ? ` / ${target}` : ''} {unit}</strong>
            <p>{target !== null ? `${percentage(current, target)}% of target` : 'Logged today'}</p>
          </article>
        ))}
      </section>

      <section className="nutrition-main-grid">
        <div className="nutrition-card">
          <div className="nutrition-card-heading">
            <div>
              <p className="eyebrow">TODAY&apos;S LOG</p>
              <h2>Your meals</h2>
            </div>
            <span className="nutrition-date">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          {todayMeals.length === 0 ? (
            <div className="nutrition-empty-state">
              <span>01</span>
              <div>
                <strong>No meals logged yet.</strong>
                <p>Add your first meal below to start today&apos;s nutrition record.</p>
              </div>
            </div>
          ) : (
            <div className="meal-list">
              {todayMeals.map((meal) => (
                <article className="meal-item" key={meal.id}>
                  <div className="meal-check" aria-hidden="true">✓</div>
                  <div className="meal-info">
                    <span>{meal.meal_type || 'MEAL'}</span>
                    <strong>{meal.meal_name}</strong>
                    <div className="meal-actions">
                      <button type="button" className="text-button" onClick={() => startEditing(meal)}>Edit</button>
                      <button type="button" className="text-button danger" onClick={() => deleteMeal(meal.id)}>Delete</button>
                    </div>
                  </div>
                  <div className="meal-macros">
                    <div><span>KCAL</span><strong>{Number(meal.calories || 0)}</strong></div>
                    <div><span>PRO</span><strong>{Number(meal.protein_g || 0)}g</strong></div>
                    <div><span>CARB</span><strong>{Number(meal.carbohydrates_g || 0)}g</strong></div>
                    <div><span>FAT</span><strong>{Number(meal.fats_g || 0)}g</strong></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="nutrition-card nutrition-target-card">
          <p className="eyebrow">YOUR TARGET</p>
          <h2>{Number(targets.calories || 0).toLocaleString()} kcal/day</h2>
          <p>Personalized from your current profile, activity level, and goal.</p>
          <div className="target-list">
            <div><span>Protein</span><strong>{targets.protein_g}g</strong></div>
            <div><span>Carbohydrates</span><strong>{targets.carbohydrates_g}g</strong></div>
            <div><span>Fats</span><strong>{targets.fats_g}g</strong></div>
          </div>
          <p className="nutrition-note">
            Nutrition estimates are planning targets, not medical advice. Update your profile when your body weight, training routine, or goal changes.
          </p>
        </div>
      </section>

      <section className="nutrition-card nutrition-form-card">
        <div className="nutrition-card-heading">
          <div>
            <p className="eyebrow">{editingMeal ? 'EDIT MEAL' : 'ADD MEAL'}</p>
            <h2>{editingMeal ? 'Update your meal' : 'Log a meal'}</h2>
          </div>
          {editingMeal && <button type="button" className="secondary-button" onClick={resetForm}>Cancel</button>}
        </div>

        <form className="meal-form" onSubmit={handleSubmit}>
          <div className="meal-form-field meal-form-field-wide">
            <label htmlFor="meal-name">Meal name</label>
            <input id="meal-name" type="text" maxLength="120" value={form.meal_name} onChange={(event) => updateForm('meal_name', event.target.value)} placeholder="e.g. Paneer rice bowl" required />
          </div>

          <div className="meal-form-field">
            <label htmlFor="meal-type">Meal type</label>
            <select id="meal-type" value={form.meal_type} onChange={(event) => updateForm('meal_type', event.target.value)}>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </div>

          {[
            ['calories', 'Calories', 'kcal'],
            ['protein_g', 'Protein', 'g'],
            ['carbohydrates_g', 'Carbohydrates', 'g'],
            ['fats_g', 'Fats', 'g'],
          ].map(([field, label, unit]) => (
            <div className="meal-form-field" key={field}>
              <label htmlFor={field}>{label}</label>
              <div className="number-input-wrap">
                <input id={field} type="number" min="0" max="100000" step="0.1" inputMode="decimal" value={form[field]} onChange={(event) => updateForm(field, event.target.value)} placeholder="0" />
                <span>{unit}</span>
              </div>
            </div>
          ))}

          <div className="meal-form-actions">
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving…' : editingMeal ? 'Update Meal' : 'Add Meal'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default Nutrition
