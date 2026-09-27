const {
    detectFitnessIntent,
  } = require('./intentDetector')
  
  const {
    selectRelevantContext,
  } = require('./contextSelector')
  
  const {
    getTodayNutrition,
  } = require('./tools/nutritionTool')
  
  const {
    getWorkoutData,
  } = require('./tools/workoutTool')
  
  const {
    getGoalData,
  } = require('./tools/goalTool')

  const {
    getProgressData,
  } = require('./tools/progressTool')

  const {
    buildIntelligenceFromContext,
  } = require('../intelligence/intelligenceService')
  
  async function orchestrateAssistantRequest({
    question,
    context,
    supabase,
    userId,
    timeZone = 'UTC',
  }) {
    if (!question || !question.trim()) {
      throw new Error('Assistant question is required')
    }
  
    if (!context) {
      throw new Error('Fitness context is required')
    }
  
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
  
    if (!userId) {
      throw new Error('User ID is required')
    }
  
    const cleanQuestion = question.trim()
  
    // -----------------------------------------
    // 1. Detect user intent
    // -----------------------------------------
  
    const intent = detectFitnessIntent(cleanQuestion)
  
    // -----------------------------------------
    // 2. Select relevant user context
    // -----------------------------------------
  
    const relevantContext = selectRelevantContext(
      intent,
      context
    )

    // Intelligence and the intent-specific deterministic tool do not depend
    // on each other. Run them concurrently to reduce assistant latency while
    // keeping the same authoritative decision path.
    const intelligencePromise = buildIntelligenceFromContext(
      supabase,
      userId,
      context
    )

    let toolPromise = Promise.resolve(null)

    if (intent === 'nutrition') {
      toolPromise = getTodayNutrition(supabase, userId, timeZone)
    } else if (intent === 'workout') {
      toolPromise = getWorkoutData(supabase, userId)
    } else if (intent === 'progress') {
      toolPromise = getProgressData(supabase, userId)
    } else if (intent === 'goals') {
      toolPromise = getGoalData(supabase, userId)
    }

    const [intelligence, toolResult] = await Promise.all([
      intelligencePromise,
      toolPromise,
    ])

    
    // -----------------------------------------
    // 4. Return orchestration result
    // -----------------------------------------
  
    return {
      question: cleanQuestion,
      intent,
      relevant_context: relevantContext,
      tool_result: toolResult,
      intelligence,
    }
  }
  
  
  module.exports = {
    orchestrateAssistantRequest,
  }