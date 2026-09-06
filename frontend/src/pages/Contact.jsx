import { useState } from 'react'

function Contact() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <main className="contact-page">
      <section className="contact-hero">
        <p className="eyebrow">GET IN TOUCH</p>

        <h1>
          Let's build a
          <br />
          <span>healthier future.</span>
        </h1>

        <p>
          Have a question, suggestion, or idea for FitZone AI? Send us a
          message and we'll get back to you.
        </p>
      </section>

      <section className="contact-section">
        <div className="contact-info">
          <p className="eyebrow">CONTACT</p>

          <h2>
            We'd love to
            <br />
            hear from you.
          </h2>

          <p>
            Whether you're interested in the platform, have feedback about the
            experience, or want to learn more, reach out to us.
          </p>

          <div className="contact-details">
            <div>
              <span>EMAIL</span>
              <strong>hello@fitzoneai.com</strong>
            </div>

            <div>
              <span>LOCATION</span>
              <strong>Available online</strong>
            </div>

            <div>
              <span>RESPONSE</span>
              <strong>We'll get back to you soon</strong>
            </div>
          </div>
        </div>

        <div className="contact-form-wrapper">
          {submitted ? (
            <div className="success-message">
              <span className="success-icon">✓</span>

              <h3>Message received.</h3>

              <p>
                Thanks for reaching out. Your message has been recorded for
                this prototype.
              </p>

              <button
                className="secondary-button"
                onClick={() => setSubmitted(false)}
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  Name
                  <input
                    type="text"
                    name="name"
                    placeholder="Your name"
                    required
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />
                </label>
              </div>

              <label>
                Subject
                <input
                  type="text"
                  name="subject"
                  placeholder="What would you like to discuss?"
                  required
                />
              </label>

              <label>
                Message
                <textarea
                  name="message"
                  rows="7"
                  placeholder="Tell us what's on your mind..."
                  required
                ></textarea>
              </label>

              <button type="submit" className="primary-button">
                Send Message
              </button>

              <p className="form-note">
                This form is currently running in prototype mode. It will be
                connected to the FitZone AI backend in a later phase.
              </p>
            </form>
          )}
        </div>
      </section>

      <section className="contact-faq">
        <p className="eyebrow">QUICK ANSWERS</p>

        <h2>
          Before you
          <br />
          <span>reach out.</span>
        </h2>

        <div className="faq-grid">
          <article>
            <h3>Is FitZone AI available yet?</h3>
            <p>
              The platform is currently being developed as a full-stack fitness
              and AI project.
            </p>
          </article>

          <article>
            <h3>Will the AI give medical advice?</h3>
            <p>
              No. The platform is designed for general fitness and wellness
              guidance, not diagnosis or medical treatment.
            </p>
          </article>

          <article>
            <h3>What features are planned?</h3>
            <p>
              Personalized planning, progress intelligence, an AI assistant,
              and eventually computer-vision-based exercise analysis.
            </p>
          </article>

          <article>
            <h3>Can I suggest a feature?</h3>
            <p>
              Absolutely. Product feedback will help shape future versions of
              the platform.
            </p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default Contact