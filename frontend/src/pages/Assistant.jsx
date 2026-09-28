import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { useFitnessBrain } from '../hooks/useFitnessBrain'

const suggestedQuestions = [
  'What should I do for my next workout?',
  'How am I doing this week?',
  'How can I improve my consistency?',
  'What should I focus on today?',
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
    // Use a stable browser key when session data is unreadable.
  }
  return 'current-user'
}

function getAssistantStorageKey() {
  return `fitzone_assistant_v4_${getCurrentUserKey()}`
}

function welcomeMessage() {
  return {
    id: 'welcome',
    sender: 'ai',
    text: "Hi. I'm FitZone AI. Ask me about your workout, progress, nutrition, goals, or what to do next. I'll use your current FitZone data when it's available.",
    source: 'fitzone',
  }
}

function readSavedMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(getAssistantStorageKey()) || 'null')
    if (Array.isArray(saved) && saved.length > 0) {
      return [
        ...saved.slice(-40),
        {
          id: 'state-refresh-v4',
          sender: 'ai',
          text: 'Live fitness state has been refreshed. New answers use your current workouts, goals, progress and nutrition data; earlier messages remain as conversation history.',
          source: 'system',
        },
      ]
    }
  } catch {
    // Ignore corrupted local conversation state.
  }
  return [welcomeMessage()]
}

