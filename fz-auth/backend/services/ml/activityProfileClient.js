const ACTIVITY_PROFILE_ML_SERVICE_URL =
  process.env.ACTIVITY_PROFILE_ML_SERVICE_URL ||
  'https://fitzone-ai-ml.onrender.com'

async function predictActivityProfile(features) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch(
      `${ACTIVITY_PROFILE_ML_SERVICE_URL.replace(/\/$/, '')}/predict/activity-profile`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(features),
        signal: controller.signal,
      }
    )

    const text = await response.text()

    if (!response.ok) {
      throw new Error(
        `Activity profile ML service error (${response.status}): ${text}`
      )
    }

    return JSON.parse(text)
  } finally {
    clearTimeout(timeout)
  }
}

module.exports = {
  predictActivityProfile,
}
