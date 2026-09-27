// ============================================
// FITZONE REQUEST VALIDATION HELPERS
// ============================================

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function isNonEmptyString(value, maxLength = 255) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  )
}

function isValidEmail(value) {
  if (typeof value !== 'string') {
    return false
  }

  const email = value.trim()

  if (email.length > 254) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidBoolean(value) {
  return typeof value === 'boolean'
}

function isValidInteger(
  value,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER,
) {
  return (
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  )
}

function isValidNumber(
  value,
  min = -Infinity,
  max = Infinity,
) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
  )
}

function isValidPositiveIntegerId(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    return false
  }

  const normalized = String(value).trim()

  if (!/^[1-9][0-9]*$/.test(normalized)) {
    return false
  }

  try {
    const parsed = BigInt(normalized)
    return parsed > 0n && parsed <= 9223372036854775807n
  } catch {
    return false
  }
}

function isValidUuid(value) {
  if (typeof value !== 'string') {
    return false
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function isAllowedValue(value, allowedValues) {
  return allowedValues.includes(value)
}

function requireBodyObject(req, res) {
  if (!isPlainObject(req.body)) {
    res.status(400).json({
      status: 'error',
      message: 'Request body must be a JSON object',
    })

    return false
  }

  return true
}

function rejectUnknownFields(
  body,
  allowedFields,
) {
  const unknownFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  )

  if (unknownFields.length > 0) {
    return unknownFields
  }

  return []
}

module.exports = {
  isPlainObject,
  isNonEmptyString,
  isValidEmail,
  isValidBoolean,
  isValidInteger,
  isValidNumber,
  isValidUuid,
  isValidPositiveIntegerId,
  isAllowedValue,
  requireBodyObject,
  rejectUnknownFields,
}