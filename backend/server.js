const express = require('express')
const cors = require('cors')
require('dotenv').config()

const supabase = require('./supabase')

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
      message: 'Unable to verify authentication token',
    })

    return null
  }
}

// ============================================
// ROOT ROUTE
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'FitZone AI backend is running',
    status: 'success',
  })
})

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'FitZone AI API',
  })
})

// ============================================
// DATABASE CONNECTION TEST
// ============================================

app.get('/api/db-test', async (req, res) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      throw error
    }

    res.json({
      status: 'success',
      message: 'Supabase database connection is working',
    })
  } catch (error) {
    console.error('Database connection error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Supabase database connection failed',
      details: error.message,
    })
  }
})

// ============================================
// USER REGISTRATION
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, full_name } = req.body

    if (!email || !password || !full_name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and full name are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedName = full_name.trim()

    if (!normalizedName) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name cannot be empty',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters',
      })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: normalizedName,
      },
    })

    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message,
      })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: normalizedName,
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)

      try {
        await supabase.auth.admin.deleteUser(data.user.id)
      } catch (deleteError) {
        console.error(
          'Unable to roll back Auth user:',
          deleteError,
        )
      }

      return res.status(500).json({
        status: 'error',
        message: 'Unable to create user profile',
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      user: {
        id: data.user.id,
        email: data.user.email,
        full_name:
          data.user.user_metadata?.full_name || normalizedName,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
    })
  }
})

// ============================================
// USER LOGIN
// ============================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error || !data.user || !data.session) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      })
    }

    res.json({
      status: 'success',
      message: 'Login successful',

      user: {
        id: data.user.id,
        email: data.user.email,
        full_name:
          data.user.user_metadata?.full_name || '',
      },

      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    })
  }
})

// ============================================
// GET CURRENT USER PROFILE
// ============================================

app.get('/api/profile', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)

      if (profileError.code === 'PGRST116') {
        return res.status(404).json({
          status: 'error',
          message: 'User profile not found',
        })
      }

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch user profile',
        details: profileError.message,
      })
    }

    res.json({
      status: 'success',
      profile,
    })
  } catch (error) {
    console.error('Profile API error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch user profile',
    })
  }
})

// ============================================
// UPDATE CURRENT USER PROFILE
// ============================================

app.put('/api/profile', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

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

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Full name is required',
      })
    }

    const parsedAge =
      age === null || age === '' || age === undefined
        ? null
        : Number(age)

    const parsedHeight =
      height_cm === null ||
      height_cm === '' ||
      height_cm === undefined
        ? null
        : Number(height_cm)

    const parsedWeight =
      weight_kg === null ||
      weight_kg === '' ||
      weight_kg === undefined
        ? null
        : Number(weight_kg)

    const parsedWorkoutDays =
      workout_days_per_week === null ||
      workout_days_per_week === '' ||
      workout_days_per_week === undefined
        ? null
        : Number(workout_days_per_week)

    const parsedDuration =
      preferred_workout_duration === null ||
      preferred_workout_duration === '' ||
      preferred_workout_duration === undefined
        ? null
        : Number(preferred_workout_duration)

    if (
      parsedAge !== null &&
      (!Number.isFinite(parsedAge) ||
        parsedAge < 13 ||
        parsedAge > 100)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Age must be between 13 and 100',
      })
    }

    if (
      parsedHeight !== null &&
      (!Number.isFinite(parsedHeight) ||
        parsedHeight < 100 ||
        parsedHeight > 250)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Height must be between 100 and 250 cm',
      })
    }

    if (
      parsedWeight !== null &&
      (!Number.isFinite(parsedWeight) ||
        parsedWeight < 20 ||
        parsedWeight > 300)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Weight must be between 20 and 300 kg',
      })
    }

    if (
      parsedWorkoutDays !== null &&
      (!Number.isInteger(parsedWorkoutDays) ||
        parsedWorkoutDays < 1 ||
        parsedWorkoutDays > 7)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout days must be between 1 and 7',
      })
    }

    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) ||
        parsedDuration < 10 ||
        parsedDuration > 180)
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Workout duration must be between 10 and 180 minutes',
      })
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .update({
          full_name: full_name.trim(),
          age: parsedAge,
          height_cm: parsedHeight,
          weight_kg: parsedWeight,
          fitness_level: fitness_level || null,
          primary_goal: primary_goal || null,
          workout_days_per_week: parsedWorkoutDays,
          preferred_workout_duration: parsedDuration,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single()

    if (profileError) {
      console.error('Profile update error:', profileError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to update profile',
        details: profileError.message,
      })
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      profile,
    })
  } catch (error) {
    console.error('Profile update API error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to update profile',
    })
  }
})

