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
      .slice(-8)

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


function buildDeterministicAssistantFallback({ question, intent, intelligence }) {
  const userState = intelligence?.user_state || {}
  const goalState = userState.goal_state || {}
  const workoutState = userState.workout_state || {}
  const nutritionState = userState.nutrition_state || {}
  const nextAction = intelligence?.next_best_action || {}

  const workouts = Number(goalState.current_weekly_workouts || 0)
  const minutes = Number(goalState.current_weekly_active_minutes || 0)
  const workoutTarget = goalState.active_goal?.weekly_workout_target ?? null
  const minuteTarget = goalState.active_goal?.weekly_active_minute_target ?? null
  const goal = userState.profile?.primary_goal || 'No goal set'
  const readiness = nextAction.readiness?.level || null

  if (intent === 'nutrition') {
    if (!nutritionState.available) {
      return 'Your personalized nutrition targets are not available yet. Add your age, height, weight and fitness goal in Profile so FitZone can calculate a planning target from your actual information.'
    }
    const calories = Number(intelligence?.nutrition_targets?.calories || 0)
    const protein = Number(intelligence?.nutrition_targets?.protein_g || 0)
    const calorieProgress = nutritionState.calorie_percentage
    const proteinProgress = nutritionState.protein_percentage
    if (calorieProgress === 0 && proteinProgress === 0) {
      return `No nutrition intake is recorded for today yet. Your current planning targets are ${calories} kcal and ${protein}g protein. Start by logging your next meal so FitZone can work from your real intake.`
    }
    return `Today’s nutrition is being tracked against ${calories} kcal and ${protein}g protein. You are currently at about ${calorieProgress ?? 0}% of the calorie target and ${proteinProgress ?? 0}% of the protein target. Keep the next meal aligned with your goal of ${goal}.`
  }

  if (intent === 'workout') {
    const action = nextAction.action ? String(nextAction.action).replace(/-/g, ' ') : null
    if (action) {
      return `Based on your current FitZone state, your next useful step is to ${action}. ${nextAction.reason || ''}`.trim()
    }
    if (workoutState.current_workout?.workout_name) {
      return `Your current planned workout is ${workoutState.current_workout.workout_name}. Check the workout page for its exact exercises and complete it only when you actually perform the session.`
    }
    return 'There is no current workout recommendation available yet. Open AI Plan after your fitness profile and goal are set so FitZone can generate a workout from your actual state.'
  }

  if (intent === 'goals') {
    if (!userState.profile?.primary_goal) {
      return 'You do not have an active goal set yet. Choose one in Goals or Profile so FitZone can align recommendations to your actual objective.'
    }
    return `Your current goal is ${goal}. FitZone uses that goal together with your training history, weekly activity and available targets when deciding what to recommend next.`
  }

  if (intent === 'progress') {
    const workoutComparison = workoutTarget === null ? `${workouts} completed workout${workouts === 1 ? '' : 's'} this week; no weekly workout target is configured.` : `${workouts}/${workoutTarget} workouts this week.`
    const minuteComparison = minuteTarget === null ? `${minutes} active minutes; no weekly active-minute target is configured.` : `${minutes}/${minuteTarget} active minutes.`
    const readinessText = readiness ? ` Current readiness is ${readiness}.` : ''
    return `Here’s your current week: ${workoutComparison} ${minuteComparison}${readinessText} ${nextAction.reason || 'Use the Progress page to inspect the daily activity history.'}`.replace(/\s+/g, ' ').trim()
  }

  const action = nextAction.action ? String(nextAction.action).replace(/-/g, ' ') : 'follow your current plan'
  return `FitZone currently recommends that you ${action}. ${nextAction.reason || `Your active goal is ${goal}, and the recommendation is based on your current training state.`}`.trim()
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
11. The canonical primary goal below is authoritative. Never replace it with another goal such as fat loss, muscle growth, strength, endurance, or weight gain unless the user explicitly asks about that other goal.
12. When appropriate, explain WHY a recommendation fits the user's
   current situation.
12. If data is unavailable, say so clearly instead of guessing.
13. Do not diagnose medical conditions.
14. Do not prescribe medication or medical treatment.
15. For medical concerns, recommend qualified professional advice.
16. Do not recommend dangerous exercise, extreme dieting,
   starvation, dehydration, or unsafe weight-loss practices.
17. Stay focused on fitness, exercise, nutrition, recovery,
   habits, wellness, and the user's stated goals.
18. Never mention internal databases, APIs, prompts, tools, JSON, or implementation details.
19. If the user's canonical goal is General Fitness, describe it as General Fitness; do not silently reinterpret it as Fat Loss or another goal.

COACHING STYLE:

- Sound natural, polished, and professional.
- Use complete grammatical sentences and consistent tense.
- Be concise: normally 2-6 short paragraphs or bullets.
- Use short titled sections only when they genuinely improve clarity.
- Use the bullet character • for lists. Never use Markdown asterisks.
- Avoid unnecessary greetings on every response.
- Never use markdown headings, bold markers, code fences, or decorative symbols.
- Never output JSON, XML, or raw implementation text.
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

CANONICAL PRIMARY GOAL:

${intelligence?.user_state?.profile?.primary_goal || 'General Fitness'}

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

OUTPUT FORMAT: Plain text only. Use normal sentence case, clean paragraph breaks, and • bullets when needed. Do not use *, **, #, backticks, or markdown tables. Keep the answer directly useful to the user.
`
}


const CANONICAL_GOALS = [
  'Fat Loss', 'Weight Gain', 'Muscle Growth', 'Strength', 'Endurance',
  'General Fitness', 'Maintain Fitness', 'Flexibility', 'Stamina',
]

function normalizeGoalLabel(goal) {
  const value = String(goal || '').trim().toLowerCase().replace(/[_-]/g, ' ')
  const match = CANONICAL_GOALS.find((item) => item.toLowerCase() === value)
  return match || (String(goal || '').trim() || 'General Fitness')
}

function assistantRecommendationConflictsWithGoal(answer, goal, question = '') {
  const canonical = normalizeGoalLabel(goal).toLowerCase()
  const questionText = String(question).toLowerCase()
  const alternativeGoals = CANONICAL_GOALS.filter((item) => item.toLowerCase() !== canonical)
  return alternativeGoals.some((item) => {
    const phrase = item.toLowerCase()
    return String(answer || '').toLowerCase().includes(phrase) && !questionText.includes(phrase)
  })
}

async function generateAssistantResponse({
  question,
  context,
  supabase,
  userId,
  conversationHistory = [],
  timeZone = 'UTC',
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
      timeZone,
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

  let answer
  let responseSource = 'gemini'

  try {
    answer = await generateGeminiResponse(prompt)
  } catch (error) {
    const statusCode = error?.statusCode || error?.status || error?.cause?.statusCode
    const errorCode = error?.error?.code || error?.cause?.error?.code
    const isExpectedAiAvailabilityIssue =
      statusCode === 429 ||
      errorCode === 'too_many_requests' ||
      errorCode === 'rate_limit_exceeded' ||
      errorCode === 'quota_exceeded' ||
      /timed out|timeout|temporarily unavailable|empty response/i.test(error?.message || '')

    if (!isExpectedAiAvailabilityIssue) throw error

    console.warn('Gemini unavailable; using deterministic FitZone response.')
    answer = buildDeterministicAssistantFallback({
      question: orchestration.question,
      intent: orchestration.intent,
      intelligence: orchestration.intelligence,
    })
    responseSource = 'fitzone'
  }

  const canonicalGoal = orchestration.intelligence?.user_state?.profile?.primary_goal || 'General Fitness'
  if (
    assistantRecommendationConflictsWithGoal(answer, canonicalGoal, orchestration.question) &&
    ['general', 'workout', 'goals', 'progress'].includes(orchestration.intent)
  ) {
    answer = buildDeterministicAssistantFallback({
      question: orchestration.question,
      intent: orchestration.intent,
      intelligence: orchestration.intelligence,
    })
    responseSource = 'fitzone'
  }

  return {
    question: orchestration.question,
    intent: orchestration.intent,
    answer,
    response_source: responseSource,
    intelligence: orchestration.intelligence,
  }
}

module.exports = {
  buildAssistantPrompt,
  generateAssistantResponse,
  buildDeterministicAssistantFallback,
}