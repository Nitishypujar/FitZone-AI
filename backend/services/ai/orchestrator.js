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
  
  async function orchestrateAssistantRequest({
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
  
    // -----------------------------------------
    // 3. Execute deterministic tools
    // -----------------------------------------
  
    let toolResult = null
  
    if (intent === 'nutrition') {
      toolResult = await getTodayNutrition(
        supabase,
        userId
      )
    }
  
    if (intent === 'workout') {
      toolResult = await getWorkoutData(
        supabase,
        userId
      )
    }
    
    if (intent === 'progress') {
        toolResult = await getProgressData(
          supabase,
          userId
        )
      }

    if (intent === 'goals') {
       toolResult = await getGoalData(
         supabase,
         userId
       )
      }

    
    // -----------------------------------------
    // 4. Return orchestration result
    // -----------------------------------------
  
    return {
      question: cleanQuestion,
      intent,
      relevant_context: relevantContext,
      tool_result: toolResult,
    }
  }
  
  
  module.exports = {
    orchestrateAssistantRequest,
  }