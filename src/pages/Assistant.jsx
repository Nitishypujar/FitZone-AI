import { useEffect, useState } from 'react'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const CHAT_STORAGE_KEY = 'fitzone_assistant_messages'

const welcomeMessage = {
  id: 1,
  sender: 'ai',
  text: "Hi! I'm your FitZone AI assistant. Ask me about your workouts, goals, consistency, progress, nutrition, or general fitness routine.",
}

function loadSavedMessages() {
  try {
    const saved = sessionStorage.getItem(CHAT_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Corrupt or inaccessible storage — fall back to a fresh conversation.
  }
  return [welcomeMessage]
}

const suggestedQuestions = [
  'What should I do for my next workout?',
  'How can I improve my consistency?',
  'Give me a simple recovery routine.',
  'How can I stay motivated this week?',
]

function Assistant() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [messages, setMessages] = useState(loadSavedMessages)

  // Keep the conversation alive across page navigation within this tab.
  // Clears naturally when the tab/browser closes, unlike localStorage,
  // since a chat session shouldn't outlive the browsing session forever.
  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // Storage full or unavailable — conversation just won't persist.
    }
  }, [messages])

  async function sendMessage(event) {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage || loading) {
      return
    }

    const token = localStorage.getItem('fitzone_access_token')

    if (!token) {
      const errorMessage = {
        id: `${Date.now()}-auth-error`,
        sender: 'ai',
        text: 'Your FitZone session has expired. Please log in again.',
      }

      setMessages((previous) => [...previous, errorMessage])
      return
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: trimmedMessage,
    }

    setMessages((previous) => [...previous, userMessage])
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/assistant/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            question: trimmedMessage,
            conversation_history: messages
              .filter(
                (item) =>
                  item.sender === 'user' ||
                  item.sender === 'ai'
              )
              .slice(-12)
              .map((item) => ({
                sender: item.sender,
                text: item.text,
              })),
          }),
        }
      )

      let data = {}

      try {
        data = await response.json()
      } catch {
        data = {}
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `FitZone AI request failed with status ${response.status}.`
        )
      }

      const answer =
        data?.answer ||
        data?.response ||
        data?.message ||
        'I could not generate a response right now.'

      const aiMessage = {
        id: `${Date.now()}-ai`,
        sender: 'ai',
        text: answer,
      }

      setMessages((previous) => [...previous, aiMessage])
    } catch (error) {
      console.error('Assistant request failed:', error)

      const errorMessage = {
        id: `${Date.now()}-error`,
        sender: 'ai',
        text:
          error?.message ||
          'I could not connect to FitZone AI right now. Please try again.',
      }

      setMessages((previous) => [...previous, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  function applySuggestion(question) {
    setMessage(question)
  }

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
            Ask questions about your workouts, goals, consistency, progress,
            nutrition, and general fitness routine. FitZone AI uses your
            available fitness data to make responses more personalized.
          </p>
        </div>

        <div className="assistant-status">
          <span className="ai-badge">AI</span>

          <div>
            <strong>ASSISTANT STATUS</strong>
            <p>Connected</p>
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
                <span>Personalized fitness guidance</span>
              </div>
            </div>

            <span className="assistant-online">
              <i></i>
              ONLINE
            </span>
          </div>

          <div className="assistant-messages">
            {messages.map((item) => (
              <div
                className={`assistant-message ${item.sender}`}
                key={item.id}
              >
                <div className="message-label">
                  {item.sender === 'ai' ? 'FITZONE AI' : 'YOU'}
                </div>

                <p>{item.text}</p>
              </div>
            ))}

            {loading && (
              <div className="assistant-message ai">
                <div className="message-label">FITZONE AI</div>
                <p>Thinking about your FitZone data...</p>
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

            <button
              type="submit"
              aria-label="Send message"
              disabled={loading || !message.trim()}
            >
              →
            </button>
          </form>
        </div>

        <aside className="assistant-side-panel">
          <div>
            <p className="eyebrow">QUICK QUESTIONS</p>

            <h2>Start a conversation.</h2>
          </div>

          <div className="suggestion-list">
            {suggestedQuestions.map((question) => (
              <button
                type="button"
                key={question}
                onClick={() => applySuggestion(question)}
                disabled={loading}
              >
                <span>+</span>
                {question}
              </button>
            ))}
          </div>

          <div className="assistant-context">
            <p className="eyebrow">LIVE CONTEXT</p>

            <div>
              <span>GOALS</span>
              <strong>Connected</strong>
            </div>

            <div>
              <span>WORKOUT HISTORY</span>
              <strong>Connected</strong>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>Connected</strong>
            </div>

            <div>
              <span>NUTRITION</span>
              <strong>Connected</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="assistant-disclaimer">
        <span>i</span>

        <p>
          FitZone AI is designed for general fitness and wellness guidance. It
          is not a substitute for professional medical advice, diagnosis, or
          treatment.
        </p>
      </section>
    </main>
  )
}

export default Assistant