// ============================================
// GET CURRENT USER WORKOUTS
// ============================================

app.get('/api/workouts', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const { data: workouts, error: workoutError } =
      await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', {
          ascending: true,
          nullsFirst: false,
        })

    if (workoutError) {
      console.error('Workout fetch error:', workoutError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch workouts',
        details: workoutError.message,
      })
    }

    res.json({
      status: 'success',
      workouts,
    })
  } catch (error) {
    console.error('Workout API error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to fetch workouts',
    })
  }
})

// ============================================
// CREATE CURRENT USER WORKOUT
// ============================================

app.post('/api/workouts', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      workout_name,
      workout_type,
      duration_minutes,
      difficulty,
      scheduled_date,
    } = req.body

    if (!workout_name || !workout_name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout name is required',
      })
    }

    const parsedDuration =
      duration_minutes === null ||
      duration_minutes === '' ||
      duration_minutes === undefined
        ? null
        : Number(duration_minutes)

    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) ||
        parsedDuration <= 0 ||
        parsedDuration > 300)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout duration must be between 1 and 300 minutes',
      })
    }

    const { data: workout, error: workoutError } =
      await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          workout_name: workout_name.trim(),
          workout_type: workout_type || null,
          duration_minutes: parsedDuration,
          difficulty: difficulty || null,
          scheduled_date: scheduled_date || null,
          completed: false,
        })
        .select()
        .single()

    if (workoutError) {
      console.error('Workout creation error:', workoutError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to create workout',
        details: workoutError.message,
      })
    }

    res.status(201).json({
      status: 'success',
      message: 'Workout created successfully',
      workout,
    })
  } catch (error) {
    console.error('Workout creation API error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to create workout',
    })
  }
})

// ============================================
// UPDATE CURRENT USER WORKOUT
// ============================================

app.put('/api/workouts/:id', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const workoutId = req.params.id
    const { completed } = req.body

    if (typeof completed !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Completed must be true or false',
      })
    }

    const { data: workout, error: workoutError } =
      await supabase
        .from('workouts')
        .update({
          completed,
        })
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .select('*')
        .single()

    if (workoutError) {
      console.error(
        'Workout update error:',
        workoutError,
      )

      return res.status(500).json({
        status: 'error',
        message: 'Unable to update workout',
        details: workoutError.message,
      })
    }

    if (!workout) {
      return res.status(404).json({
        status: 'error',
        message: 'Workout not found',
      })
    }

    return res.status(200).json({
      status: 'success',
      message: completed
        ? 'Workout completed successfully'
        : 'Workout marked incomplete',
      workout,
    })
  } catch (error) {
    console.error(
      'Workout update API error:',
      error,
    )

    return res.status(500).json({
      status: 'error',
      message: 'Unable to update workout',
    })
  }
})

// ============================================
// GET CURRENT USER WORKOUT LOGS
// ============================================

app.get('/api/workout-logs', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const { workout_id } = req.query

    if (!workout_id) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout ID is required.',
      })
    }

    const parsedWorkoutId = Number.parseInt(
      workout_id,
      10
    )

    if (Number.isNaN(parsedWorkoutId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Workout ID must be a valid number.',
      })
    }

    const { data: workoutLogs, error } =
      await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('workout_id', parsedWorkoutId)
        .order('logged_at', {
          ascending: false,
        })

    if (error) {
      console.error(
        'Workout logs fetch error:',
        error
      )

      return res.status(500).json({
        status: 'error',
        message: 'Unable to load workout progress.',
        details: error.message,
      })
    }

    return res.status(200).json({
      status: 'success',
      workout_logs: workoutLogs || [],
    })
  } catch (error) {
    console.error(
      'Workout logs GET API error:',
      error
    )

    return res.status(500).json({
      status: 'error',
      message: 'Unable to load workout progress.',
    })
  }
})

