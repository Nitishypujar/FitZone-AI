const { dayKeyFromDate } = require('../../nutrition/nutritionIntelligence')

function getTodayDate(timeZone = 'UTC') {
  return dayKeyFromDate(new Date(), timeZone)
}

async function getTodayNutrition(supabase, userId, timeZone = 'UTC') {
  if (!supabase) throw new Error('Supabase client is required')
  if (!userId) throw new Error('User ID is required')

  const { data, error } = await supabase
    .from('nutrition_logs')
    .select('id, meal_type, meal_name, calories, protein_g, carbohydrates_g, fats_g, fiber_g, logged_at, nutrition_confidence, entry_source')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true })
    .limit(250)

  if (error) throw new Error(`Unable to retrieve today's nutrition: ${error.message}`)

  const today = getTodayDate(timeZone)
  const meals = (data || []).filter((meal) => dayKeyFromDate(meal.logged_at, timeZone) === today)
  const totals = meals.reduce((acc, meal) => {
    acc.calories += Number(meal.calories || 0)
    acc.protein_g += Number(meal.protein_g || 0)
    acc.carbohydrates_g += Number(meal.carbohydrates_g || 0)
    acc.fats_g += Number(meal.fats_g || 0)
    acc.fiber_g += Number(meal.fiber_g || 0)
    return acc
  }, { calories: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0 })

  return { date: today, time_zone: timeZone, meals_logged: meals.length, totals, meals }
}

module.exports = { getTodayNutrition, getTodayDate }
