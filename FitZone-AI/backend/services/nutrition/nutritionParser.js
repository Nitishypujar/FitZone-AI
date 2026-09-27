const { findFood, normalizeText, serializeFood } = require('./foodKnowledge')

const WORD_NUMBERS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  half: 0.5,
  onehalf: 1.5,
}

const UNIT_GRAMS = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  litre: 1000,
  liter: 1000,
  l: 1000,
}

const HOUSEHOLD_UNITS = {
  piece: 1,
  pieces: 1,
  pc: 1,
  pcs: 1,
  slice: 1,
  slices: 1,
  cup: 1,
  cups: 1,
  bowl: 1,
  bowls: 1,
  glass: 1,
  glasses: 1,
  tbsp: 1,
  tablespoon: 1,
  tablespoons: 1,
  tsp: 1,
  teaspoon: 1,
  teaspoons: 1,
  handful: 1,
  medium: 1,
  large: 1,
  small: 1,
  plate: 1,
  plates: 1,
  serving: 1,
  servings: 1,
  scoop: 1,
}

const SIZE_MULTIPLIERS = {
  small: 0.82,
  medium: 1,
  large: 1.25,
}

function numberFromToken(token) {
  const normalized = String(token || '').toLowerCase().replace(/-/g, '')
  if (Object.prototype.hasOwnProperty.call(WORD_NUMBERS, normalized)) return WORD_NUMBERS[normalized]
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
}

function splitFragments(text = '') {
  return String(text)
    .replace(/\s+(?:with|plus|and)\s+/gi, ',')
    .split(/[\n,;|]+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
}

function detectMealType(text = '', fallback = 'Breakfast') {
  const normalized = normalizeText(text)
  if (/\blunch\b/.test(normalized)) return 'Lunch'
  if (/\bdinner\b/.test(normalized)) return 'Dinner'
  if (/\bsnack\b/.test(normalized)) return 'Snack'
  if (/\bbreakfast\b/.test(normalized)) return 'Breakfast'
  return fallback
}

function parseQuantity(fragment, food) {
  const normalized = normalizeText(fragment)
  let quantity = null
  let unit = null
  let size = null
  let grams = null

  const explicitWeight = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|kilograms?|g|grams?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)\b/i)
  if (explicitWeight) {
    quantity = Number(explicitWeight[1])
    unit = explicitWeight[2].toLowerCase()
    grams = quantity * UNIT_GRAMS[unit]
  }

  if (grams === null) {
    const sizeMatch = normalized.match(/\b(small|medium|large)\b/)
    if (sizeMatch) {
      size = sizeMatch[1]
      unit = size
    }

    const quantityMatch = normalized.match(/\b(\d+(?:\.\d+)?|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/)
    if (quantityMatch) {
      quantity = numberFromToken(quantityMatch[1])
    }

    const unitPattern = new RegExp(`\\b(${Object.keys(HOUSEHOLD_UNITS).sort((a, b) => b.length - a.length).join('|')})\\b`, 'i')
    const unitMatch = normalized.match(unitPattern)
    if (unitMatch) unit = unitMatch[1].toLowerCase()

    if (quantity === null) quantity = 1

    const baseGrams = Number(food.default_grams || 100)
    let perUnit = baseGrams

    if (unit && Object.prototype.hasOwnProperty.call(UNIT_GRAMS, unit)) {
      perUnit = quantity * UNIT_GRAMS[unit]
      grams = perUnit
    } else if (unit && food.default_unit && unit === String(food.default_unit).toLowerCase()) {
      grams = quantity * baseGrams
    } else if (unit && SIZE_MULTIPLIERS[unit]) {
      const sizeMultiplier = SIZE_MULTIPLIERS[unit]
      grams = quantity * baseGrams * sizeMultiplier
    } else {
      grams = quantity * baseGrams
    }
  }

  if (!Number.isFinite(grams) || grams <= 0) grams = Number(food.default_grams || 100)

  return {
    quantity: Number(quantity || 1),
    unit: unit || food.default_unit || 'serving',
    size,
    grams: Number(grams.toFixed(1)),
  }
}

