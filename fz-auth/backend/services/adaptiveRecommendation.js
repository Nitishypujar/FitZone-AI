// ADAPTIVE RECOMMENDATION ENGINE

function getAdherenceAdjustment(adherence) {
  if (adherence < 40) {
    return {
      level: 'low',
      recommendation: 'reduce-friction',
      message:
        'Prioritize a shorter, easier workout to rebuild consistency.',
    }
  }

  if (adherence < 70) {
    return {
      level: 'moderate',
      recommendation: 'maintain-consistency',
      message:
        'Maintain a manageable workload and focus on completing planned sessions.',
    }
  }

  return {
    level: 'strong',
    recommendation: 'progress-gradually',
    message:
      'Consistency is strong. Gradually progress training difficulty or volume.',
  }
}

function getWeeklyAdjustment(goalState) {
  const workoutProgress =
    Number(goalState?.weekly_workout_progress || 0)

  const minuteProgress =
    Number(goalState?.weekly_active_minute_progress || 0)

  if (workoutProgress < 50 && minuteProgress < 50) {
    return {
      priority: 'increase-activity',
      message:
        'Weekly activity is behind target. Prioritize completing the next planned session.',
    }
  }

  if (workoutProgress >= 100 && minuteProgress >= 100) {
    return {
      priority: 'maintain',
      message:
        'Weekly activity targets are already met. Focus on recovery and sustainable progression.',
    }
  }

  return {
    priority: 'continue',
    message:
      'Continue following the current plan and close the remaining weekly gap.',
  }
}

function getTrainingLoadAdjustment(trainingLoad) {
  const sessions =
    Number(trainingLoad?.sessions || 0)

  const activeMinutes =
    Number(trainingLoad?.active_minutes || 0)

  if (sessions >= 6 || activeMinutes >= 360) {
    return {
      level: 'high',
      recommendation: 'recovery',
      message:
        'Recent training load is high. Consider recovery or a lighter session.',
    }
  }

  if (sessions >= 3 || activeMinutes >= 150) {
    return {
      level: 'moderate',
      recommendation: 'normal',
      message:
        'Recent training load is moderate. A normal planned session is appropriate.',
    }
  }

  return {
    level: 'low',
    recommendation: 'build',
    message:
      'Recent training load is relatively low. A planned workout can help build consistency.',
  }
}

function getNutritionAdjustment(nutritionState) {
  if (!nutritionState?.available) {
    return {
      status: 'unavailable',
      message:
        'Nutrition data is unavailable. Avoid making nutrition-specific adjustments.',
    }
  }

  const calories =
    Number(nutritionState.calorie_percentage || 0)

  const protein =
    Number(nutritionState.protein_percentage || 0)

  if (calories < 50 && protein < 50) {
    return {
      status: 'low-intake',
      message:
        "Logged nutrition is currently well below today's targets.",
    }
  }

  if (protein < 70) {
    return {
      status: 'protein-gap',
      message:
        "Logged protein is below today's target.",
    }
  }

  return {
    status: 'on-track',
    message:
      "Logged nutrition is reasonably aligned with today's targets.",
  }
}

function determineNextAction({
  adherenceAdjustment,
  weeklyAdjustment,
  trainingAdjustment,
  nutritionAdjustment,
}) {
  // SAFETY / RECOVERY PRIORITY
  if (trainingAdjustment.recommendation === 'recovery') {
    return {
      action: 'recovery',
      priority: 'high',
      reason: trainingAdjustment.message,
    }
  }

  // CONSISTENCY PRIORITY
  if (
    adherenceAdjustment.recommendation ===
    'reduce-friction'
  ) {
    return {
      action: 'short-easy-workout',
      priority: 'high',
      reason: adherenceAdjustment.message,
    }
  }

  // ACTIVITY PRIORITY
  if (
    weeklyAdjustment.priority ===
    'increase-activity'
  ) {
    return {
      action: 'complete-planned-workout',
      priority: 'high',
      reason: weeklyAdjustment.message,
    }
  }

  // NORMAL PROGRESSION
  if (
    adherenceAdjustment.recommendation ===
    'progress-gradually'
  ) {
    return {
      action: 'progress-workout',
      priority: 'medium',
      reason: adherenceAdjustment.message,
    }
  }

  // NUTRITION SUPPORT
  if (
    nutritionAdjustment.status === 'protein-gap'
  ) {
    return {
      action: 'improve-protein-intake',
      priority: 'medium',
      reason: nutritionAdjustment.message,
    }
  }

  return {
    action: 'follow-planned-workout',
    priority: 'medium',
    reason:
      'Continue with the current fitness plan and maintain consistency.',
  }
}

function generateAdaptiveRecommendation(userState) {
  const adherenceAdjustment =
    getAdherenceAdjustment(
      Number(
        userState?.workout_state
          ?.adherence_percentage || 0
      )
    )

  const weeklyAdjustment =
    getWeeklyAdjustment(
      userState?.goal_state
    )

  const trainingAdjustment =
    getTrainingLoadAdjustment(
      userState?.workout_state
        ?.recent_training_load
    )

  const nutritionAdjustment =
    getNutritionAdjustment(
      userState?.nutrition_state
    )

  const nextAction =
    determineNextAction({
      adherenceAdjustment,
      weeklyAdjustment,
      trainingAdjustment,
      nutritionAdjustment,
    })

  return {
    generated_at: new Date().toISOString(),

    next_action: nextAction,

    signals: {
      adherence: adherenceAdjustment,
      weekly_activity: weeklyAdjustment,
      training_load: trainingAdjustment,
      nutrition: nutritionAdjustment,
    },

    explanation: [
      adherenceAdjustment.message,
      weeklyAdjustment.message,
      trainingAdjustment.message,
      nutritionAdjustment.message,
    ],
  }
}

module.exports = {
  generateAdaptiveRecommendation,
}