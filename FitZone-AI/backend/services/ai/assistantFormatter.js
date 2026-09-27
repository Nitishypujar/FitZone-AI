const SENSITIVE_OUTPUT_PATTERNS = [
  /(?:system prompt|developer message|hidden instructions)\s*[:=]/i,
  /(?:api[_\s-]?key|service[_\s-]?role|access[_\s-]?token|refresh[_\s-]?token)\s*[:=]/i,
  /BEGIN (?:SYSTEM|DEVELOPER) INSTRUCTIONS/i,
]

function sanitizeAssistantResponse(value) {
  if (typeof value !== 'string') {
    throw new Error('Assistant response must be text')
  }

  let text = value
    .replace(/\r\n?/g, '\n')
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ''))
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/\*+/g, '')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!text) {
    throw new Error('Assistant returned an empty response')
  }

  if (text.length > 6000) {
    text = `${text.slice(0, 5997).trimEnd()}...`
  }

  if (SENSITIVE_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))) {
    throw new Error('Assistant response failed the output safety check')
  }

  return text
}

module.exports = {
  sanitizeAssistantResponse,
}
