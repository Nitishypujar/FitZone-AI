const catalog = require('../../data/foods.json')

function normalizeText(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s.-]/gu, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const entries = catalog.foods.map((food) => ({
  ...food,
  normalized_name: normalizeText(food.name),
  normalized_aliases: [food.name, ...(food.aliases || [])].map(normalizeText),
}))

const aliasIndex = new Map()
for (const food of entries) {
  for (const alias of food.normalized_aliases) {
    if (alias) aliasIndex.set(alias, food)
  }
}

function findFood(text = '') {
  const normalized = normalizeText(text)
  if (!normalized) return null

  if (aliasIndex.has(normalized)) return aliasIndex.get(normalized)

  const candidates = entries
    .filter((food) => food.normalized_aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized)))
    .sort((a, b) => {
      const aExact = a.normalized_aliases.some((alias) => normalized.includes(alias)) ? 0 : 1
      const bExact = b.normalized_aliases.some((alias) => normalized.includes(alias)) ? 0 : 1
      if (aExact !== bExact) return aExact - bExact
      return b.normalized_name.length - a.normalized_name.length
    })

  return candidates[0] || null
}

function searchFoods(query = '', limit = 12) {
  const normalized = normalizeText(query)
  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 25)

  const scored = entries.map((food) => {
    if (!normalized) return { food, score: 0 }
    const tokens = normalized.split(' ')
    const haystack = [food.normalized_name, ...food.normalized_aliases].join(' ')
    let score = 0
    if (food.normalized_name === normalized) score += 100
    if (food.normalized_aliases.includes(normalized)) score += 90
    if (haystack.includes(normalized)) score += 50
    for (const token of tokens) {
      if (token && haystack.includes(token)) score += 8
    }
    return { food, score }
  })

  return scored
    .filter((entry) => !normalized || entry.score > 0)
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, safeLimit)
    .map(({ food }) => serializeFood(food))
}

function serializeFood(food) {
  if (!food) return null
  return {
    id: food.id,
    name: food.name,
    aliases: food.aliases,
    category: food.category,
    preparation: food.preparation,
    per_100g: {
      calories: food.kcal,
      protein_g: food.protein_g,
      carbohydrates_g: food.carbs_g,
      fats_g: food.fat_g,
      fiber_g: food.fiber_g,
    },
    default_unit: food.default_unit,
    default_grams: food.default_grams,
    source: 'FitZone reference catalog',
  }
}

module.exports = {
  catalog,
  entries,
  normalizeText,
  findFood,
  searchFoods,
  serializeFood,
}
