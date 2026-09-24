function detectFitnessIntent(question) {
  if (!question || !question.trim()) {
    return 'general'
  }

  const text =
    question
      .toLowerCase()
      .trim()

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
  // GOALS / WEEKLY TARGETS
  // -----------------------------------------
  // Questions about weekly targets,
  // remaining target amounts, or progress
  // toward a goal must use the goals tool
  // because it calculates current weekly
  // workout and active-minute progress.
  // -----------------------------------------
  if (
    text.includes('weekly workout progress') ||
    text.includes('weekly workouts') ||
    text.includes('weekly workout target') ||
    text.includes('workout target') ||
    text.includes('weekly active minute') ||
    text.includes('weekly active minutes') ||
    text.includes('active minutes left') ||
    text.includes('active minutes remaining') ||
    text.includes('workouts left') ||
    text.includes('workouts remaining') ||
    text.includes('target progress') ||
    text.includes('progress toward my goal') ||
    text.includes('progress towards my goal') ||
    text.includes('how far am i from my goal') ||
    text.includes('how much is left') ||
    text.includes('how much do i have left') ||
    text.includes('remaining target') ||
    text.includes('weekly target') ||
    text.includes('goal progress') ||
    text.includes('goal target') ||
    text.includes('goals') ||
    text.includes('goal') ||
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
  // PROGRESS
  // -----------------------------------------
  // General performance/history questions
  // remain progress questions.
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