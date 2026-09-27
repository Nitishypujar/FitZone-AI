function calculateNutritionTargets(profile = {}) {
  const age = Number(profile.age)
  const height = Number(profile.height_cm)
  const weight = Number(profile.weight_kg)
  const goal = String(profile.primary_goal || '').toLowerCase()

  if (!age || !height || !weight) {
    return {
      available: false,
      calories: null,
      protein_g: null,
      carbohydrates_g: null,
      fats_g: null,
      method: 'insufficient-profile-data',
      missing_fields: [
        !age ? 'age' : null,
        !height ? 'height_cm' : null,
        !weight ? 'weight_kg' : null,
      ].filter(Boolean),
    }
  }

  // Mifflin-St Jeor style planning estimate. No sex value is inferred;
  // FitZone uses a neutral constant and clearly presents this as a planning target.
  const bmr = 10 * weight + 6.25 * height - 5 * age - 78
  const workoutDays = Number(profile.workout_days_per_week) || 0

  let activityMultiplier = 1.2
  if (workoutDays >= 6) activityMultiplier = 1.725
  else if (workoutDays >= 4) activityMultiplier = 1.55
  else if (workoutDays >= 2) activityMultiplier = 1.375

  let calories = bmr * activityMultiplier
  if (goal.includes('lose') || goal.includes('fat')) calories *= 0.85
  else if (goal.includes('gain') || goal.includes('muscle') || goal.includes('strength')) calories *= 1.1

  calories = Math.max(1200, Math.round(calories))

  let proteinMultiplier = 1.4
  if (goal.includes('muscle') || goal.includes('strength') || goal.includes('gain')) proteinMultiplier = 1.6
  else if (goal.includes('fat') || goal.includes('lose')) proteinMultiplier = 1.6

  const protein = Math.round(weight * proteinMultiplier)
  const fats = Math.max(35, Math.round(weight * 0.8))
  const remainingCalories = Math.max(calories - protein * 4 - fats * 9, 0)
  const carbohydrates = Math.max(Math.round(remainingCalories / 4), 50)

  return {
    available: true,
    goal: profile.primary_goal || 'General Fitness',
    calories,
    protein_g: protein,
    carbohydrates_g: carbohydrates,
    fats_g: fats,
    method: 'personalized-planning-estimate',
    note: 'Planning estimate only. Food intake and body-weight trends should be reviewed over time; this is not medical advice.',
  }
}

module.exports = {
  calculateNutritionTargets,
}
