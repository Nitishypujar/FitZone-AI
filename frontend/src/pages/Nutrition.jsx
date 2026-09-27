import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { getFitnessTimeZone } from '../hooks/useFitnessBrain'

const RANGES = [
  { key: 7, label: '7D' },
  { key: 28, label: '4W' },
  { key: 90, label: '3M' },
  { key: 365, label: '1Y' },
]

const EMPTY = {
  meal_type: 'Breakfast',
  text: '',
}

const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

function getTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

function percent(current, target) {
  if (!target) return null
  return Math.max(0, Math.round((Number(current || 0) / Number(target)) * 100))
}

function Nutrition() {
  const queryClient = useQueryClient()
  const timeZone = getTimeZone()
  const [range, setRange] = useState(28)
  const [form, setForm] = useState(EMPTY)
  const [analysis, setAnalysis] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  const query = useQuery({
    queryKey: ['nutrition', range, timeZone],
    queryFn: async () => {
      const [intelligence, meals, brain] = await Promise.all([
        api.get(`/api/nutrition/intelligence?days=${range}&timezone=${encodeURIComponent(timeZone)}`),
        api.get('/api/nutrition'),
        api.get(`/api/fitness/state?timezone=${encodeURIComponent(getFitnessTimeZone())}`).catch(() => null),
      ])
      return { intelligence, meals: meals.nutrition || [], brain }
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  })

  const intelligence = query.data?.intelligence || {}
  const brain = query.data?.brain || null
  const meals = query.data?.meals || []
  const today = intelligence.today || { totals: {}, targets: {}, percentages: {}, meals_logged: 0 }
  const targets = intelligence.targets || brain?.intelligence?.nutrition_targets || { available: false }
  const history = intelligence.history || []
  const mlSignal = intelligence.ml_signal || { available: false }
  const actions = intelligence.actions || []

  const todayKey = today.date
  const todayMeals = useMemo(() => {
    return meals.filter((meal) => {
      const value = meal.logged_at || meal.created_at
      if (!value) return false
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value))
      const map = Object.fromEntries(parts.map((item) => [item.type, item.value]))
      return `${map.year}-${map.month}-${map.day}` === todayKey
    })
  }, [meals, timeZone, todayKey])

  const selectedDayState = history.find((day) => day.date === selectedDay) || history[history.length - 1] || null

  const maxCalories = Math.max(1, ...history.map((day) => Number(day.calories || 0)))
  const chartRows = history.filter((day) => day.has_data)

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  async function analyzeFood(event) {
    event.preventDefault()
    const text = form.text.trim()
    if (!text) { setError('Describe what you ate first.'); return }
    try {
      setAnalyzing(true)
      setError('')
      const result = await api.post('/api/nutrition/analyze', { text, meal_type: form.meal_type })
      setAnalysis(result.analysis || null)
    } catch (err) {
      setError(err.message || 'Food analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  function updateAnalyzedItem(index, field, value) {
    setAnalysis((current) => {
      if (!current) return current
      const items = [...(current.items || [])]
      const nextItem = { ...items[index], [field]: value }
      if (field === 'quantity') {
        const numericQuantity = Number(value)
        if (Number.isFinite(numericQuantity) && numericQuantity > 0) {
          const unit = String(nextItem.unit || nextItem.food?.default_unit || 'serving').toLowerCase()
          const unitToGrams = {
            g: 1, gram: 1, grams: 1, kg: 1000, kilogram: 1000, kilograms: 1000,
            ml: 1, milliliter: 1, milliliters: 1, l: 1000, litre: 1000, liter: 1000,
          }
          const sizeMultiplier = { small: 0.82, medium: 1, large: 1.25 }
          const defaultGrams = Number(nextItem.food?.default_grams || nextItem.grams || 100)
          let grams = numericQuantity * defaultGrams
          if (unitToGrams[unit]) grams = numericQuantity * unitToGrams[unit]
          if (sizeMultiplier[unit]) grams = numericQuantity * defaultGrams * sizeMultiplier[unit]
          nextItem.grams = Number(grams.toFixed(1))
          const per100g = nextItem.food?.per_100g || {}
          const factor = grams / 100
          nextItem.nutrients = {
            calories: Number((Number(per100g.calories || 0) * factor).toFixed(1)),
            protein_g: Number((Number(per100g.protein_g || 0) * factor).toFixed(1)),
            carbohydrates_g: Number((Number(per100g.carbohydrates_g || 0) * factor).toFixed(1)),
            fats_g: Number((Number(per100g.fats_g || 0) * factor).toFixed(1)),
            fiber_g: Number((Number(per100g.fiber_g || 0) * factor).toFixed(1)),
          }
        }
      }
      items[index] = nextItem
      const totals = items.reduce((sum, item) => ({
        calories: sum.calories + Number(item.nutrients?.calories || 0),
        protein_g: sum.protein_g + Number(item.nutrients?.protein_g || 0),
        carbohydrates_g: sum.carbohydrates_g + Number(item.nutrients?.carbohydrates_g || 0),
        fats_g: sum.fats_g + Number(item.nutrients?.fats_g || 0),
        fiber_g: sum.fiber_g + Number(item.nutrients?.fiber_g || 0),
      }), { calories: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0 })
      return { ...current, items, totals }
    })
  }

  const analyzedTotals = analysis?.totals || null

  async function saveAnalysis() {
    if (!analysis?.can_save || !analysis?.items?.length) {
      setError('Review the food matches before saving this entry.')
      return
    }
    const mealName = analysis.items.map((item) => `${item.quantity} ${item.unit} ${item.food?.name || item.name}`).join(', ')
    try {
      setSaving(true)
      setError('')
      await api.post('/api/nutrition', {
        meal_type: form.meal_type,
        meal_name: mealName.slice(0, 120),
        calories: Number(analyzedTotals.calories || 0),
        protein_g: Number(analyzedTotals.protein_g || 0),
        carbohydrates_g: Number(analyzedTotals.carbohydrates_g || 0),
        fats_g: Number(analyzedTotals.fats_g || 0),
        fiber_g: Number(analyzedTotals.fiber_g || 0),
        entry_source: 'ai_food_parser',
        nutrition_confidence: analysis.confidence || 'medium',
        food_items: analysis.items,
      })
      setForm(EMPTY)
      setAnalysis(null)
      await queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['intelligence'] })
    queryClient.invalidateQueries({ queryKey: ['fitness-brain'] })
    } catch (err) {
      setError(err.message || 'Unable to save nutrition entry.')
    } finally {
      setSaving(false)
    }
  }

  function startEditing(meal) {
    setEditingMeal(meal)
    setForm({ meal_type: meal.meal_type || 'Breakfast', text: meal.meal_name || '' })
    setAnalysis(null)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function updateManualMeal(event) {
    event.preventDefault()
    if (!editingMeal) return
    if (!form.text.trim()) { setError('Meal description is required.'); return }
    try {
      setSaving(true)
      await api.put(`/api/nutrition/${editingMeal.id}`, {
        meal_type: form.meal_type,
        meal_name: form.text.trim(),
        calories: editingMeal.calories,
        protein_g: editingMeal.protein_g,
        carbohydrates_g: editingMeal.carbohydrates_g,
        fats_g: editingMeal.fats_g,
        fiber_g: editingMeal.fiber_g,
        entry_source: editingMeal.entry_source || 'manual',
        nutrition_confidence: editingMeal.nutrition_confidence || null,
        food_items: editingMeal.food_items || null,
        logged_at: editingMeal.logged_at || undefined,
      })
      setEditingMeal(null)
      setForm(EMPTY)
      await queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      setError(err.message || 'Unable to update this meal.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteMeal(id) {
    if (!window.confirm('Delete this nutrition entry? This will remove the saved meal from your history.')) return
    try {
      setDeletingId(id)
      setError('')
      await api.delete(`/api/nutrition/${id}`)
      await queryClient.invalidateQueries({ queryKey: ['nutrition'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    } catch (err) {
      setError(err.message || 'Unable to delete the meal.')
    } finally {
      setDeletingId(null)
    }
  }

  if (query.isLoading) {
    return <main className="nutrition-page"><section className="nutrition-loading"><p className="eyebrow">NUTRITION INTELLIGENCE</p><h1>Building your <span>nutrition state.</span></h1><p>Loading saved meals, targets and adaptive nutrition signals.</p></section></main>
  }

  if (query.isError) {
    return <main className="nutrition-page"><section className="nutrition-loading"><p className="eyebrow">NUTRITION</p><h1>Nutrition data is <span>unavailable.</span></h1><p>{query.error.message}</p><button className="primary-button" onClick={() => query.refetch()}>Try again</button></section></main>
  }

  const calories = Number(today.totals?.calories || 0)
  const caloriePercent = percent(calories, targets.available ? targets.calories : null)

  return (
    <main className="nutrition-page">
      <section className="nutrition-header nutrition-header-enhanced">
        <div>
          <p className="eyebrow">NUTRITION INTELLIGENCE</p>
          <h1>Fuel your <span>progress.</span></h1>
          <p className="nutrition-date-line">
            {new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone }).format(new Date())}
          </p>
          <p>
            Tell FitZone what you ate in plain language. The food parser matches the entry against the bundled reference catalog, normalizes your portion, calculates the nutrients deterministically, and then feeds your real nutrition state back into the adaptive system.
          </p>
        </div>
        <div className="nutrition-hero-ring-card">
          <div className="nutrition-hero-ring" style={{ '--progress': `${Math.min(caloriePercent || 0, 100) * 3.6}deg` }}>
            <div><strong>{formatter.format(calories)}</strong><span>kcal logged</span></div>
          </div>
          <div className="nutrition-hero-caption">
            {targets.available ? <><strong>{formatter.format(Math.max(0, targets.calories - calories))} kcal</strong><span>remaining against planning target</span></> : <><strong>Target not available</strong><span>complete the required profile fields</span></>}
          </div>
        </div>
      </section>

      {error && <div className="nutrition-error" role="alert"><strong>Couldn&apos;t complete that action.</strong><span>{error}</span></div>}

      <section className="nutrition-macro-grid">
        <article className="nutrition-macro-card hero"><span>CALORIES</span><strong>{formatter.format(calories)}</strong><small>{targets.available ? `${caloriePercent}% of ${formatter.format(targets.calories)} kcal target` : 'saved today'}</small><div className="nutrition-meter"><i style={{ width: `${Math.min(caloriePercent || 0, 100)}%` }} /></div></article>
        {[
          ['PROTEIN', today.totals?.protein_g, targets.protein_g, 'g'],
          ['CARBOHYDRATES', today.totals?.carbohydrates_g, targets.carbohydrates_g, 'g'],
          ['FATS', today.totals?.fats_g, targets.fats_g, 'g'],
          ['FIBER', today.totals?.fiber_g, null, 'g'],
        ].map(([label, current, target, unit]) => (
          <article className="nutrition-macro-card" key={label}>
            <span>{label}</span>
            <strong>{oneDecimal.format(Number(current || 0))}{unit === 'g' ? 'g' : ''}</strong>
            <small>{target ? `${percent(current, target)}% of target` : 'logged today'}</small>
            <div className="nutrition-meter"><i style={{ width: `${Math.min(percent(current, target) || 0, 100)}%` }} /></div>
          </article>
        ))}
      </section>

      <section className="nutrition-main-grid nutrition-main-grid-enhanced">
        <article className="nutrition-card nutrition-composer-card">
          <div className="nutrition-card-heading">
            <div><p className="eyebrow">SMART FOOD LOG</p><h2>{editingMeal ? 'Edit saved entry' : 'Log what you ate'}</h2></div>
            {editingMeal && <button className="secondary-button" onClick={() => { setEditingMeal(null); setForm(EMPTY); setError('') }}>Cancel edit</button>}
          </div>

          {editingMeal ? (
            <form className="nutrition-composer" onSubmit={updateManualMeal}>
              <div className="nutrition-field"><label htmlFor="meal-type-edit">Meal</label><select id="meal-type-edit" value={form.meal_type} onChange={(e) => updateForm('meal_type', e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></div>
              <div className="nutrition-field wide"><label htmlFor="meal-text-edit">Meal description</label><input id="meal-text-edit" value={form.text} onChange={(e) => updateForm('text', e.target.value)} maxLength="120" /></div>
              <div className="nutrition-composer-actions"><button className="primary-button" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
            </form>
          ) : (
            <form className="nutrition-composer" onSubmit={analyzeFood}>
              <div className="nutrition-field"><label htmlFor="meal-type">Meal</label><select id="meal-type" value={form.meal_type} onChange={(e) => updateForm('meal_type', e.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></div>
              <div className="nutrition-field wide"><label htmlFor="food-text">What did you eat?</label><textarea id="food-text" rows="4" maxLength="2000" value={form.text} onChange={(e) => updateForm('text', e.target.value)} placeholder="Try: 2 eggs, 2 chapatis, 150g chicken curry and one banana" /></div>
              <div className="nutrition-composer-actions"><span>Plain-language entry · quantity-aware · deterministic nutrient calculation</span><button className="primary-button" disabled={analyzing}>{analyzing ? 'Analyzing…' : 'Analyze food'}</button></div>
            </form>
          )}

          {analysis && !editingMeal && (
            <div className="nutrition-analysis-card">
              <div className="nutrition-analysis-head"><div><p className="eyebrow">FITZONE FOOD ANALYSIS</p><h3>Review before saving</h3></div><span className={`confidence-pill ${analysis.confidence || 'medium'}`}>{String(analysis.confidence || 'medium').toUpperCase()} CONFIDENCE</span></div>
              <div className="nutrition-analysis-items">
                {(analysis.items || []).map((item, index) => (
                  <div className="nutrition-analysis-item" key={`${item.food_id || item.food?.name || item.name}-${index}`}>
                    <div><strong>{item.food?.name || item.name}</strong><span>{item.food?.preparation || 'standard reference food'}</span></div>
                    <div className="nutrition-quantity-editor"><input value={item.quantity} inputMode="decimal" onChange={(e) => updateAnalyzedItem(index, 'quantity', e.target.value)} aria-label={`Quantity for ${item.food?.name || item.name}`} /><span>{item.unit}</span></div>
                    <div className="nutrition-analysis-item-values"><strong>{formatter.format(item.nutrients?.calories || 0)} kcal</strong><span>{oneDecimal.format(item.nutrients?.protein_g || 0)}g protein</span></div>
                  </div>
                ))}
              </div>
              {analysis.unmatched_items?.length > 0 && <div className="nutrition-review-warning">Needs review: {analysis.unmatched_items.join(', ')}. Remove the unmatched item or add a more specific description before saving.</div>}
              <div className="nutrition-analysis-total"><div><span>TOTAL</span><strong>{formatter.format(analyzedTotals?.calories || 0)} kcal</strong></div><div><span>PROTEIN</span><strong>{oneDecimal.format(analyzedTotals?.protein_g || 0)}g</strong></div><div><span>CARBS</span><strong>{oneDecimal.format(analyzedTotals?.carbohydrates_g || 0)}g</strong></div><div><span>FAT</span><strong>{oneDecimal.format(analyzedTotals?.fats_g || 0)}g</strong></div></div>
              <div className="nutrition-analysis-actions"><button className="secondary-button" onClick={() => setAnalysis(null)}>Start over</button><button className="primary-button" disabled={saving || analysis.can_save !== true} onClick={saveAnalysis}>{saving ? 'Saving…' : 'Add to today'}</button></div>
            </div>
          )}
        </article>

        <article className="nutrition-card nutrition-target-card nutrition-target-card-enhanced">
          <div className="dashboard-card-heading"><div><p className="eyebrow">PERSONALIZED PLANNING</p><h2>Your current target</h2></div></div>
          {targets.available ? (
            <>
              <strong className="target-calories">{formatter.format(targets.calories)} <small>kcal/day</small></strong>
              <p>{formatGoal(targets.goal)} · {targets.method === 'mifflin-st-jeor-planning-estimate' ? 'profile-based planning estimate' : targets.method}</p>
              <div className="target-list target-list-large">
                <div><span>Protein</span><strong>{formatter.format(targets.protein_g)}g</strong></div>
                <div><span>Carbohydrates</span><strong>{formatter.format(targets.carbohydrates_g)}g</strong></div>
                <div><span>Fats</span><strong>{formatter.format(targets.fats_g)}g</strong></div>
              </div>
            </>
          ) : (
            <div className="nutrition-no-target"><strong>More profile data is needed.</strong><p>{(targets.missing_fields || []).join(', ') || 'Complete your age, height and weight.'}</p></div>
          )}
          <p className="nutrition-note">These are planning estimates, not medical advice. Exact intake varies with food preparation, portion size and source data.</p>
        </article>
      </section>

      <section className="nutrition-card nutrition-today-card">
        <div className="nutrition-card-heading"><div><p className="eyebrow">TODAY</p><h2>Your meal timeline</h2></div><span className="nutrition-date">{todayMeals.length} saved {todayMeals.length === 1 ? 'entry' : 'entries'}</span></div>
        {todayMeals.length === 0 ? (
          <div className="nutrition-empty-state"><span>01</span><div><strong>No food entries yet.</strong><p>Use the smart food logger above. FitZone will calculate the nutrients before you save.</p></div></div>
        ) : (
          <div className="nutrition-meal-timeline">
            {todayMeals.map((meal) => (
              <article className="nutrition-timeline-item" key={meal.id}>
                <div className="nutrition-timeline-dot" />
                <div className="nutrition-timeline-main"><span>{meal.meal_type || 'MEAL'} · {meal.logged_at ? new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span><strong>{meal.meal_name}</strong><small>{meal.nutrition_confidence ? `${meal.nutrition_confidence} confidence` : 'nutrition entry'}</small><div><button className="text-button" onClick={() => startEditing(meal)}>Edit</button><button className="text-button danger" onClick={() => deleteMeal(meal.id)} disabled={deletingId === meal.id}>{deletingId === meal.id ? 'Deleting…' : 'Delete'}</button></div></div>
                <div className="nutrition-timeline-values"><strong>{formatter.format(meal.calories || 0)}</strong><span>kcal</span><em>{oneDecimal.format(meal.protein_g || 0)}g protein</em></div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="nutrition-card nutrition-history-card">
        <div className="nutrition-card-heading nutrition-history-heading">
          <div><p className="eyebrow">HISTORY</p><h2>Nutrition over time</h2><p className="dashboard-section-copy">Only days with saved entries contribute visible data. Empty days remain empty.</p></div>
          <div className="activity-range-switcher">{RANGES.map((item) => <button key={item.key} className={range === item.key ? 'active' : ''} onClick={() => { setRange(item.key); setSelectedDay(null) }}>{item.label}</button>)}</div>
        </div>

        <div className="nutrition-history-chart">
          {history.map((day) => (
            <button type="button" key={day.date} className={`nutrition-history-column ${day.date === selectedDay ? 'selected' : ''}`} onClick={() => setSelectedDay(day.date)} title={`${day.date}: ${formatter.format(day.calories)} kcal`}>
              <span className="nutrition-history-bar" style={{ height: `${day.has_data ? Math.max(4, (day.calories / maxCalories) * 100) : 2}%` }} />
              <span>{day.date.slice(8)}</span>
            </button>
          ))}
        </div>

        {selectedDayState && (
          <div className="nutrition-day-detail">
            <div><p className="eyebrow">SELECTED DAY</p><h3>{new Date(`${selectedDayState.date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3></div>
            <div><strong>{formatter.format(selectedDayState.calories)} kcal</strong><span>calories</span></div>
            <div><strong>{oneDecimal.format(selectedDayState.protein_g)}g</strong><span>protein</span></div>
            <div><strong>{selectedDayState.meals_logged}</strong><span>meals</span></div>
          </div>
        )}

        {chartRows.length === 0 && <div className="nutrition-empty-state"><span>HISTORY</span><div><strong>There isn&apos;t enough logged nutrition history yet.</strong><p>Keep logging real meals. FitZone will populate this timeline automatically.</p></div></div>}
      </section>

      <section className="nutrition-bottom-grid">
        <article className="nutrition-card nutrition-ai-panel">
          <div className="nutrition-ai-panel-icon">AI</div>
          <div><p className="eyebrow">NUTRITION INTELLIGENCE</p><h2>{actions[0]?.title || 'Keep building your nutrition record'}</h2><p>{actions[0]?.message || 'More real entries give FitZone better signals for personalized recommendations.'}</p></div>
        </article>
        <article className="nutrition-card nutrition-ml-panel">
          <p className="eyebrow">BEHAVIORAL ML</p>
          <h2>{mlSignal.available ? `${Math.round(Number(mlSignal.adherence_probability || 0) * 100)}% predicted adherence` : 'Learning signal is warming up'}</h2>
          <p>{mlSignal.available ? `Based on ${mlSignal.recent_days || history.length} days of logged nutrition behavior. This is a behavioral signal, not a medical forecast.` : 'FitZone waits for enough real history before enabling the nutrition-adherence model.'}</p>
        </article>
      </section>
    </main>
  )
}

function formatGoal(value) {
  if (!value) return 'Not set'
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default Nutrition