function formatGoal(goal) {
  if (!goal) return 'Not set'
  return String(goal).replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function Assistant() {
  const queryClient = useQueryClient()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState(readSavedMessages)
  const [lastFailedQuestion, setLastFailedQuestion] = useState('')

  const token = localStorage.getItem('fitzone_access_token')
  const assistantTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const intelligenceQuery = useFitnessBrain({ timeZone: assistantTimeZone, enabled: Boolean(token) })

  const brain = intelligenceQuery.data || null
  const intelligence = brain?.intelligence || brain
  const userState = intelligence?.user_state
  const nextAction = intelligence?.next_best_action

  const weeklySummary = useMemo(() => {
    const state = userState?.goal_state || {}
    const goal = state.active_goal || {}
    return {
      workouts: Number(state.current_weekly_workouts || 0),
      workoutTarget: goal.weekly_workout_target ?? null,
      minutes: Number(state.current_weekly_active_minutes || 0),
      minuteTarget: goal.weekly_active_minute_target ?? null,
    }
  }, [userState])

  useEffect(() => {
    try {
      localStorage.setItem(getAssistantStorageKey(), JSON.stringify(messages.slice(-40)))
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
    setMessages([welcomeMessage()])
    setLastFailedQuestion('')
    localStorage.removeItem(getAssistantStorageKey())
  }

  async function sendQuestion(question) {
    const trimmedMessage = String(question || '').trim()
    if (!trimmedMessage || loading) return

    if (!token) {
      setMessages((previous) => [...previous, { id: `${Date.now()}-auth`, sender: 'ai', text: 'Your FitZone session has expired. Please log in again.', source: 'fitzone' }])
      return
    }

    const conversationHistory = messages
      .filter((item) => item.sender === 'user' || item.sender === 'ai')
      .slice(-12)
      .map((item) => ({ sender: item.sender, text: item.text }))

    setMessages((previous) => [...previous, { id: `${Date.now()}-user`, sender: 'user', text: trimmedMessage }])
    setMessage('')
    setLastFailedQuestion('')
    setLoading(true)

    try {
      const data = await api.post('/api/assistant/chat', {
        question: trimmedMessage,
        conversation_history: conversationHistory,
      })

      setMessages((previous) => [...previous, {
        id: `${Date.now()}-ai`,
        sender: 'ai',
        text: data?.answer || data?.response || 'I could not generate a response right now.',
        source: data?.response_source || 'gemini',
      }])
      await queryClient.invalidateQueries({ queryKey: ['intelligence'] })
    queryClient.invalidateQueries({ queryKey: ['fitness-brain'] })
      await queryClient.invalidateQueries({ queryKey: ['recommendation'] })
    } catch (error) {
      console.error('Assistant request failed:', error)
      setLastFailedQuestion(trimmedMessage)
      setMessages((previous) => [...previous, {
        id: `${Date.now()}-error`,
        sender: 'ai',
        text: error?.message || 'I could not connect to FitZone AI right now. Please try again.',
        source: 'error',
      }])
    } finally {
      setLoading(false)
    }
  }

  function sendMessage(event) {
    event.preventDefault()
    sendQuestion(message)
  }

  function handleComposerKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendQuestion(message)
    }
  }

  const contextStatus = intelligenceQuery.isLoading ? 'Syncing your data' : intelligenceQuery.isError ? 'State unavailable' : 'Live fitness state'

  return (
    <main className="assistant-page">
      <section className="assistant-header">
        <div>
          <p className="eyebrow">FITZONE AI ASSISTANT</p>
          <h1>Your fitness<br /><span>co-pilot.</span></h1>
          <p>One conversation connected to your real workouts, goals, progress, nutrition and adaptive recommendations.</p>
        </div>
        <div className="assistant-status">
          <span className="ai-badge">AI</span>
          <div><strong>FITZONE INTELLIGENCE</strong><p>{contextStatus}</p></div>
          <span className={`assistant-status-dot ${intelligenceQuery.isError ? 'offline' : ''}`}></span>
        </div>
      </section>

      <section className="assistant-workspace">
        <div className="assistant-chat">
          <div className="assistant-chat-header">
            <div className="assistant-chat-identity">
              <img src="/fitzone-mark.svg" alt="FitZone AI" className="assistant-brand-mark" />
              <div><strong>FitZone AI</strong><span>Adaptive fitness guidance</span></div>
            </div>
            <div className="assistant-header-actions">
              <span className="assistant-online"><i></i>{intelligenceQuery.isError ? 'STATE LIMITED' : 'CONNECTED'}</span>
              <button type="button" className="assistant-clear" onClick={clearConversation} disabled={loading}>Clear</button>
            </div>
          </div>

          <div className="assistant-messages" aria-live="polite">
            {messages.map((item) => (
              <div className={`assistant-message ${item.sender} ${item.source === 'error' ? 'error' : ''}`} key={item.id}>
                <div className="message-meta">
                  <span>{item.sender === 'ai' ? 'FITZONE AI' : 'YOU'}</span>
                  {item.sender === 'ai' && item.source === 'fitzone' && <em>LIVE STATE</em>}
                  {item.sender === 'ai' && item.source === 'gemini' && <em>AI RESPONSE</em>}
                </div>
                <p>{item.text}</p>
                {item.source === 'error' && lastFailedQuestion && <button type="button" className="assistant-retry" onClick={() => sendQuestion(lastFailedQuestion)} disabled={loading}>Try again</button>}
              </div>
            ))}
            {loading && (
              <div className="assistant-message ai typing-message">
                <div className="message-meta"><span>FITZONE AI</span><em>THINKING</em></div>
                <p className="typing-copy">Reading your current fitness state</p>
                <div className="typing-dots"><i></i><i></i><i></i></div>
              </div>
            )}
          </div>

          <form className="assistant-input-area" onSubmit={sendMessage}>
            <div className="assistant-composer-wrap">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask about your workout, progress, nutrition or next step…"
                rows={1}
                disabled={loading}
                aria-label="Ask FitZone AI"
              />
              <span>Enter to send · Shift + Enter for a new line</span>
            </div>
            <button type="submit" aria-label="Send message" disabled={loading || !message.trim()}><span>Send</span><b>↗</b></button>
          </form>
        </div>

        <aside className="assistant-side-panel">
          <div className="assistant-next-card">
            <p className="eyebrow">NEXT BEST ACTION</p>
            <h2>{nextAction?.action ? formatGoal(nextAction.action) : 'Preparing your plan.'}</h2>
            <p>{nextAction?.reason || 'Your adaptive recommendation will appear here when the latest fitness state is available.'}</p>
          </div>

          <div className="suggestion-list">
            <span className="assistant-side-label">ASK FITZONE</span>
            {suggestedQuestions.map((question) => <button type="button" key={question} onClick={() => sendQuestion(question)} disabled={loading}><span>+</span>{question}</button>)}
          </div>

          <div className="assistant-context">
            <p className="eyebrow">LIVE CONTEXT</p>
            <div><span>GOAL</span><strong>{formatGoal(userState?.profile?.primary_goal)}</strong></div>
            <div><span>FITNESS LEVEL</span><strong>{userState?.profile?.fitness_level || 'Not set'}</strong></div>
            <div><span>WEEKLY WORKOUTS</span><strong>{weeklySummary.workouts}/{weeklySummary.workoutTarget ?? '—'}</strong></div>
            <div><span>ACTIVE MINUTES</span><strong>{weeklySummary.minutes}/{weeklySummary.minuteTarget ?? '—'}</strong></div>
            <div><span>READINESS</span><strong>{nextAction?.readiness?.score ?? '—'}</strong></div>
            <div><span>LEARNING</span><strong>{nextAction?.historical_learning ? 'Using history' : 'Building evidence'}</strong></div>
          </div>
        </aside>
      </section>

      <section className="assistant-disclaimer"><span>i</span><p>FitZone AI provides general fitness and wellness guidance. It does not replace professional medical advice, diagnosis or treatment.</p></section>
    </main>
  )
}

export default Assistant
