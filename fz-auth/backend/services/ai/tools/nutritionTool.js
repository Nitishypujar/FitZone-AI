function getTodayDate() {
    const now = new Date()
  
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
  
    return `${year}-${month}-${day}`
  }
  
  
  async function getTodayNutrition(supabase, userId) {
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
  
    if (!userId) {
      throw new Error('User ID is required')
    }
  
    const today = getTodayDate()
  
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select(
        'id, meal_type, meal_name, calories, protein_g, carbohydrates_g, fats_g, logged_at'
      )
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lt('logged_at', `${today}T23:59:59.999`)
      .order('logged_at', { ascending: true })
  
    if (error) {
      throw new Error(
        `Unable to retrieve today's nutrition: ${error.message}`
      )
    }
  
    const meals = data || []
  
    const totals = meals.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories || 0)
        acc.protein_g += Number(meal.protein_g || 0)
        acc.carbohydrates_g += Number(
          meal.carbohydrates_g || 0
        )
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
  
    return {
      date: today,
      meals_logged: meals.length,
      totals,
      meals,
    }
  }
  
  
  module.exports = {
    getTodayNutrition,
  }