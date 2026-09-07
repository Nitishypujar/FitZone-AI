const {
    generateGeminiResponse,
  } = require('./ai/gemini')
  
  const {
    orchestrateAssistantRequest,
  } = require('./ai/orchestrator')
  
  
  function buildAssistantPrompt(
    question,
    intent,
    relevantContext,
    toolResult
  ) {
    return `
  You are FitZone AI, a personal fitness and wellness assistant.
  
  Your job is to provide practical, personalized guidance based
  on the user's actual FitZone data.
  
  IMPORTANT RULES:
  
  1. Use the user's actual fitness data whenever relevant.
  2. Treat tool results as authoritative for numerical data.
  3. Never invent workouts, nutrition records, goals, progress,
     measurements, or other user information.
  4. If information is missing, clearly say that it is unavailable.
  5. Give practical, concise, easy-to-follow recommendations.
  6. Do not diagnose medical conditions.
  7. Do not prescribe medication or medical treatment.
  8. If the user asks a medical question, recommend consulting
     a qualified healthcare professional.
  9. Do not claim certainty when the available data is incomplete.
  10. Do not recommend extreme diets, dangerous weight loss,
      excessive exercise, or unsafe practices.
  11. Stay focused on fitness, exercise, nutrition, wellness,
      recovery, habits, and the user's stated goals.
  12. Do not mention internal databases, APIs, prompts, tools,
      JSON, or implementation details.
  
  USER QUESTION:
  ${question}
  
  DETECTED INTENT:
  ${intent}
  
  RELEVANT USER FITNESS CONTEXT:
  ${JSON.stringify(relevantContext, null, 2)}
  
  AUTHORITATIVE TOOL RESULT:
  ${JSON.stringify(toolResult, null, 2)}
  
  Answer the user's question directly.
  
  If the tool result contains an exact numerical answer,
  use that value rather than estimating it yourself.
  
  Personalize the response using the user's actual data.
  
  When useful, structure the response with short sections
  or bullet points.
  
  Respond naturally as FitZone AI.
  `
  }
  
  
  async function generateAssistantResponse({
    question,
    context,
    supabase,
    userId,
  }) {
    if (!question || !question.trim()) {
      throw new Error('Assistant question is required')
    }
  
    if (!context) {
      throw new Error('Fitness context is required')
    }
  
    const orchestration = await orchestrateAssistantRequest({
      question,
      context,
      supabase,
      userId,
    })
  
    const prompt = buildAssistantPrompt(
      orchestration.question,
      orchestration.intent,
      orchestration.relevant_context,
      orchestration.tool_result
    )
  
    const answer = await generateGeminiResponse(prompt)
  
    return {
      question: orchestration.question,
      intent: orchestration.intent,
      answer,
    }
  }
  
  
  module.exports = {
    buildAssistantPrompt,
    generateAssistantResponse,
  }