function calculateItem(food, quantityInfo) {
  const factor = quantityInfo.grams / 100
  return {
    calories: Number((food.kcal * factor).toFixed(1)),
    protein_g: Number((food.protein_g * factor).toFixed(1)),
    carbohydrates_g: Number((food.carbs_g * factor).toFixed(1)),
    fats_g: Number((food.fat_g * factor).toFixed(1)),
    fiber_g: Number((food.fiber_g * factor).toFixed(1)),
  }
}

function estimateConfidence(food, quantityInfo, fragment) {
  const hasExplicitWeight = /\b\d+(?:\.\d+)?\s*(kg|kilograms?|g|grams?|ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)\b/i.test(fragment)
  const hasExplicitServing = /\b\d+(?:\.\d+)?\b/.test(fragment) || /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/i.test(fragment)
  const defaultedQuantity = !hasExplicitWeight && !hasExplicitServing

  if (food.category === 'mixed meal' || /curry|biryani|chutney|samosa/i.test(food.name)) return 'medium'
  if (hasExplicitWeight) return 'high'
  if (!defaultedQuantity && quantityInfo.unit !== food.default_unit) return 'medium'
  return 'medium'
}

function analyzeFoodText(text, mealType = null) {
  const raw = String(text || '').trim()
  if (!raw) {
    return {
      status: 'success',
      can_save: false,
      meal_type: mealType || 'Breakfast',
      items: [],
      unmatched_items: [],
      totals: { calories: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0 },
      confidence: 'low',
      needs_review: true,
      message: 'Enter at least one food with a quantity or serving description.',
    }
  }

  const fragments = splitFragments(raw)
  const items = []
  const unmatchedItems = []

  for (const fragment of fragments) {
    const food = findFood(fragment)
    if (!food) {
      unmatchedItems.push(fragment)
      continue
    }

    const quantityInfo = parseQuantity(fragment, food)
    const nutrients = calculateItem(food, quantityInfo)
    const confidence = estimateConfidence(food, quantityInfo, fragment)

    items.push({
      food: serializeFood(food),
      source_food_id: food.id,
      original_text: fragment,
      ...quantityInfo,
      nutrients,
      confidence,
    })
  }

  const totals = items.reduce((acc, item) => {
    for (const key of Object.keys(acc)) acc[key] += Number(item.nutrients[key] || 0)
    return acc
  }, { calories: 0, protein_g: 0, carbohydrates_g: 0, fats_g: 0, fiber_g: 0 })

  for (const key of Object.keys(totals)) totals[key] = Number(totals[key].toFixed(1))

  const confidenceRank = { low: 1, medium: 2, high: 3 }
  const minimumConfidence = items.reduce((current, item) => {
    return confidenceRank[item.confidence] < confidenceRank[current] ? item.confidence : current
  }, 'high')

  const mealName = items.length > 0
    ? items.map((item) => `${item.quantity}${item.unit ? ` ${item.unit}` : ''} ${item.food.name}`).join(', ')
    : raw

  return {
    status: 'success',
    can_save: items.length > 0 && unmatchedItems.length === 0,
    meal_type: mealType || detectMealType(raw),
    original_text: raw,
    meal_name: mealName.slice(0, 120),
    items,
    unmatched_items: unmatchedItems,
    totals,
    confidence: items.length ? minimumConfidence : 'low',
    needs_review: unmatchedItems.length > 0 || items.some((item) => item.confidence !== 'high'),
    message: unmatchedItems.length
      ? `I could not confidently identify: ${unmatchedItems.join(', ')}. Add a more specific food or use the manual editor.`
      : items.some((item) => item.confidence !== 'high')
        ? 'Nutrition is calculated from the matched reference foods, but some portions are estimates. Review quantities before saving.'
        : 'Nutrition calculated from the matched reference foods and normalized quantities.',
  }
}

module.exports = {
  analyzeFoodText,
  parseQuantity,
  detectMealType,
}
