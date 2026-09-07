const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { calculateNutritionTargets } = require('./services/nutritionCalculator')
const { generateNutritionInsight } = require('./services/nutritionInsights')
const { buildFitnessContext } = require('./services/fitnessContext')
const {
  generateAssistantResponse,
} = require('./services/assistantService')



const {
  getTodayNutrition,
} = require('./services/ai/tools/nutritionTool')

const supabase = require('./supabase')
const { generateWorkout } = require('./services/workoutGenerator')

const app = express()

const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// ============================================
// AUTHENTICATION HELPER
// ============================================

async function authenticateUser(req, res) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication token is required',
    })

    return null
  }

  const accessToken = authHeader.replace('Bearer ', '').trim()

  if (!accessToken) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication token is required',
    })

    return null
  }

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid or expired authentication token',
      })

      return null
    }

    return user
  } catch (error) {
    console.error('Authentication error:', error)

    res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    })

    return null
  }
}

// ============================================
// ROOT API
// ============================================

app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'FitZone AI backend is running',
  })
})

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'FitZone AI backend is healthy',
  })
})

// ============================================
// DATABASE TEST
// ============================================

app.get('/api/db-test', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Database test error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Database connection successful',
      data,
    })
  } catch (error) {
    console.error('Database test exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
    })
  }
})

// ============================================
// REGISTER API
// ============================================

app.post('/api/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      age,
      height_cm,
      weight_kg,
      fitness_level,
      primary_goal,
      workout_days_per_week,
      preferred_workout_duration,
    } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('Registration error:', error)

      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    if (!data.user) {
      return res.status(400).json({
        status: 'error',
        message: 'Unable to create user',
      })
    }

    const userId = data.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: full_name || null,
        age: age || null,
        height_cm: height_cm || null,
        weight_kg: weight_kg || null,
        fitness_level: fitness_level || 'beginner',
        primary_goal: primary_goal || 'General Fitness',
        workout_days_per_week: workout_days_per_week || 3,
        preferred_workout_duration:
          preferred_workout_duration || 45,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)

      return res.status(500).json({
        status: 'error',
        message: 'User created but profile creation failed',
        error: profileError.message,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Registration exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
    })
  }
})

// ============================================
// LOGIN API
// ============================================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      })
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      console.error('Login error:', error)

      return res.status(401).json({
        status: 'error',
        message: error.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Login successful',
      user: data.user,
      session: data.session,
    })
  } catch (error) {
    console.error('Login exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    })
  }
})

// ============================================
// PROFILE API - GET
// ============================================

app.get('/api/profile', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Profile fetch error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch profile',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      profile: data,
    })
  } catch (error) {
    console.error('Profile fetch exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Profile fetch failed',
    })
  }
})

// ============================================
// PROFILE API - UPDATE
// ============================================

app.put('/api/profile', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const {
      full_name,
      age,
      height_cm,
      weight_kg,
      fitness_level,
      primary_goal,
      workout_days_per_week,
      preferred_workout_duration,
    } = req.body

    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        age,
        height_cm,
        weight_kg,
        fitness_level,
        primary_goal,
        workout_days_per_week,
        preferred_workout_duration,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to update profile',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      profile: data,
    })
  } catch (error) {
    console.error('Profile update exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Profile update failed',
    })
  }
})

// ============================================
// WORKOUT GENERATION API
// ============================================

app.post('/api/workouts/generate', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profileError) {
      console.error(
        'Profile fetch for workout generation error:',
        profileError
      )

      return res.status(500).json({
        status: 'error',
        message: 'Unable to load user profile',
        error: profileError.message,
      })
    }

    const generatedWorkout = generateWorkout(profile)

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        workout_name: generatedWorkout.workout_name,
        workout_type: generatedWorkout.workout_type,
        duration_minutes: generatedWorkout.duration_minutes,
        difficulty: generatedWorkout.difficulty,
        exercises: generatedWorkout.exercises,
        scheduled_date: new Date()
          .toISOString()
          .split('T')[0],
        completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Generated workout save error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to save generated workout',
        error: error.message,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Personalized workout generated successfully',
      workout: data,
      metadata: generatedWorkout.metadata,
    })
  } catch (error) {
    console.error('Workout generation exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout generation failed',
    })
  }
})

