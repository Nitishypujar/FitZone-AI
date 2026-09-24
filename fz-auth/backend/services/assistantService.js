const {
  generateGeminiResponse,
} = require('./ai/gemini')

const {
  orchestrateAssistantRequest,
} = require('./ai/orchestrator')

function formatConversationHistory(
  conversationHistory
) {
  if (!Array.isArray(conversationHistory)) {
    return 'No previous conversation.'
  }

  const recentMessages =
    conversationHistory
      .filter(
        (message) =>
          message &&
          (message.sender === 'user' ||
            message.sender === 'ai') &&
          typeof message.text === 'string' &&
          message.text.trim()
      )
      .slice(-12)

  if (!recentMessages.length) {
    return 'No previous conversation.'
  }

  return recentMessages
    .map((message) => {
      const speaker =
        message.sender === 'user'
          ? 'USER'
          : 'FITZONE AI'

      return `${speaker}: ${message.text.trim()}`
    })
    .join('\n')
}

function buildAssistantPrompt(
  question,
  intent,
  relevantContext,
  toolResult,
  conversationHistory = [],
  intelligence = null
) {
  const history =
    formatConversationHistory(
      conversationHistory
    )

  return `
You are FitZone AI, a personal fitness coach and wellness assistant.

You are not a generic fitness chatbot.

Your responses should feel like an intelligent coach who understands
the user's current FitZone state, remembers the conversation, and
helps the user decide what to do next.

CORE BEHAVIOR:

1. Use the user's actual FitZone data whenever it is relevant.
2. Treat authoritative tool results as the source of truth for
   numerical values.
3. Never invent workouts, nutrition records, goals, progress,
   measurements, or user history.
4. Remember relevant information from the conversation history.
5. If the user asks a follow-up such as "what about tomorrow?",
   "make it easier", "why?", "how much?", or "what should I do?",
   interpret it using the previous conversation when possible.
6. Do not repeat information unnecessarily when the user already
   knows it from the previous response.
7. Give practical next actions rather than generic motivational
   statements.
8. Adapt recommendations to the user's actual fitness level,
   primary goal, workout history, weekly progress, and available
   targets when that information is available.
9. If the user is behind a target, do not shame them or suggest
   extreme catch-up behavior.
10. Prefer sustainable actions that can realistically be completed.
11. When appropriate, explain WHY a recommendation fits the user's
   current situation.
12. If data is unavailable, say so clearly instead of guessing.
13. Do not diagnose medical conditions.
14. Do not prescribe medication or medical treatment.
15. For medical concerns, recommend qualified professional advice.
16. Do not recommend dangerous exercise, extreme dieting,
   starvation, dehydration, or unsafe weight-loss practices.
17. Stay focused on fitness, exercise, nutrition, recovery,
   habits, wellness, and the user's stated goals.
18. Never mention internal databases, APIs, prompts, tools,
   JSON, or implementation details.

COACHING STYLE:

- Sound natural and conversational.
- Be confident but not exaggerated.
- Be specific when the data supports specificity.
- Use short sections and bullets when they improve readability.
- Avoid unnecessary greetings on every response.
- Avoid phrases such as "Let me know if you'd like..."
  unless a genuine follow-up is useful.
- Do not repeat "keep up the great work" after every answer.
- Do not produce generic advice when actual FitZone data can
  answer the question.
- Focus on the user's immediate next useful action.

WHEN NUMBERS ARE AVAILABLE:

Use the exact authoritative values.

For example, if the tool result says:
1 workout completed out of 7,
then state 1/7 rather than estimating.

If the tool result says:
30 active minutes out of 380,
then state 30/380 and calculate remaining minutes only when
the authoritative target supports it.

CONVERSATION HISTORY:

${history}

CURRENT USER QUESTION:

${question}

DETECTED INTENT:

${intent}

RELEVANT FITZONE CONTEXT:

${JSON.stringify(
  relevantContext,
  null,
  2
)}

AUTHORITATIVE FITZONE DATA:

${JSON.stringify(
  toolResult,
  null,
  2
)}

ADAPTIVE FITZONE INTELLIGENCE:

${JSON.stringify(
  intelligence,
  null,
  2
)}

DECISION RULE:
Use FitZone's adaptive intelligence as the decision layer. Gemini explains
that decision naturally; it must not invent a conflicting fitness state.

Now answer the current user question directly.

Use the conversation history for continuity, but prioritize the
authoritative current FitZone data when the two conflict.

Respond naturally as FitZone AI.
`
}

async function generateAssistantResponse({
  question,
  context,
  supabase,
  userId,
  conversationHistory = [],
}) {
  if (!question || !question.trim()) {
    throw new Error(
      'Assistant question is required'
    )
  }

  if (!context) {
    throw new Error(
      'Fitness context is required'
    )
  }

  const orchestration =
    await orchestrateAssistantRequest({
      question,
      context,
      supabase,
      userId,
    })

  const prompt =
    buildAssistantPrompt(
      orchestration.question,
      orchestration.intent,
      orchestration.relevant_context,
      orchestration.tool_result,
      conversationHistory,
      orchestration.intelligence
    )

  const answer =
    await generateGeminiResponse(prompt)

  return {
    question:
      orchestration.question,

    intent:
      orchestration.intent,

    answer,
    intelligence: orchestration.intelligence,
  }
}

module.exports = {
  buildAssistantPrompt,
  generateAssistantResponse,
}