// ============================================
// CREATE OR UPDATE WORKOUT EXERCISE LOG
// ============================================

app.post('/api/workout-logs', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      workout_id,
      exercise_name,
      sets,
      repetitions,
      weight_kg,
      duration_seconds,
      completed,
    } = req.body

    if (!exercise_name || !exercise_name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: 'Exercise name is required',
      })
    }

    // Verify workout ownership
    if (workout_id !== null && workout_id !== undefined) {
      const { data: workout, error: workoutError } =
        await supabase
          .from('workouts')
          .select('id')
          .eq('id', workout_id)
          .eq('user_id', user.id)
          .single()

      if (workoutError || !workout) {
        return res.status(403).json({
          status: 'error',
          message:
            'Workout does not belong to the authenticated user',
        })
      }
    }

    const parsedSets =
      sets === null || sets === '' || sets === undefined
        ? null
        : Number(sets)

    const parsedRepetitions =
      repetitions === null ||
      repetitions === '' ||
      repetitions === undefined
        ? null
        : Number(repetitions)

    const parsedWeight =
      weight_kg === null ||
      weight_kg === '' ||
      weight_kg === undefined
        ? null
        : Number(weight_kg)

    const parsedDuration =
      duration_seconds === null ||
      duration_seconds === '' ||
      duration_seconds === undefined
        ? null
        : Number(duration_seconds)

    if (
      parsedSets !== null &&
      (!Number.isInteger(parsedSets) || parsedSets < 1)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Sets must be a positive whole number',
      })
    }

    if (
      parsedRepetitions !== null &&
      (!Number.isInteger(parsedRepetitions) ||
        parsedRepetitions < 1)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Repetitions must be a positive whole number',
      })
    }

    if (
      parsedWeight !== null &&
      (!Number.isFinite(parsedWeight) || parsedWeight < 0)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Weight cannot be negative',
      })
    }

    if (
      parsedDuration !== null &&
      (!Number.isFinite(parsedDuration) ||
        parsedDuration < 0)
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Duration cannot be negative',
      })
    }

    // Find existing log
    let existingQuery = supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('exercise_name', exercise_name.trim())

    if (workout_id !== null && workout_id !== undefined) {
      existingQuery = existingQuery.eq('workout_id', workout_id)
    } else {
      existingQuery = existingQuery.is('workout_id', null)
    }

    const {
      data: existingLogs,
      error: existingError,
    } = await existingQuery
      .order('logged_at', { ascending: false })
      .limit(1)

    if (existingError) {
      console.error(
        'Existing workout log lookup error:',
        existingError,
      )

      return res.status(500).json({
        status: 'error',
        message: 'Unable to check existing workout log',
        details: existingError.message,
      })
    }

    let workoutLog

    // Update existing log
    if (existingLogs && existingLogs.length > 0) {
      const existingLog = existingLogs[0]

      const { data: updatedLog, error: updateError } =
        await supabase
          .from('workout_logs')
          .update({
            sets: parsedSets,
            repetitions: parsedRepetitions,
            weight_kg: parsedWeight,
            duration_seconds: parsedDuration,
            completed: completed ?? false,
            logged_at: new Date().toISOString(),
          })
          .eq('id', existingLog.id)
          .eq('user_id', user.id)
          .select()
          .single()

      if (updateError) {
        console.error(
          'Workout log update error:',
          updateError,
        )

        return res.status(500).json({
          status: 'error',
          message: 'Unable to update workout log',
          details: updateError.message,
        })
      }

      workoutLog = updatedLog
    }

    // Create new log
    else {
      const { data: newLog, error: insertError } =
        await supabase
          .from('workout_logs')
          .insert({
            user_id: user.id,
            workout_id:
              workout_id !== undefined
                ? workout_id
                : null,
            exercise_name: exercise_name.trim(),
            sets: parsedSets,
            repetitions: parsedRepetitions,
            weight_kg: parsedWeight,
            duration_seconds: parsedDuration,
            completed: completed ?? false,
          })
          .select()
          .single()

      if (insertError) {
        console.error(
          'Workout log creation error:',
          insertError,
        )

        return res.status(500).json({
          status: 'error',
          message: 'Unable to save workout log',
          details: insertError.message,
        })
      }

      workoutLog = newLog
    }

    res.status(200).json({
      status: 'success',
      message: 'Workout log saved successfully',
      workout_log: workoutLog,
    })
  } catch (error) {
    console.error('Workout log API error:', error)

    res.status(500).json({
      status: 'error',
      message: 'Unable to save workout log',
    })
  }
})

