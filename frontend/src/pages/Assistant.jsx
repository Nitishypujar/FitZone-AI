import { useState } from 'react'

const suggestedQuestions = [
  'What should I do for my next workout?',
  'How can I improve my consistency?',
  'Give me a simple recovery routine.',
  'How can I stay motivated this week?',
]

function getResponse(message) {
  const text = message.toLowerCase()

  if (text.includes('workout')) {
    return "Based on your current fitness profile, staying consistent with your planned strength sessions would be a good next step. In the future, I'll use your actual workout history and goals to make this recommendation more personalized."
  }

  if (text.includes('consistency')) {
    return 'You are currently building good momentum. Focus on completing your planned sessions rather than trying to make every workout perfect. Small, repeatable actions are easier to maintain over time.'
  }

  if (text.includes('recovery')) {
    return 'A simple recovery routine could include light walking, gentle mobility work, hydration, and adequate rest. Your recovery routine should match your training intensity and how you feel.'
  }

  if (text.includes('motivat')) {
    return 'Try setting one small target for today instead of focusing on the entire week. Completing one manageable action can help maintain momentum.'
  }

  return "That's a great question. I'm currently running in prototype mode. Once the FitZone AI backend is connected, I'll be able to use your goals, workouts, progress, and profile information to provide more personalized fitness guidance."
}

function Assistant() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi! I'm your FitZone AI assistant. Ask me about your workouts, goals, consistency, or general fitness routine.",
    },
  ])

  function sendMessage(event) {
    event.preventDefault()

    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return
    }

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: trimmedMessage,
    }

    const aiMessage = {
      id: Date.now() + 1,
      sender: 'ai',
      text: getResponse(trimmedMessage),
    }

    setMessages((previous) => [...previous, userMessage, aiMessage])
    setMessage('')
  }

  function useSuggestion(question) {
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
            Ask questions about your workouts, goals, consistency, and general
            fitness routine. The assistant will eventually use your personal
            FitZone data to make its responses more relevant.
          </p>
        </div>

        <div className="assistant-status">
          <span className="ai-badge">AI</span>

          <div>
            <strong>ASSISTANT STATUS</strong>
            <p>Prototype mode</p>
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
                <span>General fitness guidance</span>
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
          </div>

          <form className="assistant-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Ask FitZone AI something..."
            />

            <button type="submit" aria-label="Send message">
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
                onClick={() => useSuggestion(question)}
              >
                <span>+</span>
                {question}
              </button>
            ))}
          </div>

          <div className="assistant-context">
            <p className="eyebrow">FUTURE CONTEXT</p>

            <div>
              <span>GOALS</span>
              <strong>Connected later</strong>
            </div>

            <div>
              <span>WORKOUT HISTORY</span>
              <strong>Connected later</strong>
            </div>

            <div>
              <span>PROGRESS</span>
              <strong>Connected later</strong>
            </div>

            <div>
              <span>NUTRITION</span>
              <strong>Connected later</strong>
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