// ============================================
// WORKOUTS API - GET
// ============================================

app.get('/api/workouts', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_date', {
        ascending: true,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error('Workouts fetch error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch workouts',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      workouts: data || [],
    })
  } catch (error) {
    console.error('Workouts fetch exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout fetch failed',
    })
  }
})

// ============================================
// WORKOUTS API - POST
// ============================================

app.post('/api/workouts', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const {
      workout_name,
      workout_type,
      duration_minutes,
      difficulty,
      scheduled_date,
      exercises,
    } = req.body

    if (!workout_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout name is required',
      })
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        workout_name,
        workout_type: workout_type || null,
        duration_minutes: duration_minutes || null,
        difficulty: difficulty || null,
        scheduled_date: scheduled_date || null,
        exercises: exercises || null,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Workout creation error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to create workout',
        error: error.message,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Workout created successfully',
      workout: data,
    })
  } catch (error) {
    console.error('Workout creation exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout creation failed',
    })
  }
})

// ============================================
// WORKOUTS API - UPDATE
// ============================================

app.put('/api/workouts/:id', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const workoutId = req.params.id
    const { completed } = req.body

    const { data, error } = await supabase
      .from('workouts')
      .update({
        completed: Boolean(completed),
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq('id', workoutId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Workout update error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to update workout',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Workout updated successfully',
      workout: data,
    })
  } catch (error) {
    console.error('Workout update exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout update failed',
    })
  }
})

// ============================================
// WORKOUT LOGS API - GET
// ============================================

app.get('/api/workout-logs', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const { workout_id } = req.query

    let query = supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', {
        ascending: false,
      })

    if (workout_id) {
      query = query.eq('workout_id', workout_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Workout logs fetch error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch workout logs',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      logs: data || [],
    })
  } catch (error) {
    console.error('Workout logs fetch exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout logs fetch failed',
    })
  }
})

// ============================================
// WORKOUT LOGS API - POST
// ============================================

app.post('/api/workout-logs', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const {
      workout_id,
      exercise_name,
      sets,
      repetitions,
      weight_kg,
      duration_seconds,
      completed,
    } = req.body

    if (!exercise_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Exercise name is required',
      })
    }

    const payload = {
      user_id: user.id,
      workout_id: workout_id || null,
      exercise_name,
      sets:
        sets === undefined || sets === null
          ? null
          : Number(sets),
      repetitions:
        repetitions === undefined || repetitions === null
          ? null
          : Number(repetitions),
      weight_kg:
        weight_kg === undefined || weight_kg === null
          ? null
          : Number(weight_kg),
      duration_seconds:
        duration_seconds === undefined ||
        duration_seconds === null
          ? null
          : Number(duration_seconds),
      completed: Boolean(completed),
    }

    const { data, error } = await supabase
      .from('workout_logs')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('Workout log creation error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to create workout log',
        error: error.message,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Workout log created successfully',
      log: data,
    })
  } catch (error) {
    console.error('Workout log creation exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Workout log creation failed',
    })
  }
})
// ============================================
// GOALS API - GET
// ============================================

