function detectFitnessIntent(question) {
    if (!question || !question.trim()) {
      return 'general'
    }
  
    const text = question.toLowerCase().trim()
  
    // -----------------------------------------
    // NUTRITION
    // -----------------------------------------
    if (
      text.includes('calorie') ||
      text.includes('calories') ||
      text.includes('protein') ||
      text.includes('carb') ||
      text.includes('carbohydrate') ||
      text.includes('fat') ||
      text.includes('meal') ||
      text.includes('food') ||
      text.includes('eat') ||
      text.includes('eating') ||
      text.includes('nutrition') ||
      text.includes('diet')
    ) {
      return 'nutrition'
    }
  
    // -----------------------------------------
    // PROGRESS
    // -----------------------------------------
    // This is checked BEFORE workout because
    // questions like:
    // "Am I improving with my workouts?"
    // contain the word "workouts" but are
    // actually asking about progress.
    // -----------------------------------------
    if (
      text.includes('progress') ||
      text.includes('improving') ||
      text.includes('improve') ||
      text.includes('performance') ||
      text.includes('consistency') ||
      text.includes('completed') ||
      text.includes('history') ||
      text.includes('results') ||
      text.includes('getting better') ||
      text.includes('doing so far') ||
      text.includes('how am i doing') ||
      text.includes('am i getting') ||
      text.includes('have i improved')
    ) {
      return 'progress'
    }
  
    // -----------------------------------------
    // WORKOUT
    // -----------------------------------------
    if (
      text.includes('workout') ||
      text.includes('work out') ||
      text.includes('exercise') ||
      text.includes('training') ||
      text.includes('gym') ||
      text.includes('sets') ||
      text.includes('reps') ||
      text.includes('repetition') ||
      text.includes('routine') ||
      text.includes('lift') ||
      text.includes('lifting')
    ) {
      return 'workout'
    }
  
    // -----------------------------------------
    // GOALS
    // -----------------------------------------
    if (
      text.includes('goal') ||
      text.includes('goals') ||
      text.includes('target') ||
      text.includes('targets') ||
      text.includes('lose weight') ||
      text.includes('gain weight') ||
      text.includes('build muscle') ||
      text.includes('strength goal')
    ) {
      return 'goals'
    }
  
    // -----------------------------------------
    // PROFILE
    // -----------------------------------------
    if (
      text.includes('my weight') ||
      text.includes('my age') ||
      text.includes('my height') ||
      text.includes('fitness level') ||
      text.includes('profile') ||
      text.includes('personal details')
    ) {
      return 'profile'
    }
  
    // -----------------------------------------
    // WELLNESS / RECOVERY
    // -----------------------------------------
    if (
      text.includes('sleep') ||
      text.includes('recovery') ||
      text.includes('recover') ||
      text.includes('rest') ||
      text.includes('sore') ||
      text.includes('soreness') ||
      text.includes('stress') ||
      text.includes('tired') ||
      text.includes('fatigue')
    ) {
      return 'wellness'
    }
  
    // -----------------------------------------
    // GENERAL
    // -----------------------------------------
    return 'general'
  }
  
  module.exports = {
    detectFitnessIntent,
  }