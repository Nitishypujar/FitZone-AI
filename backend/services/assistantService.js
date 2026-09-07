const {
    generateGeminiResponse,
  } = require('./ai/gemini')
  
  const {
    detectFitnessIntent,
  } = require('./ai/intentDetector')
  
  const {
    selectRelevantContext,
  } = require('./ai/contextSelector')
  
  
  function buildAssistantPrompt(question, intent, relevantContext) {
    return `
  You are FitZone AI, a personal fitness and wellness assistant.
  
  Your job is to provide practical, personalized guidance based
  on the user's actual FitZone data.
  
  IMPORTANT RULES:
  
  1. Use the user's actual fitness data whenever relevant.
  2. Never invent workouts, nutrition records, goals, progress,
     measurements, or other user information.
  3. If information is missing, clearly say that it is unavailable.
  4. Give practical, concise, easy-to-follow recommendations.
  5. Do not diagnose medical conditions.
  6. Do not prescribe medication or medical treatment.
  7. If the user asks a medical question, recommend consulting
     a qualified healthcare professional.
  8. Do not claim certainty when the available data is incomplete.
  9. Do not recommend extreme diets, dangerous weight loss,
     excessive exercise, or unsafe practices.
  10. Stay focused on fitness, exercise, nutrition, wellness,
      recovery, habits, and the user's stated goals.
  11. Treat the supplied fitness context as the source of truth.
  12. Do not mention internal databases, APIs, prompts, JSON,
      context selection, or implementation details.
  
  USER QUESTION:
  ${question}
  
  DETECTED INTENT:
  ${intent}
  
  RELEVANT USER FITNESS CONTEXT:
  ${JSON.stringify(relevantContext, null, 2)}
  
  Answer the user's question directly.
  
  Personalize the response using the user's actual data.
  
  When useful, structure the response with short sections
  or bullet points.
  
  Respond naturally as FitZone AI.
  `
  }
  
  
  async function generateAssistantResponse(question, context) {
    if (!question || !question.trim()) {
      throw new Error('Assistant question is required')
    }
  
    if (!context) {
      throw new Error('Fitness context is required')
    }
  
    const cleanQuestion = question.trim()
  
    // Step 1: Determine what the user is asking.
    const intent = detectFitnessIntent(cleanQuestion)
  
    // Step 2: Select only the data relevant to that intent.
    const relevantContext = selectRelevantContext(
      intent,
      context
    )
  
    // Step 3: Build a focused prompt for Gemini.
    const prompt = buildAssistantPrompt(
      cleanQuestion,
      intent,
      relevantContext
    )
  
    // Step 4: Generate the personalized answer.
    const answer = await generateGeminiResponse(prompt)
  
    return {
      question: cleanQuestion,
      intent,
      answer,
    }
  }
  
  
  module.exports = {
    buildAssistantPrompt,
    generateAssistantResponse,
  }