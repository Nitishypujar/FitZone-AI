const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const allowedOrigins = (process.env.FRONTEND_URL || '').split(',').map(v => v.trim()).filter(Boolean)

const corsOptions = {
  origin: (origin, callback) => {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production' && (/^https?:\/\/localhost(:\d+)?$/.test(origin || '') || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin || ''))
    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) return callback(null, true)
    return callback(null, false)
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  optionsSuccessStatus: 204
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests. Please try again later.' }
})

const assistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many assistant requests. Please try again later.' }
})

const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many generation requests. Please try again later.' }
})

const mlTrainingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'ML training is temporarily rate limited.' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many authentication attempts. Please try again later.' }
})

const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'https:', 'wss:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'no-referrer' },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}


module.exports = { corsOptions, globalLimiter, authLimiter, assistantLimiter, generationLimiter, mlTrainingLimiter, helmetOptions }