// ============================================
// GOALS API
// ============================================

// GET CURRENT USER GOALS
app.get('/api/goals', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const { data: goals, error: goalsError } =
      await supabase
        .from('goals')
        .select(`
          id,
          user_id,
          goal_type,
          weekly_workout_target,
          weekly_active_minute_target,
          current_weekly_workouts,
          current_weekly_active_minutes,
          target_date,
          completed,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (goalsError) {
      console.error('Goals fetch error:', goalsError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch goals',
        details: goalsError.message,
      })
    }

    return res.status(200).json({
      status: 'success',
      goals: goals || [],
    })
  } catch (error) {
    console.error('Goals API error:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

// CREATE OR UPDATE CURRENT USER GOAL
app.post('/api/goals', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      goal_type,
      weekly_workout_target,
      weekly_active_minute_target,
      target_date,
      completed,
    } = req.body

    if (!goal_type) {
      return res.status(400).json({
        status: 'error',
        message: 'Goal type is required',
      })
    }

    const weeklyWorkouts = Number(weekly_workout_target)

    const weeklyActiveMinutes = Number(
      weekly_active_minute_target,
    )

    if (
      !Number.isInteger(weeklyWorkouts) ||
      weeklyWorkouts < 2 ||
      weeklyWorkouts > 7
    ) {
      return res.status(400).json({
        status: 'error',
        message: 'Weekly workouts must be between 2 and 7',
      })
    }

    if (
      !Number.isInteger(weeklyActiveMinutes) ||
      weeklyActiveMinutes < 60 ||
      weeklyActiveMinutes > 500
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Weekly active minutes must be between 60 and 500',
      })
    }

    // FitZone maintains one active goal profile per user.
    const { data: existingGoal, error: findError } =
      await supabase
        .from('goals')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

    if (findError) {
      console.error('Goal lookup error:', findError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to find existing goal',
        details: findError.message,
      })
    }

    const goalData = {
      user_id: user.id,
      goal_type,
      weekly_workout_target: weeklyWorkouts,
      weekly_active_minute_target: weeklyActiveMinutes,
      target_date: target_date || null,
      completed: Boolean(completed),
    }

    let savedGoal
    let saveError

    if (existingGoal) {
      const result = await supabase
        .from('goals')
        .update(goalData)
        .eq('id', existingGoal.id)
        .eq('user_id', user.id)
        .select(`
          id,
          user_id,
          goal_type,
          weekly_workout_target,
          weekly_active_minute_target,
          current_weekly_workouts,
          current_weekly_active_minutes,
          target_date,
          completed,
          created_at
        `)
        .single()

      savedGoal = result.data
      saveError = result.error
    } else {
      const result = await supabase
        .from('goals')
        .insert({
          ...goalData,
          current_weekly_workouts: 0,
          current_weekly_active_minutes: 0,
        })
        .select(`
          id,
          user_id,
          goal_type,
          weekly_workout_target,
          weekly_active_minute_target,
          current_weekly_workouts,
          current_weekly_active_minutes,
          target_date,
          completed,
          created_at
        `)
        .single()

      savedGoal = result.data
      saveError = result.error
    }

    if (saveError) {
      console.error('Goal save error:', saveError)

      return res.status(500).json({
        status: 'error',
        message: 'Unable to save goal',
        details: saveError.message,
      })
    }

    return res.status(200).json({
      status: 'success',
      message: 'Goal saved successfully',
      goal: savedGoal,
    })
  } catch (error) {
    console.error('Goals save route error:', error)

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

// ============================================
// GET PROGRESS
// ============================================

app.get('/api/progress', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from('progress_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', {
        ascending: false,
      })

    if (progressError) {
      console.error(
        'Progress fetch error:',
        progressError,
      )

      return res.status(500).json({
        status: 'error',
        message: progressError.message,
      })
    }

    return res.status(200).json({
      status: 'success',
      progress: progress || [],
    })
  } catch (error) {
    console.error(
      'Progress route error:',
      error,
    )

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

// ============================================
// POST PROGRESS
// ============================================

app.post('/api/progress', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      weight_kg,
      body_fat_percentage,
      fitness_score,
      active_minutes,
      workouts_completed,
    } = req.body

    const {
      data: progress,
      error: progressError,
    } = await supabase
      .from('progress_logs')
      .insert([
        {
          user_id: user.id,

          weight_kg:
            weight_kg !== undefined &&
            weight_kg !== ''
              ? Number(weight_kg)
              : null,

          body_fat_percentage:
            body_fat_percentage !== undefined &&
            body_fat_percentage !== ''
              ? Number(body_fat_percentage)
              : null,

          fitness_score:
            fitness_score !== undefined &&
            fitness_score !== ''
              ? Number(fitness_score)
              : null,

          active_minutes:
            active_minutes !== undefined &&
            active_minutes !== ''
              ? Number(active_minutes)
              : 0,

          workouts_completed:
            workouts_completed !== undefined &&
            workouts_completed !== ''
              ? Number(workouts_completed)
              : 0,
        },
      ])
      .select()
      .single()

    if (progressError) {
      console.error(
        'Progress insert error:',
        progressError,
      )

      return res.status(500).json({
        status: 'error',
        message: progressError.message,
      })
    }

    return res.status(201).json({
      status: 'success',
      message: 'Progress saved successfully',
      progress,
    })
  } catch (error) {
    console.error(
      'Progress save route error:',
      error,
    )

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

// ============================================
// NUTRITION TRACKING API
// ============================================

app.get('/api/nutrition', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const today = new Date()
      .toISOString()
      .split('T')[0]

    const { data, error } = await supabase
      .from('nutrition_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('tracking_date', today)
      .maybeSingle()

    if (error) {
      console.error(
        'Nutrition fetch error:',
        error,
      )

      return res.status(500).json({
        status: 'error',
        message: 'Unable to fetch nutrition tracking',
        details: error.message,
      })
    }

    return res.status(200).json({
      status: 'success',

      nutrition:
        data || {
          tracking_date: today,
          breakfast_completed: false,
          lunch_completed: false,
          snack_completed: false,
          dinner_completed: false,
          water_glasses: 5,
          hydration_completed: false,
          sleep_completed: false,
          stretching_completed: false,
        },
    })
  } catch (error) {
    console.error(
      'Nutrition GET route error:',
      error,
    )

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

app.put('/api/nutrition', async (req, res) => {
  try {
    const user = await authenticateUser(req, res)

    if (!user) {
      return
    }

    const {
      breakfast_completed,
      lunch_completed,
      snack_completed,
      dinner_completed,
      water_glasses,
      hydration_completed,
      sleep_completed,
      stretching_completed,
    } = req.body

    const waterValue = Number(water_glasses)

    if (
      !Number.isInteger(waterValue) ||
      waterValue < 0 ||
      waterValue > 8
    ) {
      return res.status(400).json({
        status: 'error',
        message:
          'Water glasses must be an integer between 0 and 8',
      })
    }

    const today = new Date()
      .toISOString()
      .split('T')[0]

    const {
      data,
      error,
    } = await supabase
      .from('nutrition_tracking')
      .upsert(
        {
          user_id: user.id,
          tracking_date: today,

          breakfast_completed:
            Boolean(breakfast_completed),

          lunch_completed:
            Boolean(lunch_completed),

          snack_completed:
            Boolean(snack_completed),

          dinner_completed:
            Boolean(dinner_completed),

          water_glasses: waterValue,

          hydration_completed:
            Boolean(hydration_completed),

          sleep_completed:
            Boolean(sleep_completed),

          stretching_completed:
            Boolean(stretching_completed),

          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            'user_id,tracking_date',
        },
      )
      .select('*')
      .single()

    if (error) {
      console.error(
        'Nutrition update error:',
        error,
      )

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to save nutrition tracking',
        details: error.message,
      })
    }

    return res.status(200).json({
      status: 'success',
      message:
        'Nutrition tracking saved successfully',
      nutrition: data,
    })
  } catch (error) {
    console.error(
      'Nutrition PUT route error:',
      error,
    )

    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    })
  }
})

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(
    `FitZone AI backend running on http://localhost:${PORT}`,
  )
})