const { GoogleGenAI } = require('@google/genai')
const { sanitizeAssistantResponse } = require('./assistantFormatter')

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const GEMINI_MODEL = 'gemini-3.8-flash'
const MAX_ATTEMPTS = 2
const REQUEST_TIMEOUT_MS = 20000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function generateGeminiResponse(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Gemini prompt is required')
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let timeoutId

    try {
      const interactionPromise = client.interactions.create({
        model: GEMINI_MODEL,
        input: prompt.trim(),
        generation_config: {
          thinking_level: 'low',
          temperature: 0.25,
        },
      })

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('FitZone AI response timed out'))
        }, REQUEST_TIMEOUT_MS)
      })

      const interaction = await Promise.race([
        interactionPromise,
        timeoutPromise,
      ])

      const raw = interaction?.output_text

      if (!raw) {
        throw new Error('Gemini returned an empty response')
      }

      return sanitizeAssistantResponse(raw)
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

      const isServerOrNetworkRetryable =
        statusCode >= 500 ||
        /timed out|timeout|temporarily unavailable|fetch failed/i.test(error?.message || '')

      // A quota/rate-limit response should fall back immediately rather than
      // spending another request and making the assistant feel frozen.
      if ((!isServerOrNetworkRetryable && isRateLimit) ||
          (!isServerOrNetworkRetryable) ||
          attempt === MAX_ATTEMPTS) {
        throw error
      }

      const delay = attempt * 450
      console.log(
        `Gemini retryable error. Retrying in ${delay}ms...`,
      )
      await sleep(delay)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }

  throw new Error('Gemini request failed')
}

module.exports = {
  generateGeminiResponse,
}