app.get('/api/goals', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        })
  
      if (error) {
        console.error('Goals fetch error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to fetch goals',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        goals: data || [],
      })
    } catch (error) {
      console.error('Goals fetch exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Goals fetch failed',
      })
    }
  })
  
  // ============================================
  // GOALS API - POST
  // ============================================
  
  app.post('/api/goals', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const {
        goal_type,
        target_value,
        current_value,
        unit,
        target_date,
        completed,
        weekly_workout_target,
        weekly_active_minute_target,
        current_weekly_workouts,
        current_weekly_active_minutes,
      } = req.body
  
      if (!goal_type) {
        return res.status(400).json({
          status: 'error',
          message: 'Goal type is required',
        })
      }
  
      const payload = {
        user_id: user.id,
        goal_type,
        target_value:
          target_value === undefined ||
          target_value === null
            ? null
            : Number(target_value),
        current_value:
          current_value === undefined ||
          current_value === null
            ? 0
            : Number(current_value),
        unit: unit || null,
        target_date: target_date || null,
        completed: Boolean(completed),
      }
  
      if (weekly_workout_target !== undefined) {
        payload.weekly_workout_target =
          Number(weekly_workout_target)
      }
  
      if (weekly_active_minute_target !== undefined) {
        payload.weekly_active_minute_target =
          Number(weekly_active_minute_target)
      }
  
      if (current_weekly_workouts !== undefined) {
        payload.current_weekly_workouts =
          Number(current_weekly_workouts)
      }
  
      if (current_weekly_active_minutes !== undefined) {
        payload.current_weekly_active_minutes =
          Number(current_weekly_active_minutes)
      }
  
      const { data, error } = await supabase
        .from('goals')
        .insert(payload)
        .select()
        .single()
  
      if (error) {
        console.error('Goal creation error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to create goal',
          error: error.message,
        })
      }
  
      res.status(201).json({
        status: 'success',
        message: 'Goal created successfully',
        goal: data,
      })
    } catch (error) {
      console.error('Goal creation exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Goal creation failed',
      })
    }
  })
  
    // ============================================
  // GOALS API - PUT
  // ============================================

  app.put('/api/goals/:id', async (req, res) => {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    try {
      const goalId = req.params.id

      const {
        goal_type,
        weekly_workout_target,
        weekly_active_minute_target,
        completed,
      } = req.body

      if (!goal_type) {
        return res.status(400).json({
          status: 'error',
          message: 'Goal type is required',
        })
      }

      const payload = {
        goal_type,
        weekly_workout_target:
          weekly_workout_target === undefined ||
          weekly_workout_target === null
            ? null
            : Number(weekly_workout_target),

        weekly_active_minute_target:
          weekly_active_minute_target === undefined ||
          weekly_active_minute_target === null
            ? null
            : Number(weekly_active_minute_target),

        completed: Boolean(completed),
      }

      const { data, error } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', goalId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Goal update error:', error)

        return res.status(500).json({
          status: 'error',
          message: 'Unable to update goal',
          error: error.message,
        })
      }

      res.json({
        status: 'success',
        message: 'Goal updated successfully',
        goal: data,
      })
    } catch (error) {
      console.error('Goal update exception:', error)

      res.status(500).json({
        status: 'error',
        message: 'Goal update failed',
      })
    }
  })

    // ============================================
  // DASHBOARD API - GET SUMMARY
  // ============================================

  app.get('/api/dashboard/summary', async (req, res) => {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    try {
      // Get user's workouts
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)

      if (workoutsError) {
        console.error('Dashboard workouts error:', workoutsError)

        return res.status(500).json({
          status: 'error',
          message: 'Unable to load workout summary',
        })
      }

      // Get user's workout logs
      const { data: logs, error: logsError } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)

      if (logsError) {
        console.error('Dashboard logs error:', logsError)

        return res.status(500).json({
          status: 'error',
          message: 'Unable to load workout log summary',
        })
      }

      // Get user's goals
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)

      if (goalsError) {
        console.error('Dashboard goals error:', goalsError)

        return res.status(500).json({
          status: 'error',
          message: 'Unable to load goal summary',
        })
      }

      // --------------------------------------------
      // COMPLETED WORKOUTS
      // --------------------------------------------

      const completedWorkouts = (workouts || []).filter(
        (workout) => workout.completed === true
      )

      // --------------------------------------------
      // COMPLETED EXERCISES
      // --------------------------------------------

      const completedExercises = (logs || []).filter(
        (log) => log.completed === true
      )

      // --------------------------------------------
      // TOTAL ACTIVE MINUTES
      // --------------------------------------------

      const totalActiveMinutes = completedWorkouts.reduce(
        (total, workout) => {
          return total + Number(workout.duration_minutes || 0)
        },
        0
      )

      // --------------------------------------------
      // CURRENT WEEK
      // --------------------------------------------

      const now = new Date()

      const currentDay = now.getDay()

      // Monday = start of week
      const mondayOffset =
        currentDay === 0 ? -6 : 1 - currentDay

      const weekStart = new Date(now)

      weekStart.setDate(
        now.getDate() + mondayOffset
      )

      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)

      weekEnd.setDate(
        weekStart.getDate() + 7
      )

      // --------------------------------------------
      // WEEKLY COMPLETED WORKOUTS
      // --------------------------------------------

      const weeklyCompletedWorkouts =
        completedWorkouts.filter((workout) => {
          const completionDate =
            workout.completed_at
              ? new Date(workout.completed_at)
              : workout.updated_at
                ? new Date(workout.updated_at)
                : null

          return (
            completionDate &&
            completionDate >= weekStart &&
            completionDate < weekEnd
          )
        })

      // --------------------------------------------
      // WEEKLY ACTIVE MINUTES
      // --------------------------------------------

      const weeklyActiveMinutes =
        weeklyCompletedWorkouts.reduce(
          (total, workout) => {
            return (
              total +
              Number(workout.duration_minutes || 0)
            )
          },
          0
        )

      // --------------------------------------------
      // WEEKLY WORKOUT TARGET
      // --------------------------------------------

      const workoutGoal = (goals || []).find(
        (goal) =>
          goal.weekly_workout_target !== null &&
          goal.weekly_workout_target !== undefined
      )

      const weeklyWorkoutTarget =
        Number(
          workoutGoal?.weekly_workout_target
        ) || 7

      // --------------------------------------------
      // WEEKLY ACTIVE MINUTE TARGET
      // --------------------------------------------

      const activeMinuteGoal = (goals || []).find(
        (goal) =>
          goal.weekly_active_minute_target !== null &&
          goal.weekly_active_minute_target !== undefined
      )

      const weeklyActiveMinuteTarget =
        Number(
          activeMinuteGoal?.weekly_active_minute_target
        ) || 380

      // --------------------------------------------
      // RESPONSE
      // --------------------------------------------

      res.json({
        status: 'success',

        summary: {
          total_completed_workouts:
            completedWorkouts.length,

          total_exercises_completed:
            completedExercises.length,

          total_active_minutes:
            totalActiveMinutes,

          weekly_completed_workouts:
            weeklyCompletedWorkouts.length,

          weekly_active_minutes:
            weeklyActiveMinutes,

          weekly_workout_target:
            weeklyWorkoutTarget,

          weekly_active_minute_target:
            weeklyActiveMinuteTarget,
        },
      })
    } catch (error) {
      console.error(
        'Dashboard summary error:',
        error
      )

      res.status(500).json({
        status: 'error',
        message: 'Unable to load dashboard summary',
      })
    }
  })


  // ============================================
  // PROGRESS API - GET
  // ============================================
  
  app.get('/api/progress', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const { data, error } = await supabase
        .from('progress_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', {
          ascending: true,
        })
  
      if (error) {
        console.error('Progress fetch error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to fetch progress',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        progress: data || [],
      })
    } catch (error) {
      console.error('Progress fetch exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Progress fetch failed',
      })
    }
  })
  
  // ============================================
  // PROGRESS API - POST
  // ============================================
  
  app.post('/api/progress', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const {
        weight_kg,
        body_fat_percentage,
        fitness_score,
        active_minutes,
        workouts_completed,
      } = req.body
  
      const payload = {
        user_id: user.id,
        weight_kg:
          weight_kg === undefined || weight_kg === null
            ? null
            : Number(weight_kg),
        body_fat_percentage:
          body_fat_percentage === undefined ||
          body_fat_percentage === null
            ? null
            : Number(body_fat_percentage),
        fitness_score:
          fitness_score === undefined ||
          fitness_score === null
            ? null
            : Number(fitness_score),
        active_minutes:
          active_minutes === undefined ||
          active_minutes === null
            ? 0
            : Number(active_minutes),
        workouts_completed:
          workouts_completed === undefined ||
          workouts_completed === null
            ? 0
            : Number(workouts_completed),
      }
  
      const { data, error } = await supabase
        .from('progress_logs')
        .insert(payload)
        .select()
        .single()
  
      if (error) {
        console.error('Progress creation error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to create progress log',
          error: error.message,
        })
      }
  
      res.status(201).json({
        status: 'success',
        message: 'Progress recorded successfully',
        progress: data,
      })
    } catch (error) {
      console.error('Progress creation exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Progress creation failed',
      })
    }
  })
  
