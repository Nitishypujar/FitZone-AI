import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

const suggestedQuestions = [
  'What should I do for my next workout?',
  'How can I improve my consistency?',
  'Give me a simple recovery routine.',
  'How am I doing this week?',
]

function getCurrentUserKey() {
  try {
    const user = JSON.parse(localStorage.getItem('fitzone_user') || 'null')
    if (user?.id || user?.email) return user.id || user.email

    const token = localStorage.getItem('fitzone_access_token') || ''
    const payload = token.split('.')[1]
    if (payload) {
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
      if (decoded?.sub) return decoded.sub
    }
  } catch {
    // Fall through to a stable anonymous browser key.
  }
  return 'current-user'
}

function getAssistantStorageKey() {
  return `fitzone_assistant_v2_${getCurrentUserKey()}`
}

function readSavedMessages() {
  try {
    const key = getAssistantStorageKey()
    const saved = JSON.parse(localStorage.getItem(key) || 'null')
    if (Array.isArray(saved) && saved.length > 0) return saved.slice(-40)
  } catch {
    // Ignore corrupted local conversation state.
  }

  return [
    {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I'm your FitZone AI assistant. I use your current fitness state, weekly progress, recommendation engine, and conversation context to help you decide what to do next.",
    },
  ]
}

function formatGoal(goal) {
  if (!goal) return 'General Fitness'
  return String(goal)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function Assistant() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(readSavedMessages)

  const token = localStorage.getItem('fitzone_access_token')

  const intelligenceQuery = useQuery({
    queryKey: ['intelligence'],
    queryFn: () => api.get('/api/intelligence/snapshot'),
    enabled: Boolean(token),
    staleTime: 15 * 1000,
  })

  const intelligence = intelligenceQuery.data
  const userState = intelligence?.user_state
  const nextAction = intelligence?.next_best_action

  const weeklySummary = useMemo(() => {
    const state = userState?.goal_state || {}
    return {
      workouts: Number(state.current_weekly_workouts || 0),
      workoutTarget: Number(state.weekly_workout_target || 0),
      minutes: Number(state.current_weekly_active_minutes || 0),
      minuteTarget: Number(state.weekly_active_minute_target || 0),
    }
  }, [userState])

  useEffect(() => {
    try {
      const key = getAssistantStorageKey()
      localStorage.setItem(key, JSON.stringify(messages.slice(-40)))
    } catch {
      // Conversation persistence is best effort only.
    }
  }, [messages])

  useEffect(() => {
    function handleStorage(event) {
      if (event.key !== getAssistantStorageKey() || !event.newValue) return
      try {
        const next = JSON.parse(event.newValue)
        if (Array.isArray(next)) setMessages(next.slice(-40))
      } catch {
        // Ignore malformed cross-tab state.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function clearConversation() {
    const welcome = {
      id: 'welcome',
      sender: 'ai',
      text: "Hi! I'm your FitZone AI assistant. I use your current fitness state, weekly progress, recommendation engine, and conversation context to help you decide what to do next.",
    }
    setMessages([welcome])
    localStorage.removeItem(getAssistantStorageKey())
  }

  async function sendMessage(event) {
    event.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage || loading) return

    if (!token) {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-auth-error`,
          sender: 'ai',
          text: 'Your FitZone session has expired. Please log in again.',
        },
      ])
      return
    }

    const conversationHistory = messages
      .filter((item) => item.sender === 'user' || item.sender === 'ai')
      .slice(-12)
      .map((item) => ({ sender: item.sender, text: item.text }))

    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        sender: 'user',
        text: trimmedMessage,
      },
    ])
    setMessage('')
    setLoading(true)

    try {
      const data = await api.post('/api/assistant/chat', {
        question: trimmedMessage,
        conversation_history: conversationHistory,
      })

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-ai`,
          sender: 'ai',
          text:
            data?.answer ||
            data?.response ||
            'I could not generate a response right now.',
        },
      ])

      await queryClient.invalidateQueries({ queryKey: ['intelligence'] })
      await queryClient.invalidateQueries({ queryKey: ['recommendation'] })
    } catch (error) {
      console.error('Assistant request failed:', error)
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          sender: 'ai',
          text: error?.message || 'I could not connect to FitZone AI right now. Please try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function applySuggestion(question) {
    setMessage(question)
  }

  const contextStatus = intelligenceQuery.isLoading
    ? 'Syncing'
    : intelligenceQuery.isError
      ? 'Unavailable'
      : 'Live'

  return (
    <main className="assistant-page">
      <section className="assistant-header">
        <div>
          <p className="eyebrow">FITZONE AI ASSISTANT</p>
          <h1>
            Your fitness
            <br />
            <span>conversation.</span>
          </h1>
          <p>
            Ask about workouts, goals, consistency, progress, nutrition, or your next step. The assistant uses the same adaptive intelligence that powers your FitZone recommendations.
          </p>
        </div>

        <div className="assistant-status">
          <span className="ai-badge">AI</span>
          <div>
            <strong>ASSISTANT STATUS</strong>
            <p>{contextStatus}</p>
          </div>
          <span className="assistant-status-dot"></span>
        </div>
      </section>

      <section className="assistant-workspace">
        <div className="assistant-chat">
          <div className="assistant-chat-header">
            <div>
              <span className="assistant-avatar">AI</span>
              <div>
                <strong>FitZone Assistant</strong>
                <span>Adaptive fitness guidance</span>
              </div>
            </div>
            <div className="assistant-header-actions">
              <span className="assistant-online">
                <i></i>
                {contextStatus.toUpperCase()}
              </span>
              <button type="button" className="assistant-clear" onClick={clearConversation} disabled={loading}>Clear chat</button>
            </div>
          </div>

          <div className="assistant-messages">
            {messages.map((item) => (
              <div className={`assistant-message ${item.sender}`} key={item.id}>
                <div className="message-label">
                  {item.sender === 'ai' ? 'FITZONE AI' : 'YOU'}
                </div>
                <p>{item.text}</p>
              </div>
            ))}
            {loading && (
              <div className="assistant-message ai">
                <div className="message-label">FITZONE AI</div>
                <p>Reading your current FitZone state...</p>
              </div>
            )}
          </div>

          <form className="assistant-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask FitZone AI something..."
              disabled={loading}
            />
            <button type="submit" aria-label="Send message" disabled={loading || !message.trim()}>
              →
            </button>
          </form>
        </div>

        <aside className="assistant-side-panel">
          <div>
            <p className="eyebrow">NEXT BEST ACTION</p>
            <h2>{nextAction?.action ? formatGoal(nextAction.action) : 'Syncing your plan.'}</h2>
            <p>
              {nextAction?.reason || 'Your adaptive recommendation will appear here when the latest fitness state is available.'}
            </p>
          </div>

          <div className="suggestion-list">
            {suggestedQuestions.map((question) => (
              <button type="button" key={question} onClick={() => applySuggestion(question)} disabled={loading}>
                <span>+</span>
                {question}
              </button>
            ))}
          </div>

          <div className="assistant-context">
            <p className="eyebrow">LIVE CONTEXT</p>
            <div><span>GOAL</span><strong>{formatGoal(userState?.profile?.primary_goal)}</strong></div>
            <div><span>FITNESS LEVEL</span><strong>{userState?.profile?.fitness_level || '—'}</strong></div>
            <div><span>WEEKLY WORKOUTS</span><strong>{weeklySummary.workouts}/{weeklySummary.workoutTarget || '—'}</strong></div>
            <div><span>ACTIVE MINUTES</span><strong>{weeklySummary.minutes}/{weeklySummary.minuteTarget || '—'}</strong></div>
            <div><span>READINESS</span><strong>{nextAction?.readiness?.score ?? '—'}</strong></div>
            <div><span>ML</span><strong>{nextAction?.ml_source === 'trained_model' ? 'Trained model' : nextAction?.ml_source === 'cold_start' ? 'Cold-start' : 'Unavailable'}</strong></div>
          </div>
        </aside>
      </section>

      <section className="assistant-disclaimer">
        <span>i</span>
        <p>
          FitZone AI is designed for general fitness and wellness guidance. It is not a substitute for professional medical advice, diagnosis, or treatment.
        </p>
      </section>
    </main>
  )
}

export default Assistant
