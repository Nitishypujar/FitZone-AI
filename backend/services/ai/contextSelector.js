function selectRelevantContext(intent, context) {
    if (!context) {
      throw new Error('Fitness context is required')
    }
  
    const {
      profile,
      goals,
      workout_summary,
      recent_workouts,
      recent_workout_logs,
      nutrition_today,
      recent_nutrition,
      recent_progress,
    } = context
  
    switch (intent) {
      case 'nutrition':
        return {
          profile: {
            primary_goal: profile?.primary_goal,
            fitness_level: profile?.fitness_level,
            weight_kg: profile?.weight_kg,
          },
          nutrition_today,
          recent_nutrition: recent_nutrition?.slice(0, 10),
          goals,
        }
  
      case 'workout':
        return {
          profile: {
            fitness_level: profile?.fitness_level,
            primary_goal: profile?.primary_goal,
            workout_days_per_week: profile?.workout_days_per_week,
            preferred_workout_duration:
              profile?.preferred_workout_duration,
          },
          goals,
          recent_workouts: recent_workouts?.slice(0, 5),
          workout_summary,
        }
  
      case 'progress':
        return {
          profile: {
            fitness_level: profile?.fitness_level,
            primary_goal: profile?.primary_goal,
            weight_kg: profile?.weight_kg,
          },
          goals,
          workout_summary,
          recent_workouts: recent_workouts?.slice(0, 10),
          recent_workout_logs: recent_workout_logs?.slice(0, 20),
          recent_progress: recent_progress?.slice(0, 10),
        }
  
      case 'goals':
        return {
          profile: {
            full_name: profile?.full_name,
            primary_goal: profile?.primary_goal,
            fitness_level: profile?.fitness_level,
            workout_days_per_week: profile?.workout_days_per_week,
          },
          goals,
          workout_summary,
        }
  
      case 'profile':
        return {
          profile,
          goals,
        }
  
      case 'wellness':
        return {
          profile: {
            age: profile?.age,
            fitness_level: profile?.fitness_level,
            primary_goal: profile?.primary_goal,
            workout_days_per_week: profile?.workout_days_per_week,
          },
          workout_summary,
          recent_progress: recent_progress?.slice(0, 5),
        }
  
      case 'general':
      default:
        return {
          profile,
          goals,
          workout_summary,
          recent_workouts: recent_workouts?.slice(0, 5),
          nutrition_today,
          recent_progress: recent_progress?.slice(0, 5),
        }
    }
  }
  
  module.exports = {
    selectRelevantContext,
  }