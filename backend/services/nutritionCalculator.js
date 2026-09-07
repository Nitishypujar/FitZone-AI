function calculateNutritionTargets(profile) {
    const age = Number(profile.age)
    const height = Number(profile.height_cm)
    const weight = Number(profile.weight_kg)
  
    if (!age || !height || !weight) {
      return {
        calories: 2000,
        protein_g: 120,
        carbohydrates_g: 225,
        fats_g: 65,
        method: 'default',
      }
    }
  
    // Mifflin-St Jeor base estimate without a sex assumption.
    // This uses a neutral midpoint estimate for application planning.
    const bmr = 10 * weight + 6.25 * height - 5 * age - 78
  
    const workoutDays = Number(profile.workout_days_per_week) || 3
  
    let activityMultiplier = 1.375
  
    if (workoutDays >= 6) {
      activityMultiplier = 1.725
    } else if (workoutDays >= 4) {
      activityMultiplier = 1.55
    } else if (workoutDays >= 2) {
      activityMultiplier = 1.375
    }
  
    let calories = bmr * activityMultiplier
  
    const goal = (profile.primary_goal || '').toLowerCase()
  
    if (
      goal.includes('lose') ||
      goal.includes('weight') ||
      goal.includes('fat')
    ) {
      calories *= 0.85
    } else if (
      goal.includes('muscle') ||
      goal.includes('build') ||
      goal.includes('strength')
    ) {
      calories *= 1.10
    }
  
    calories = Math.round(calories)
  
    const protein = Math.round(weight * 1.6)
    const fats = Math.round(weight * 0.8)
  
    const remainingCalories =
      calories - protein * 4 - fats * 9
  
    const carbohydrates = Math.max(
      Math.round(remainingCalories / 4),
      50
    )
  
    return {
      calories,
      protein_g: protein,
      carbohydrates_g: carbohydrates,
      fats_g: fats,
      method: 'personalized-estimate',
    }
  }
  
  module.exports = {
    calculateNutritionTargets,
  }