// NUTRITION INSIGHT API
app.get('/api/nutrition/insight', async (req, res) => {
  const user = await authenticateUser(req, res)
  if (!user) return

  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        age,
        height_cm,
        weight_kg,
        fitness_level,
        primary_goal,
        workout_days_per_week
      `)
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Nutrition insight profile error:', profileError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch nutrition profile',
      })
    }

    const targets = calculateNutritionTargets(profile)

    const { data: nutrition, error: nutritionError } = await supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })

    if (nutritionError) {
      console.error('Nutrition insight logs error:', nutritionError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch nutrition logs',
      })
    }

    const today = new Date()

    const todayMeals = (nutrition || []).filter((meal) => {
      if (!meal.logged_at) return false

      const mealDate = new Date(meal.logged_at)

      return (
        mealDate.getFullYear() === today.getFullYear() &&
        mealDate.getMonth() === today.getMonth() &&
        mealDate.getDate() === today.getDate()
      )
    })

    const totals = todayMeals.reduce(
      (acc, meal) => {
        acc.calories += Number(meal.calories || 0)
        acc.protein_g += Number(meal.protein_g || 0)
        acc.carbohydrates_g += Number(meal.carbohydrates_g || 0)
        acc.fats_g += Number(meal.fats_g || 0)

        return acc
      },
      {
        calories: 0,
        protein_g: 0,
        carbohydrates_g: 0,
        fats_g: 0,
      }
    )

    const insight = generateNutritionInsight(
      totals,
      targets,
      profile
    )

    res.json({
      status: 'success',
      insight,
      totals,
      targets,
    })
  } catch (error) {
    console.error('Nutrition insight exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Nutrition insight generation failed',
    })
  }
})

// FITNESS AI CONTEXT API
app.get('/api/assistant/context', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) return

  try {
    const context = await buildFitnessContext(
      supabase,
      user.id
    )

    res.json({
      status: 'success',
      context,
    })
  } catch (error) {
    console.error('Fitness context error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to build fitness context',
      error: error.message,
    })
  }
})

// FITNESS AI CHAT API
app.post('/api/assistant/chat', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) return

  try {
    const { question } = req.body

    if (!question || !question.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Assistant question is required',
      })
    }

    const context = await buildFitnessContext(
      supabase,
      user.id
    )

    const assistantResponse = await generateAssistantResponse({
      question,
      context,
      supabase,
      userId: user.id,
    })
    
    res.json({
      status: 'success',
      question: assistantResponse.question,
      answer: assistantResponse.answer,
    })
  } catch (error) {
    console.error('Assistant chat error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to process assistant request',
    })
  }
})

// NUTRITION TARGETS API
app.get('/api/nutrition/targets', async (req, res) => {
  const user = await authenticateUser(req, res)
  if (!user) return

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        age,
        height_cm,
        weight_kg,
        fitness_level,
        primary_goal,
        workout_days_per_week
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Nutrition profile error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch nutrition profile',
      })
    }

    const targets = calculateNutritionTargets(profile)

    res.json({
      status: 'success',
      targets,
    })
  } catch (error) {
    console.error('Nutrition targets exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Nutrition target calculation failed',
    })
  }
})
  
  // ============================================
  // NUTRITION API - GET
  // ============================================
  
  app.get('/api/nutrition', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const { data, error } = await supabase
        .from('nutrition_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', {
          ascending: false,
        })
  
      if (error) {
        console.error('Nutrition fetch error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to fetch nutrition logs',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        nutrition: data || [],
      })
    } catch (error) {
      console.error('Nutrition fetch exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Nutrition fetch failed',
      })
    }
  })
  
  // ============================================
  // NUTRITION API - POST
  // ============================================
  
  app.post('/api/nutrition', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const {
        meal_type,
        meal_name,
        calories,
        protein_g,
        carbohydrates_g,
        fats_g,
      } = req.body
  
      if (!meal_name) {
        return res.status(400).json({
          status: 'error',
          message: 'Meal name is required',
        })
      }
  
      const payload = {
        user_id: user.id,
        meal_type: meal_type || null,
        meal_name,
        calories:
          calories === undefined || calories === null
            ? null
            : Number(calories),
        protein_g:
          protein_g === undefined || protein_g === null
            ? null
            : Number(protein_g),
        carbohydrates_g:
          carbohydrates_g === undefined ||
          carbohydrates_g === null
            ? null
            : Number(carbohydrates_g),
        fats_g:
          fats_g === undefined || fats_g === null
            ? null
            : Number(fats_g),
      }
  
      const { data, error } = await supabase
        .from('nutrition_logs')
        .insert(payload)
        .select()
        .single()
  
      if (error) {
        console.error('Nutrition creation error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to create nutrition log',
          error: error.message,
        })
      }
  
      res.status(201).json({
        status: 'success',
        message: 'Nutrition log created successfully',
        nutrition: data,
      })
    } catch (error) {
      console.error('Nutrition creation exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Nutrition creation failed',
      })
    }
  })
  
  // ============================================
  // NUTRITION API - UPDATE
  // ============================================
  
  app.put('/api/nutrition/:id', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const nutritionId = req.params.id
  
      const {
        meal_type,
        meal_name,
        calories,
        protein_g,
        carbohydrates_g,
        fats_g,
      } = req.body
  
      const { data, error } = await supabase
        .from('nutrition_logs')
        .update({
          meal_type,
          meal_name,
          calories:
            calories === undefined || calories === null
              ? null
              : Number(calories),
          protein_g:
            protein_g === undefined || protein_g === null
              ? null
              : Number(protein_g),
          carbohydrates_g:
            carbohydrates_g === undefined ||
            carbohydrates_g === null
              ? null
              : Number(carbohydrates_g),
          fats_g:
            fats_g === undefined || fats_g === null
              ? null
              : Number(fats_g),
        })
        .eq('id', nutritionId)
        .eq('user_id', user.id)
        .select()
        .single()
  
      if (error) {
        console.error('Nutrition update error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to update nutrition log',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        message: 'Nutrition log updated successfully',
        nutrition: data,
      })
    } catch (error) {
      console.error('Nutrition update exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Nutrition update failed',
      })
    }
  })

  // ============================================
// NUTRITION API - DELETE
// ============================================

app.delete('/api/nutrition/:id', async (req, res) => {
  const user = await authenticateUser(req, res)

  if (!user) {
    return
  }

  try {
    const nutritionId = req.params.id

    const { data, error } = await supabase
      .from('nutrition_logs')
      .delete()
      .eq('id', nutritionId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Nutrition delete error:', error)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to delete nutrition log',
        error: error.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Nutrition log deleted successfully',
      nutrition: data,
    })
  } catch (error) {
    console.error('Nutrition delete exception:', error)

    res.status(500).json({
      status: 'error',
      message: 'Nutrition deletion failed',
    })
  }
})

  // ============================================
// DASHBOARD SUMMARY API
// ============================================

app.get('/api/dashboard', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const [
        profileResult,
        workoutsResult,
        goalsResult,
        progressResult,
        nutritionResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
  
        supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          }),
  
        supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {
            ascending: false,
          }),
  
        supabase
          .from('progress_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('recorded_at', {
            ascending: false,
          }),
  
        supabase
          .from('nutrition_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('logged_at', {
            ascending: false,
          }),
      ])
  
      if (profileResult.error) {
        console.error(
          'Dashboard profile error:',
          profileResult.error
        )
      }
  
      if (workoutsResult.error) {
        console.error(
          'Dashboard workouts error:',
          workoutsResult.error
        )
      }
  
      if (goalsResult.error) {
        console.error(
          'Dashboard goals error:',
          goalsResult.error
        )
      }
  
      if (progressResult.error) {
        console.error(
          'Dashboard progress error:',
          progressResult.error
        )
      }
  
      if (nutritionResult.error) {
        console.error(
          'Dashboard nutrition error:',
          nutritionResult.error
        )
      }
  
      const workouts = workoutsResult.data || []
      const goals = goalsResult.data || []
      const progress = progressResult.data || []
      const nutrition = nutritionResult.data || []
  
      const completedWorkouts = workouts.filter(
        (workout) => workout.completed
      )
  
      const completedGoals = goals.filter(
        (goal) => goal.completed
      )
  
      const totalActiveMinutes = progress.reduce(
        (total, item) =>
          total + Number(item.active_minutes || 0),
        0
      )
  
      const totalCalories = nutrition.reduce(
        (total, item) =>
          total + Number(item.calories || 0),
        0
      )
  
      res.json({
        status: 'success',
  
        dashboard: {
          profile: profileResult.data || null,
  
          stats: {
            total_workouts: workouts.length,
            completed_workouts: completedWorkouts.length,
            total_goals: goals.length,
            completed_goals: completedGoals.length,
            total_active_minutes: totalActiveMinutes,
            total_calories_logged: totalCalories,
          },
  
          workouts,
          goals,
          progress,
          nutrition,
        },
      })
    } catch (error) {
      console.error('Dashboard exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Dashboard data fetch failed',
      })
    }
  })
  
  // ============================================
  // AI PLAN API - GET
  // ============================================
  
  app.get('/api/ai-plan', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const { data, error } = await supabase
        .from('ai_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        })
  
      if (error) {
        console.error('AI plans fetch error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to fetch AI plans',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        plans: data || [],
      })
    } catch (error) {
      console.error('AI plans fetch exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'AI plans fetch failed',
      })
    }
  })
  
  // ============================================
  // AI PLAN API - POST
  // ============================================
  
  app.post('/api/ai-plan', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const {
        plan_type,
        goal,
        fitness_level,
        workout_days_per_week,
        workout_duration_minutes,
        plan_data,
      } = req.body
  
      const { data, error } = await supabase
        .from('ai_plans')
        .insert({
          user_id: user.id,
          plan_type: plan_type || 'workout',
          goal: goal || null,
          fitness_level: fitness_level || null,
          workout_days_per_week:
            workout_days_per_week === undefined ||
            workout_days_per_week === null
              ? null
              : Number(workout_days_per_week),
          workout_duration_minutes:
            workout_duration_minutes === undefined ||
            workout_duration_minutes === null
              ? null
              : Number(workout_duration_minutes),
          plan_data: plan_data || null,
        })
        .select()
        .single()
  
      if (error) {
        console.error('AI plan creation error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to create AI plan',
          error: error.message,
        })
      }
  
      res.status(201).json({
        status: 'success',
        message: 'AI plan created successfully',
        plan: data,
      })
    } catch (error) {
      console.error('AI plan creation exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'AI plan creation failed',
      })
    }
  })
  
  // ============================================
  // PROFILE + AUTH STATUS API
  // ============================================
  
  app.get('/api/auth/me', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) {
      return
    }
  
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
  
      if (error) {
        console.error('Auth profile fetch error:', error)
  
        return res.status(500).json({
          status: 'error',
          message: 'Unable to fetch authenticated profile',
          error: error.message,
        })
      }
  
      res.json({
        status: 'success',
        user,
        profile,
      })
    } catch (error) {
      console.error('Auth me exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Unable to fetch authenticated user',
      })
    }
  })
  
  // ============================================
  // LOGOUT API
  // ============================================
  
  app.post('/api/logout', async (req, res) => {
    const authHeader = req.headers.authorization
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication token is required',
      })
    }
  
    const accessToken = authHeader.replace('Bearer ', '').trim()
  
    try {
      const { error } = await supabase.auth.signOut()
  
      if (error) {
        console.error('Logout error:', error)
      }
  
      res.json({
        status: 'success',
        message: 'Logout request completed',
        token_received: Boolean(accessToken),
      })
    } catch (error) {
      console.error('Logout exception:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Logout failed',
      })
    }
  })
  
  // AI TOOL: TODAY'S NUTRITION
  app.get('/api/ai/tools/nutrition/today', async (req, res) => {
    const user = await authenticateUser(req, res)
  
    if (!user) return
  
    try {
      const nutrition = await getTodayNutrition(
        supabase,
        user.id
      )
  
      res.json({
        status: 'success',
        nutrition,
      })
    } catch (error) {
      console.error('Today nutrition tool error:', error)
  
      res.status(500).json({
        status: 'error',
        message: 'Unable to retrieve today\'s nutrition',
      })
    }
  })


  
  // ============================================
  // 404 HANDLER
  // ============================================
  
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'API route not found',
      path: req.originalUrl,
    })
  })
  
  // ============================================
  // GLOBAL ERROR HANDLER
  // ============================================
  
  app.use((error, req, res, next) => {
    console.error('Unhandled server error:', error)
  
    if (res.headersSent) {
      return next(error)
    }
  
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  })
  
  // ============================================
  // START SERVER
  // ============================================
  
  app.listen(PORT, () => {
    console.log(
      `FitZone AI backend running on http://localhost:${PORT}`
    )
  })