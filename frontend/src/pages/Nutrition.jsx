import { useEffect, useState } from 'react'

const API_URL = 'http://localhost:5000'

const meals = [
  {
    id: 1,
    type: 'BREAKFAST',
    name: 'Protein Oatmeal',
    calories: 420,
    protein: 28,
    carbs: 52,
    fats: 12,
  },
  {
    id: 2,
    type: 'LUNCH',
    name: 'Chicken Rice Bowl',
    calories: 610,
    protein: 45,
    carbs: 68,
    fats: 16,
  },
  {
    id: 3,
    type: 'SNACK',
    name: 'Greek Yogurt & Fruit',
    calories: 240,
    protein: 18,
    carbs: 30,
    fats: 5,
  },
  {
    id: 4,
    type: 'DINNER',
    name: 'Grilled Chicken & Vegetables',
    calories: 520,
    protein: 42,
    carbs: 38,
    fats: 18,
  },
]

function Nutrition() {
  const [completedMeals, setCompletedMeals] = useState([])
  const [water, setWater] = useState(5)

  const [habitCompleted, setHabitCompleted] = useState({
    water: false,
    sleep: false,
    stretching: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const calorieGoal = 2000

  const totalCalories = meals.reduce(
    (total, meal) => total + meal.calories,
    0,
  )

  const totalProtein = meals.reduce(
    (total, meal) => total + meal.protein,
    0,
  )

  const totalCarbs = meals.reduce(
    (total, meal) => total + meal.carbs,
    0,
  )

  const totalFats = meals.reduce(
    (total, meal) => total + meal.fats,
    0,
  )

  const calorieProgress = Math.min(
    Math.round((totalCalories / calorieGoal) * 100),
    100,
  )

  useEffect(() => {
    async function loadNutrition() {
      try {
        setLoading(true)
        setError('')

        const token = localStorage.getItem('fitzone_access_token')

        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await fetch(`${API_URL}/api/nutrition`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok || data.status !== 'success') {
          throw new Error(
            data.message || 'Unable to load nutrition tracking',
          )
        }

        const nutrition = data.nutrition

        const completed = []

        if (nutrition.breakfast_completed) {
          completed.push(1)
        }

        if (nutrition.lunch_completed) {
          completed.push(2)
        }

        if (nutrition.snack_completed) {
          completed.push(3)
        }

        if (nutrition.dinner_completed) {
          completed.push(4)
        }

        setCompletedMeals(completed)

        setWater(
          Number.isInteger(nutrition.water_glasses)
            ? nutrition.water_glasses
            : 5,
        )

        setHabitCompleted({
          water: Boolean(nutrition.hydration_completed),
          sleep: Boolean(nutrition.sleep_completed),
          stretching: Boolean(nutrition.stretching_completed),
        })
      } catch (err) {
        console.error('Nutrition loading error:', err)
        setError(err.message || 'Unable to load nutrition tracking')
      } finally {
        setLoading(false)
      }
    }

    loadNutrition()
  }, [])

  async function saveNutrition(
    nextCompletedMeals,
    nextWater,
    nextHabits,
  ) {
    try {
      setSaving(true)
      setError('')

      const token = localStorage.getItem('fitzone_access_token')

      if (!token) {
        throw new Error('Authentication token not found')
      }

      const response = await fetch(`${API_URL}/api/nutrition`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          breakfast_completed: nextCompletedMeals.includes(1),
          lunch_completed: nextCompletedMeals.includes(2),
          snack_completed: nextCompletedMeals.includes(3),
          dinner_completed: nextCompletedMeals.includes(4),

          water_glasses: nextWater,

          hydration_completed: nextHabits.water,
          sleep_completed: nextHabits.sleep,
          stretching_completed: nextHabits.stretching,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.status !== 'success') {
        throw new Error(
          data.message || 'Unable to save nutrition tracking',
        )
      }
    } catch (err) {
      console.error('Nutrition saving error:', err)
      setError(err.message || 'Unable to save nutrition tracking')
    } finally {
      setSaving(false)
    }
  }

  function toggleMeal(id) {
    const nextCompletedMeals = completedMeals.includes(id)
      ? completedMeals.filter((mealId) => mealId !== id)
      : [...completedMeals, id]

    setCompletedMeals(nextCompletedMeals)

    saveNutrition(
      nextCompletedMeals,
      water,
      habitCompleted,
    )
  }

  function changeWater(value) {
    const nextWater = Math.max(0, Math.min(value, 8))

    setWater(nextWater)

    saveNutrition(
      completedMeals,
      nextWater,
      habitCompleted,
    )
  }

  function toggleHabit(name) {
    const nextHabits = {
      ...habitCompleted,
      [name]: !habitCompleted[name],
    }

    setHabitCompleted(nextHabits)

    saveNutrition(
      completedMeals,
      water,
      nextHabits,
    )
  }

  return (
    <main className="nutrition-page">
      <section className="nutrition-header">
        <div>
          <p className="eyebrow">NUTRITION & WELLNESS</p>

          <h1>
            Fuel your
            <br />
            <span>progress.</span>
          </h1>

          <p>
            Keep your nutrition and daily wellness habits organized alongside
            your training journey.
          </p>
        </div>

        <div className="nutrition-calorie-card">
          <span>DAILY CALORIES</span>

          <strong>{totalCalories}</strong>

          <p>of {calorieGoal} kcal target</p>

          <div className="nutrition-progress-track">
            <div style={{ width: `${calorieProgress}%` }}></div>
          </div>

          <small>
            {Math.max(calorieGoal - totalCalories, 0)} kcal remaining
          </small>
        </div>
      </section>

      {loading && (
        <div className="nutrition-status">
          Loading your nutrition tracking...
        </div>
      )}

      {saving && !loading && (
        <div className="nutrition-status">
          Saving...
        </div>
      )}

      {error && (
        <div className="nutrition-error">
          {error}
        </div>
      )}

      <section className="nutrition-macros">
        <article>
          <span>PROTEIN</span>
          <strong>{totalProtein}g</strong>
          <p>Daily intake</p>
        </article>

        <article>
          <span>CARBOHYDRATES</span>
          <strong>{totalCarbs}g</strong>
          <p>Daily intake</p>
        </article>

        <article>
          <span>FATS</span>
          <strong>{totalFats}g</strong>
          <p>Daily intake</p>
        </article>

        <article>
          <span>MEALS</span>
          <strong>{completedMeals.length}/4</strong>
          <p>Logged today</p>
        </article>
      </section>

      <section className="nutrition-main-grid">
        <article className="nutrition-card">
          <div className="nutrition-card-heading">
            <div>
              <p className="eyebrow">TODAY'S FOOD</p>
              <h2>Meal overview</h2>
            </div>

            <span className="nutrition-date">TODAY</span>
          </div>

          <div className="meal-list">
            {meals.map((meal) => {
              const completed = completedMeals.includes(meal.id)

              return (
                <div
                  className={`meal-item ${completed ? 'completed' : ''}`}
                  key={meal.id}
                >
                  <button
                    className="meal-check"
                    onClick={() => toggleMeal(meal.id)}
                    aria-label={`Mark ${meal.name} as ${
                      completed ? 'incomplete' : 'complete'
                    }`}
                  >
                    {completed ? '✓' : ''}
                  </button>

                  <div className="meal-info">
                    <span>{meal.type}</span>
                    <strong>{meal.name}</strong>
                  </div>

                  <div className="meal-macros">
                    <div>
                      <span>CAL</span>
                      <strong>{meal.calories}</strong>
                    </div>

                    <div>
                      <span>PRO</span>
                      <strong>{meal.protein}g</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </article>

        <article className="nutrition-card hydration-card">
          <div className="nutrition-card-heading">
            <div>
              <p className="eyebrow">HYDRATION</p>
              <h2>Water intake</h2>
            </div>

            <span className="water-count">{water}/8</span>
          </div>

          <div className="water-visual">
            <div className="water-circle">
              <strong>{Math.round((water / 8) * 100)}%</strong>
              <span>DAILY TARGET</span>
            </div>
          </div>

          <div className="water-controls">
            <button
              type="button"
              onClick={() => changeWater(water - 1)}
            >
              −
            </button>

            <span>{water} glasses</span>

            <button
              type="button"
              onClick={() => changeWater(water + 1)}
            >
              +
            </button>
          </div>

          <p className="nutrition-note">
            Staying hydrated throughout the day supports an active routine.
          </p>
        </article>
      </section>

      <section className="wellness-section">
        <div className="section-heading">
          <p className="eyebrow">DAILY WELLNESS</p>

          <h2>Small habits matter.</h2>
        </div>

        <div className="wellness-grid">
          <button
            type="button"
            className={`wellness-card ${
              habitCompleted.water ? 'completed' : ''
            }`}
            onClick={() => toggleHabit('water')}
          >
            <span className="wellness-number">01</span>

            <div>
              <h3>Hydration</h3>
              <p>Reach your daily water target.</p>
            </div>

            <strong>{habitCompleted.water ? '✓' : '○'}</strong>
          </button>

          <button
            type="button"
            className={`wellness-card ${
              habitCompleted.sleep ? 'completed' : ''
            }`}
            onClick={() => toggleHabit('sleep')}
          >
            <span className="wellness-number">02</span>

            <div>
              <h3>Quality Sleep</h3>
              <p>Prioritize a consistent sleep routine.</p>
            </div>

            <strong>{habitCompleted.sleep ? '✓' : '○'}</strong>
          </button>

          <button
            type="button"
            className={`wellness-card ${
              habitCompleted.stretching ? 'completed' : ''
            }`}
            onClick={() => toggleHabit('stretching')}
          >
            <span className="wellness-number">03</span>

            <div>
              <h3>Mobility</h3>
              <p>Take a few minutes for movement and stretching.</p>
            </div>

            <strong>{habitCompleted.stretching ? '✓' : '○'}</strong>
          </button>
        </div>
      </section>

      <section className="nutrition-ai-insight">
        <div className="nutrition-ai-icon">AI</div>

        <div>
          <p className="eyebrow">FITZONE AI INSIGHT</p>

          <h2>Your nutrition supports your training routine.</h2>

          <p>
            Your logged meals currently provide {totalProtein}g of protein and{' '}
            {totalCalories} kcal. In a future version, FitZone AI can use your
            goals, workout history, and nutrition data to generate
            personalized general-wellness insights.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Nutrition