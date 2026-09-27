const { predictNutritionAdherence } = require('../ml/personalizationClient')
const { calculateNutritionTargets } = require('../nutritionCalculator')

function safeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function dayKeyFromDate(value, timeZone = 'UTC') {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

function enumerateDays(startKey, endKey) {
  const result = []
  const current = new Date(`${startKey}T12:00:00Z`)
  const end = new Date(`${endKey}T12:00:00Z`)
  while (current <= end) {
    result.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}

function aggregateNutritionByDay(nutritionLogs = [], timeZone = 'UTC') {
  const map = new Map()
  for (const log of Array.isArray(nutritionLogs) ? nutritionLogs : []) {
    const day = dayKeyFromDate(log.logged_at || log.created_at, timeZone)
    if (!day) continue
    if (!map.has(day)) {
      map.set(day, {
        date: day,
        calories: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fats_g: 0,
        fiber_g: 0,
        meals_logged: 0,
      })
    }
    const row = map.get(day)
    row.calories += safeNumber(log.calories)
    row.protein_g += safeNumber(log.protein_g)
    row.carbohydrates_g += safeNumber(log.carbohydrates_g)
    row.fats_g += safeNumber(log.fats_g)
    row.fiber_g += safeNumber(log.fiber_g)
    row.meals_logged += 1
  }
  for (const row of map.values()) {
    for (const key of ['calories', 'protein_g', 'carbohydrates_g', 'fats_g', 'fiber_g']) row[key] = Number(row[key].toFixed(1))
  }
  return map
}

function calculateNutritionTargetsWithState(profile = {}) {
  return calculateNutritionTargets(profile)
}

function calculateDailyNutritionState(nutritionLogs, profile, timeZone = 'UTC', targetDate = null) {
  const targetDay = targetDate || dayKeyFromDate(new Date(), timeZone)
  const days = aggregateNutritionByDay(nutritionLogs, timeZone)
  const totals = days.get(targetDay) || {
    date: targetDay,
    calories: 0,
    protein_g: 0,
    carbohydrates_g: 0,
    fats_g: 0,
    fiber_g: 0,
    meals_logged: 0,
  }
  const targets = calculateNutritionTargetsWithState(profile)

  function pct(current, target) {
    if (!targets.available || !target) return null
    return Math.round((current / target) * 100)
  }

  return {
    date: targetDay,
    totals,
    targets,
    percentages: {
      calories: pct(totals.calories, targets.calories),
      protein_g: pct(totals.protein_g, targets.protein_g),
      carbohydrates_g: pct(totals.carbohydrates_g, targets.carbohydrates_g),
      fats_g: pct(totals.fats_g, targets.fats_g),
    },
    meals_logged: totals.meals_logged,
  }
}

async function predictNutritionSignal(profile, dailyState, recentDays = []) {
  if (!dailyState.targets.available || recentDays.length < 7) {
    return {
      available: false,
      reason: recentDays.length < 7 ? 'not-enough-history' : 'profile-incomplete',
    }
  }

  const adherenceDays = recentDays.filter((day) => {
    const caloriePct = day.calorie_target > 0 ? day.calories / day.calorie_target : 0
    const proteinPct = day.protein_target > 0 ? day.protein_g / day.protein_target : 0
    return day.meals_logged >= 2 && caloriePct >= 0.8 && caloriePct <= 1.15 && proteinPct >= 0.8
  }).length

  const loggedDays = recentDays.filter((day) => day.meals_logged > 0).length
  const adherencePct = recentDays.length ? (adherenceDays / recentDays.length) * 100 : 0

  try {
    const result = await predictNutritionAdherence({
      age: profile.age,
      weight_kg: profile.weight_kg,
      height_cm: profile.height_cm,
      workout_days_per_week: profile.workout_days_per_week,
      primary_goal: profile.primary_goal,
      logging_consistency: recentDays.length ? (loggedDays / recentDays.length) * 100 : 0,
      average_calorie_adherence: recentDays.reduce((sum, day) => sum + Math.min(day.calorie_target > 0 ? (day.calories / day.calorie_target) * 100 : 0, 150), 0) / recentDays.length,
      average_protein_adherence: recentDays.reduce((sum, day) => sum + Math.min(day.protein_target > 0 ? (day.protein_g / day.protein_target) * 100 : 0, 150), 0) / recentDays.length,
      recent_days: recentDays.length,
      adherence_rate: adherencePct,
    })
    return {
      available: true,
      ...result,
      historical_adherence_percentage: Number(adherencePct.toFixed(1)),
      note: 'Prediction is a behavioral signal from logged history, not a medical forecast.',
    }
  } catch (error) {
    return {
      available: false,
      reason: 'ml-service-unavailable',
      error: error.message,
    }
  }
}

function buildNutritionActions(profile, dailyState, recentDays = []) {
  const actions = []
  const targets = dailyState.targets
  if (!targets.available) {
    actions.push({
      type: 'profile-completion',
      priority: 1,
      title: 'Complete your profile',
      message: 'Add age, height and weight so FitZone can calculate a personalized nutrition target.',
    })
    return actions
  }

  const proteinPct = dailyState.percentages.protein_g || 0
  const caloriePct = dailyState.percentages.calories || 0
  if (dailyState.meals_logged === 0) {
    actions.push({ type: 'log-meal', priority: 1, title: 'Start today\'s nutrition log', message: 'Add your first meal so FitZone can compare your intake with your current goal.' })
  } else if (proteinPct < 70) {
    actions.push({ type: 'protein-gap', priority: 1, title: 'Close the protein gap', message: `You are at ${Math.round(dailyState.totals.protein_g)}g protein today against a ${Math.round(targets.protein_g)}g planning target.` })
  } else if (caloriePct < 60 && dailyState.meals_logged >= 2) {
    actions.push({ type: 'energy-gap', priority: 2, title: 'Review your energy intake', message: `You are at ${Math.round(dailyState.totals.calories)} kcal today. Your current planning target is ${Math.round(targets.calories)} kcal.` })
  } else {
    actions.push({ type: 'consistency', priority: 3, title: 'Keep the pattern consistent', message: 'Your logged intake is giving FitZone a useful signal. Keep recording meals before making changes to targets.' })
  }

  const recentLoggedDays = recentDays.filter((day) => day.meals_logged > 0).length
  if (recentDays.length >= 7 && recentLoggedDays < Math.ceil(recentDays.length * 0.5)) {
    actions.push({ type: 'logging-consistency', priority: 2, title: 'Improve logging consistency', message: `Nutrition is logged on ${recentLoggedDays} of the last ${recentDays.length} days.` })
  }
  return actions.sort((a, b) => a.priority - b.priority)
}

function buildNutritionHistory(nutritionLogs, profile, timeZone = 'UTC', rangeDays = 28, now = new Date()) {
  const safeRange = Math.min(Math.max(Number(rangeDays) || 28, 7), 365)
  const todayKey = dayKeyFromDate(now, timeZone)
  const todayDate = new Date(`${todayKey}T12:00:00Z`)
  const start = new Date(todayDate)
  start.setUTCDate(start.getUTCDate() - (safeRange - 1))
  const startKey = start.toISOString().slice(0, 10)
  const dayKeys = enumerateDays(startKey, todayKey)
  const grouped = aggregateNutritionByDay(nutritionLogs, timeZone)
  const targets = calculateNutritionTargets(profile)

  return dayKeys.map((day) => {
    const row = grouped.get(day) || { date: day, calories: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0, meals_logged: 0 }
    return {
      ...row,
      calorie_target: targets.available ? targets.calories : null,
      protein_target: targets.available ? targets.protein_g : null,
      calorie_percentage: targets.available && targets.calories ? Math.round((row.calories / targets.calories) * 100) : null,
      protein_percentage: targets.available && targets.protein_g ? Math.round((row.protein_g / targets.protein_g) * 100) : null,
      has_data: row.meals_logged > 0,
    }
  })
}

async function buildNutritionIntelligence({ profile, nutritionLogs, timeZone = 'UTC', rangeDays = 28 }) {
  const targets = calculateNutritionTargets(profile)
  const history = buildNutritionHistory(nutritionLogs, profile, timeZone, rangeDays)
  const today = history[history.length - 1] || calculateDailyNutritionState(nutritionLogs, profile, timeZone)
  const mlSignal = await predictNutritionSignal(profile, { targets }, history.slice(-30))
  const actions = buildNutritionActions(profile, {
    ...calculateDailyNutritionState(nutritionLogs, profile, timeZone),
    targets,
  }, history.slice(-30))

  return {
    status: 'success',
    time_zone: timeZone,
    targets,
    today: calculateDailyNutritionState(nutritionLogs, profile, timeZone),
    history,
    ml_signal: mlSignal,
    actions,
    methodology: {
      nutrient_values: 'Food composition lookup + deterministic quantity normalization',
      target_calculation: targets.method,
      ml: 'Behavioral nutrition-adherence prediction is only enabled after sufficient logged history.',
    },
  }
}

module.exports = {
  dayKeyFromDate,
  aggregateNutritionByDay,
  calculateDailyNutritionState,
  buildNutritionHistory,
  buildNutritionActions,
  buildNutritionIntelligence,
}
