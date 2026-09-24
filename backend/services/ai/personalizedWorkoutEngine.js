function normalizeGoal(goal = '') {
    const value = String(goal).toLowerCase().trim()
  
    if (
      value.includes('fat') ||
      value.includes('loss') ||
      value.includes('weight loss')
    ) {
      return 'fat-loss'
    }
  
    if (
      value.includes('weight gain') ||
      value.includes('gain weight') ||
      value.includes('mass')
    ) {
      return 'weight-gain'
    }
  
    if (
      value.includes('muscle') ||
      value.includes('hypertrophy')
    ) {
      return 'muscle-growth'
    }
  
    if (
      value.includes('strength') ||
      value.includes('power')
    ) {
      return 'strength'
    }
  
    if (
      value.includes('endurance') ||
      value.includes('stamina')
    ) {
      return 'endurance'
    }
  
    if (
      value.includes('flexibility') ||
      value.includes('mobility')
    ) {
      return 'flexibility'
    }
  
    if (
      value.includes('maintain')
    ) {
      return 'maintain-fitness'
    }
  
    return 'general-fitness'
  }
  
  function normalizeFitnessLevel(level = '') {
    const value = String(level).toLowerCase()
  
    if (value.includes('advanced')) {
      return 'Advanced'
    }
  
    if (value.includes('intermediate')) {
      return 'Intermediate'
    }
  
    return 'Beginner'
  }
  
  function getDifficulty(level) {
    if (level === 'Advanced') {
      return 'Advanced'
    }
  
    if (level === 'Intermediate') {
      return 'Intermediate'
    }
  
    return 'Beginner'
  }
  
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }
  
  function selectWorkoutType(goal) {
    const map = {
      'fat-loss': 'Cardio + Strength',
      'weight-gain': 'Strength',
      'muscle-growth': 'Hypertrophy',
      strength: 'Strength',
      endurance: 'Endurance',
      flexibility: 'Mobility',
      'maintain-fitness': 'Mixed Fitness',
      'general-fitness': 'Full Body',
    }
  
    return map[goal] || 'Full Body'
  }
  
  const EXERCISES = {
    'fat-loss': [
      {
        name: 'Bodyweight Squats',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Push Ups',
        type: 'strength',
        defaultDuration: 6,
      },
      {
        name: 'Mountain Climbers',
        type: 'cardio',
        defaultDuration: 6,
      },
      {
        name: 'Reverse Lunges',
        type: 'strength',
        defaultDuration: 6,
      },
      {
        name: 'High Knees',
        type: 'cardio',
        defaultDuration: 5,
      },
    ],
  
    'weight-gain': [
      {
        name: 'Bodyweight Squats',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Push Ups',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Dumbbell Row',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Reverse Lunges',
        type: 'strength',
        defaultDuration: 8,
      },
    ],
  
    'muscle-growth': [
      {
        name: 'Push Ups',
        type: 'hypertrophy',
        defaultDuration: 8,
      },
      {
        name: 'Dumbbell Row',
        type: 'hypertrophy',
        defaultDuration: 8,
      },
      {
        name: 'Bodyweight Squats',
        type: 'hypertrophy',
        defaultDuration: 8,
      },
      {
        name: 'Reverse Lunges',
        type: 'hypertrophy',
        defaultDuration: 8,
      },
    ],
  
    strength: [
      {
        name: 'Push Ups',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Bodyweight Squats',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Dumbbell Row',
        type: 'strength',
        defaultDuration: 8,
      },
      {
        name: 'Reverse Lunges',
        type: 'strength',
        defaultDuration: 8,
      },
    ],
  
    endurance: [
      {
        name: 'Brisk March',
        type: 'cardio',
        defaultDuration: 8,
      },
      {
        name: 'High Knees',
        type: 'cardio',
        defaultDuration: 7,
      },
      {
        name: 'Mountain Climbers',
        type: 'cardio',
        defaultDuration: 7,
      },
      {
        name: 'Jumping Jacks',
        type: 'cardio',
        defaultDuration: 6,
      },
    ],
  
    flexibility: [
      {
        name: 'Neck Mobility',
        type: 'mobility',
        defaultDuration: 5,
      },
      {
        name: 'Shoulder Mobility',
        type: 'mobility',
        defaultDuration: 5,
      },
      {
        name: 'Hip Mobility',
        type: 'mobility',
        defaultDuration: 6,
      },
      {
        name: 'Hamstring Stretch',
        type: 'mobility',
        defaultDuration: 6,
      },
      {
        name: 'Child Pose',
        type: 'mobility',
        defaultDuration: 5,
      },
    ],
  
    'maintain-fitness': [
      {
        name: 'Bodyweight Squats',
        type: 'mixed',
        defaultDuration: 7,
      },
      {
        name: 'Push Ups',
        type: 'mixed',
        defaultDuration: 7,
      },
      {
        name: 'Brisk March',
        type: 'cardio',
        defaultDuration: 7,
      },
      {
        name: 'Plank',
        type: 'core',
        defaultDuration: 5,
      },
    ],
  
    'general-fitness': [
      {
        name: 'Bodyweight Squats',
        type: 'strength',
        defaultDuration: 7,
      },
      {
        name: 'Push Ups',
        type: 'strength',
        defaultDuration: 7,
      },
      {
        name: 'Brisk March',
        type: 'cardio',
        defaultDuration: 7,
      },
      {
        name: 'Plank',
        type: 'core',
        defaultDuration: 5,
      },
    ],
  }
  
  function getExercisePrescription(exercise, fitnessLevel, goal) {
    const presets = {
      strength: {
        Beginner: { sets: 2, repetitions: 8, rest_seconds: 75 },
        Intermediate: { sets: 3, repetitions: 8, rest_seconds: 60 },
        Advanced: { sets: 4, repetitions: 6, rest_seconds: 75 },
      },
      hypertrophy: {
        Beginner: { sets: 2, repetitions: 10, rest_seconds: 60 },
        Intermediate: { sets: 3, repetitions: 10, rest_seconds: 60 },
        Advanced: { sets: 4, repetitions: 12, rest_seconds: 60 },
      },
      cardio: {
        Beginner: { duration_seconds: 45, rest_seconds: 30 },
        Intermediate: { duration_seconds: 60, rest_seconds: 25 },
        Advanced: { duration_seconds: 75, rest_seconds: 20 },
      },
      core: {
        Beginner: { sets: 2, repetitions: 20, rest_seconds: 45 },
        Intermediate: { sets: 3, repetitions: 25, rest_seconds: 40 },
        Advanced: { sets: 3, repetitions: 30, rest_seconds: 30 },
      },
      mobility: {
        Beginner: { duration_seconds: 45, rest_seconds: 15 },
        Intermediate: { duration_seconds: 60, rest_seconds: 15 },
        Advanced: { duration_seconds: 75, rest_seconds: 10 },
      },
      mixed: {
        Beginner: { sets: 2, repetitions: 10, rest_seconds: 60 },
        Intermediate: { sets: 3, repetitions: 10, rest_seconds: 45 },
        Advanced: { sets: 3, repetitions: 12, rest_seconds: 45 },
      },
    }

    const prescription =
      presets[exercise.type]?.[fitnessLevel] ||
      presets.mixed[fitnessLevel]

    const result = {
      ...prescription,
      goal,
    }

    if (goal === 'strength' && exercise.type === 'strength') {
      result.repetitions = Math.max(5, result.repetitions - 2)
    }

    if (goal === 'endurance' && exercise.type === 'cardio') {
      result.duration_seconds += 15
    }

    return result
  }

  function buildExercises({
    goal,
    duration,
    fitnessLevel,
  }) {
    const source =
      EXERCISES[goal] ||
      EXERCISES['general-fitness']

    const intensityMultiplier =
      fitnessLevel === 'Advanced'
        ? 1.2
        : fitnessLevel === 'Intermediate'
          ? 1.1
          : 0.9

    const targetMinutes = clamp(
      Number(duration) || 30,
      10,
      90
    )

    const exercises = []
    let accumulated = 0

    for (
      let i = 0;
      i < source.length && accumulated < targetMinutes;
      i += 1
    ) {
      const exercise = source[i]

      const minutes = clamp(
        Math.round(exercise.defaultDuration * intensityMultiplier),
        3,
        12
      )

      const prescription = getExercisePrescription(
        exercise,
        fitnessLevel,
        goal
      )

      exercises.push({
        name: exercise.name,
        type: exercise.type,
        duration_minutes: minutes,
        ...prescription,
        difficulty: fitnessLevel,
        target: goal,
        order: exercises.length + 1,
      })

      accumulated += minutes
    }

    return exercises
  }

  function generatePersonalizedWorkout({
    profile = {},
    goalState = {},
    weeklyProgress = {},
    trainingLoad = {},
    recommendation = {},
  } = {}) {
    const goal = normalizeGoal(
      profile.primary_goal
    )
  
    const fitnessLevel =
      normalizeFitnessLevel(
        profile.fitness_level
      )
  
    let duration =
      Number(
        profile.preferred_workout_duration
      ) || 30
  
    const weeklyTarget =
      Number(
        goalState.weekly_workout_target
      ) || 0
  
    const weeklyCompleted =
      Number(
        weeklyProgress.weekly_completed_workouts
      ) || 0
  
    const weeklyRemaining =
      Math.max(
        0,
        weeklyTarget - weeklyCompleted
      )
  
    const trainingLevel =
      String(trainingLoad.level || '')
        .toLowerCase()
  
    /*
     * Adapt session length to current state.
     */
    if (
      trainingLevel === 'high' ||
      recommendation.action === 'recovery'
    ) {
      duration = Math.min(
        duration,
        20
      )
    }
  
    if (
      recommendation.action ===
        'short-easy-workout'
    ) {
      duration = Math.min(
        duration,
        15
      )
    }
  
    if (
      recommendation.action ===
        'progress-workout'
    ) {
      duration = Math.min(
        duration + 5,
        90
      )
    }
  
    const workoutType =
      selectWorkoutType(goal)
  
    const exercises =
      buildExercises({
        goal,
        duration,
        fitnessLevel,
      })
  
    const actualDuration =
      exercises.reduce(
        (total, exercise) =>
          total +
          Number(
            exercise.duration_minutes || 0
          ),
        0
      )
  
    return {
      workout_name:
        `${workoutType} · ${goal
          .replace(/-/g, ' ')
          .replace(/\b\w/g, char =>
            char.toUpperCase()
          )} Session`,
  
      workout_type:
        workoutType,
  
      duration_minutes:
        actualDuration,
  
      difficulty:
        getDifficulty(fitnessLevel),
  
      goal,
  
      fitness_level:
        fitnessLevel,
  
      weekly_target:
        weeklyTarget,
  
      weekly_completed:
        weeklyCompleted,
  
      weekly_remaining:
        weeklyRemaining,
  
      exercises,
  
      personalization: {
        goal_driven: true,
        fitness_level_driven: true,
        duration_adapted: true,
        weekly_progress_considered: true,
        training_load_considered: Boolean(trainingLoad.level),
        recommendation_considered: Boolean(recommendation.action),
        recommendation_action: recommendation.action || null,
        recommendation_score: recommendation.score ?? null,
        ml_considered: Boolean(recommendation.ml_enabled),
        historical_learning_considered: Boolean(
          recommendation.historical_learning
        ),
      },
    }
  }
  
  module.exports = {
    normalizeGoal,
    normalizeFitnessLevel,
    generatePersonalizedWorkout,
  }