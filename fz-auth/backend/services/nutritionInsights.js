function generateNutritionInsight(totals, targets, profile) {
    const calories = Number(totals.calories || 0)
    const protein = Number(totals.protein_g || 0)
    const carbs = Number(totals.carbohydrates_g || 0)
    const fats = Number(totals.fats_g || 0)
  
    const calorieTarget = Number(targets.calories || 0)
    const proteinTarget = Number(targets.protein_g || 0)
    const carbTarget = Number(targets.carbohydrates_g || 0)
    const fatTarget = Number(targets.fats_g || 0)
  
    const remainingCalories = Math.max(calorieTarget - calories, 0)
    const proteinRemaining = Math.max(proteinTarget - protein, 0)
  
    const goal = (profile.primary_goal || '').toLowerCase()
  
    if (calories === 0) {
      return {
        type: 'start',
        title: 'Ready to fuel your day?',
        message: `You have not logged any meals yet. Your personalized target is ${calorieTarget} kcal with ${proteinTarget}g of protein today.`,
        remaining_calories: calorieTarget,
        protein_remaining_g: proteinTarget,
      }
    }
  
    if (protein < proteinTarget * 0.6 && calories < calorieTarget * 0.8) {
      return {
        type: 'protein',
        title: 'Focus on protein',
        message: `You have ${proteinRemaining}g of protein remaining. Consider a protein-rich meal while keeping your calories within your remaining ${remainingCalories} kcal.`,
        remaining_calories: remainingCalories,
        protein_remaining_g: proteinRemaining,
      }
    }
  
    if (calories >= calorieTarget) {
      return {
        type: 'calories',
        title: 'Daily calorie target reached',
        message: `You have reached approximately ${calorieTarget} kcal for today. If you eat more, keep portions and your overall goal in mind.`,
        remaining_calories: 0,
        protein_remaining_g: proteinRemaining,
      }
    }
  
    if (goal.includes('lose') || goal.includes('weight') || goal.includes('fat')) {
      return {
        type: 'weight-loss',
        title: 'Stay consistent',
        message: `You have about ${remainingCalories} kcal remaining today. Keep your next meal balanced and prioritize protein and whole foods.`,
        remaining_calories: remainingCalories,
        protein_remaining_g: proteinRemaining,
      }
    }
  
    if (
      goal.includes('muscle') ||
      goal.includes('build') ||
      goal.includes('strength')
    ) {
      return {
        type: 'muscle-gain',
        title: 'Support your training',
        message: `You have about ${remainingCalories} kcal and ${proteinRemaining}g of protein remaining. A balanced protein-rich meal can help support your training goals.`,
        remaining_calories: remainingCalories,
        protein_remaining_g: proteinRemaining,
      }
    }
  
    return {
      type: 'general',
      title: 'Keep building consistency',
      message: `You have about ${remainingCalories} kcal remaining today. Aim for balanced meals and keep tracking consistently.`,
      remaining_calories: remainingCalories,
      protein_remaining_g: proteinRemaining,
    }
  }
  
  module.exports = {
    generateNutritionInsight,
  }