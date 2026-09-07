const { GoogleGenAI } = require('@google/genai')

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

const GEMINI_MODEL = 'gemini-3.8-flash'

async function generateGeminiResponse(prompt) {
  if (!prompt || !prompt.trim()) {
    throw new Error('Gemini prompt is required')
  }

  const interaction = await client.interactions.create({
    model: GEMINI_MODEL,
    input: prompt.trim(),
  })

  if (!interaction.output_text) {
    throw new Error('Gemini returned an empty response')
  }

  return interaction.output_text
}

module.exports = {
  generateGeminiResponse,
}