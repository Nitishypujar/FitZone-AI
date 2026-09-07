function getExercises(goal, fitnessLevel) {
    const normalizedGoal = (goal || '').toLowerCase()
    const normalizedLevel = (fitnessLevel || '').toLowerCase()
  
    let exercises = []
  
    if (
      normalizedGoal.includes('weight') ||
      normalizedGoal.includes('fat') ||
      normalizedGoal.includes('lose')
    ) {
      exercises = [
        {
          name: 'Bodyweight Squats',
          sets: 3,
          repetitions: normalizedLevel === 'beginner' ? 10 : 15,
          rest_seconds: 60
        },
        {
          name: 'Push Ups',
          sets: 3,
          repetitions: normalizedLevel === 'beginner' ? 8 : 12,
          rest_seconds: 60
        },
        {
          name: 'Dumbbell Row',
          sets: 3,
          repetitions: 12,
          rest_seconds: 60
        },
        {
          name: 'Reverse Lunges',
          sets: 3,
          repetitions: 10,
          rest_seconds: 60
        },
        {
          name: 'Mountain Climbers',
          sets: 3,
          repetitions: 20,
          rest_seconds: 45
        },
        {
          name: 'Plank',
          sets: 3,
          duration_seconds: 30,
          rest_seconds: 45
        }
      ]
    } else if (
      normalizedGoal.includes('muscle') ||
      normalizedGoal.includes('strength') ||
      normalizedGoal.includes('build')
    ) {
      exercises = [
        {
          name: 'Push Ups',
          sets: 3,
          repetitions: normalizedLevel === 'beginner' ? 8 : 12,
          rest_seconds: 90
        },
        {
          name: 'Dumbbell Shoulder Press',
          sets: 3,
          repetitions: 10,
          rest_seconds: 90
        },
        {
          name: 'Dumbbell Row',
          sets: 3,
          repetitions: 10,
          rest_seconds: 90
        },
        {
          name: 'Goblet Squats',
          sets: 3,
          repetitions: 10,
          rest_seconds: 90
        },
        {
          name: 'Bicep Curls',
          sets: 3,
          repetitions: 12,
          rest_seconds: 60
        },
        {
          name: 'Tricep Extensions',
          sets: 3,
          repetitions: 12,
          rest_seconds: 60
        }
      ]
    } else {
      exercises = [
        {
          name: 'Bodyweight Squats',
          sets: 3,
          repetitions: 12,
          rest_seconds: 60
        },
        {
          name: 'Push Ups',
          sets: 3,
          repetitions: 10,
          rest_seconds: 60
        },
        {
          name: 'Dumbbell Row',
          sets: 3,
          repetitions: 10,
          rest_seconds: 60
        },
        {
          name: 'Dumbbell Shoulder Press',
          sets: 3,
          repetitions: 10,
          rest_seconds: 60
        },
        {
          name: 'Bicep Curls',
          sets: 3,
          repetitions: 12,
          rest_seconds: 60
        },
        {
          name: 'Plank',
          sets: 3,
          duration_seconds: 30,
          rest_seconds: 45
        }
      ]
    }
  
    if (normalizedLevel === 'beginner') {
      exercises = exercises.map((exercise) => ({
        ...exercise,
        sets: Math.min(exercise.sets, 2)
      }))
    }
  
    return exercises
  }
  
  function calculateDuration(exercises) {
    let totalMinutes = 0
  
    exercises.forEach((exercise) => {
      const sets = exercise.sets || 1
  
      if (exercise.duration_seconds) {
        totalMinutes += (exercise.duration_seconds * sets) / 60
      } else {
        totalMinutes += sets * 2
      }
  
      totalMinutes += ((sets - 1) * (exercise.rest_seconds || 60)) / 60
    })
  
    totalMinutes += 5
  
    return Math.round(totalMinutes)
  }
  
  function generateWorkout(profile) {
    const goal = profile.primary_goal || 'General Fitness'
    const fitnessLevel = profile.fitness_level || 'beginner'
    const workoutDays = profile.workout_days_per_week || 3
    const preferredDuration = profile.preferred_workout_duration || 45
  
    const exercises = getExercises(goal, fitnessLevel)
  
    let duration = calculateDuration(exercises)
  
    if (preferredDuration > 0) {
      duration = Math.min(
        Math.max(duration, 20),
        preferredDuration
      )
    }
  
    let workoutType = 'Full Body'
  
    if (
      goal.toLowerCase().includes('weight') ||
      goal.toLowerCase().includes('fat') ||
      goal.toLowerCase().includes('lose')
    ) {
      workoutType = 'Fat Loss'
    } else if (
      goal.toLowerCase().includes('muscle') ||
      goal.toLowerCase().includes('strength') ||
      goal.toLowerCase().includes('build')
    ) {
      workoutType = 'Strength'
    }
  
    return {
      workout_name: `${workoutType} Workout`,
      workout_type: workoutType,
      duration_minutes: duration,
      difficulty: fitnessLevel,
      exercises,
      metadata: {
        goal,
        fitness_level: fitnessLevel,
        workout_days_per_week: workoutDays,
        preferred_duration_minutes: preferredDuration,
        generated_by: 'rule-based-generator'
      }
    }
  }
  
  module.exports = {
    generateWorkout
  }