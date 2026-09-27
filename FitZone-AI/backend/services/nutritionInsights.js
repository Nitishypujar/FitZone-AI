function generateNutritionInsight(totals = {}, targets = {}, profile = {}) {
  const calories = Number(totals.calories || 0)
  const protein = Number(totals.protein_g || 0)
  const calorieTarget = Number(targets.calories || 0)
  const proteinTarget = Number(targets.protein_g || 0)
  const remainingCalories = calorieTarget > 0 ? Math.max(calorieTarget - calories, 0) : null
  const proteinRemaining = proteinTarget > 0 ? Math.max(proteinTarget - protein, 0) : null

  if (!targets.available) {
    return {
      type: 'profile-completion',
      title: 'Complete your nutrition profile',
      message: 'Add your age, height and weight in Profile to unlock FitZone’s personalized nutrition planning.',
      remaining_calories: null,
      protein_remaining_g: null,
    }
  }

  const goal = String(profile.primary_goal || '').toLowerCase()

  if (calories === 0) {
    return {
      type: 'start',
      title: 'Start today’s nutrition record',
      message: `No meals are logged yet. Your current planning target is ${calorieTarget} kcal with ${proteinTarget}g protein.`,
      remaining_calories: calorieTarget,
      protein_remaining_g: proteinTarget,
    }
  }

  if (protein < proteinTarget * 0.6 && calories < calorieTarget * 0.8) {
    return {
      type: 'protein',
      title: 'Protein is the clearest gap',
      message: `You have about ${proteinRemaining}g protein remaining. A protein-rich meal can help close the gap while you stay aware of the remaining ${remainingCalories} kcal.`,
      remaining_calories: remainingCalories,
      protein_remaining_g: proteinRemaining,
    }
  }

  if (goal.includes('fat') || goal.includes('lose')) {
    return {
      type: 'goal-aware',
      title: 'Keep the day balanced',
      message: `You have about ${remainingCalories} kcal remaining. Prioritize foods that are filling and nutrient-dense, and keep portions aligned with your current goal.`,
      remaining_calories: remainingCalories,
      protein_remaining_g: proteinRemaining,
    }
  }

  if (goal.includes('muscle') || goal.includes('strength') || goal.includes('gain')) {
    return {
      type: 'training-support',
      title: 'Support your training',
      message: `You have about ${remainingCalories} kcal and ${proteinRemaining}g protein remaining against today’s planning target.`,
      remaining_calories: remainingCalories,
      protein_remaining_g: proteinRemaining,
    }
  }

  if (calories >= calorieTarget) {
    return {
      type: 'target-reached',
      title: 'Daily calorie target reached',
      message: `You are at approximately ${calories} kcal for today. Keep the rest of the day guided by your hunger, goal and overall pattern rather than chasing a perfect number.`,
      remaining_calories: 0,
      protein_remaining_g: proteinRemaining,
    }
  }

  return {
    type: 'consistency',
    title: 'Keep the pattern consistent',
    message: `You have about ${remainingCalories} kcal remaining. Keep logging meals so FitZone can learn your real pattern and make future recommendations more useful.`,
    remaining_calories: remainingCalories,
    protein_remaining_g: proteinRemaining,
  }
}

module.exports = {
  generateNutritionInsight,
}
