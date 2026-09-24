const { GoogleGenAI } = require('@google/genai')

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const GEMINI_MODEL = 'gemini-3.8-flash'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function generateGeminiResponse(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Gemini prompt is required')
  }

  const maxAttempts = 3

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const interaction = await client.interactions.create({
        model: GEMINI_MODEL,
        input: prompt.trim(),
      })

      if (!interaction.output_text) {
        throw new Error('Gemini returned an empty response')
      }

      return interaction.output_text
    } catch (error) {
      const statusCode =
        error?.statusCode ||
        error?.status ||
        error?.cause?.statusCode

      const errorCode =
        error?.error?.code ||
        error?.cause?.error?.code

      const isRateLimit =
        statusCode === 429 ||
        errorCode === 'too_many_requests' ||
        errorCode === 'rate_limit_exceeded' ||
        errorCode === 'quota_exceeded'

      if (!isRateLimit || attempt === maxAttempts) {
        throw error
      }

      const delay = Math.pow(2, attempt) * 1000

      console.log(
        `Gemini rate limit hit. Retrying in ${delay / 1000}s...`
      )

      await sleep(delay)
    }
  }

  throw new Error('Gemini request failed')
}

module.exports = {
  generateGeminiResponse,
}