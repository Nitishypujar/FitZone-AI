const DEFAULT_ML_SERVICE_URL =
  'http://127.0.0.1:8000'

const ML_REQUEST_TIMEOUT_MS = Number(process.env.ML_REQUEST_TIMEOUT_MS || 2500)

function getMlServiceUrl() {
  return (
    process.env.ML_SERVICE_URL ||
    DEFAULT_ML_SERVICE_URL
  ).replace(/\/$/, '')
}


async function predictCompletion(features = {}) {
  const baseUrl = getMlServiceUrl()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ML_REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(
    `${baseUrl}/predict/completion`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
      },

      body: JSON.stringify({
        age: Number(features.age || 0),

        weight_kg:
          Number(
            features.weight_kg || 0
          ),

        height_cm:
          Number(
            features.height_cm || 0
          ),

        workout_days_per_week:
          Number(
            features.workout_days_per_week ||
              0
          ),

        preferred_workout_duration:
          Number(
            features.preferred_workout_duration ||
              0
          ),

        fitness_level:
          String(
            features.fitness_level ||
              'Beginner'
          ),

        primary_goal:
          String(
            features.primary_goal ||
              'General Fitness'
          ),

        adherence_percentage:
          Number(
            features.adherence_percentage ||
              0
          ),

        weekly_workout_progress:
          Number(
            features.weekly_workout_progress ||
              0
          ),

        weekly_minute_progress:
          Number(
            features.weekly_minute_progress ||
              0
          ),

        recent_sessions:
          Number(
            features.recent_sessions ||
              0
          ),

        recent_active_minutes:
          Number(
            features.recent_active_minutes ||
              0
          ),

        nutrition_available:
          Number(
            features.nutrition_available
              ? 1
              : 0
          ),

        calorie_percentage:
          Number(
            features.calorie_percentage ||
              0
          ),

        protein_percentage:
          Number(
            features.protein_percentage ||
              0
          ),

        readiness_score:
          Number(
            features.readiness_score ||
              0
          ),

        difficulty_preference:
          Number(
            features.difficulty_preference ||
              0
          ),

        recommendation_action:
          String(
            features.recommendation_action ||
              'follow-planned-workout'
          ),
      }),
    }
  )

  if (!response.ok) {
    const message =
      await response.text()

    throw new Error(
      `ML service returned ${response.status}: ${message}`
    )
  }

  const result =
    await response.json()

  if (
    result.status !== 'success'
  ) {
    throw new Error(
      'ML service returned an unsuccessful response.'
    )
  }

  return {
    completion_probability:
      Number(
        result.completion_probability || 0
      ),

    predicted_completion:
      Boolean(
        result.predicted_completion
      ),

    ml_enabled:
      Boolean(result.model_enabled === true),

    prediction_source:
      result.model_enabled === true ? 'trained_model' : 'cold_start',

    model_source:
      result.model_source ||
      null,

    training_samples:
      Number(
        result.training_samples || 0
      ),

    trained_at:
      result.trained_at ||
      null,
  }
  } finally {
    clearTimeout(timeout)
  }
}


async function getModelStatus() {
  const baseUrl =
    getMlServiceUrl()

  const response =
    await fetch(
      `${baseUrl}/model`
    )

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve ML model status: ${response.status}`
    )
  }

  return response.json()
}


async function trainCompletionModel(examples = []) {
  const baseUrl = getMlServiceUrl()

  const response = await fetch(
    `${baseUrl}/train`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ examples }),
    }
  )

  if (!response.ok) {
    const message = await response.text()
    throw new Error(
      `ML service returned ${response.status}: ${message}`
    )
  }

  const result = await response.json()

  if (result.status !== 'success') {
    throw new Error(
      'ML service returned an unsuccessful training response.'
    )
  }

  return result.model
}


module.exports = {
  predictCompletion,
  getModelStatus,
  trainCompletionModel,
}