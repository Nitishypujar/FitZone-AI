import { Link } from 'react-router-dom'

const steps = [
  {
    number: '01',
    title: 'Assess',
    description:
      'Start by understanding your goals, experience, preferences, schedule, and current fitness routine.',
  },
  {
    number: '02',
    title: 'Plan',
    description:
      'Use your profile and goals to create a structured fitness journey that fits your individual needs.',
  },
  {
    number: '03',
    title: 'Track',
    description:
      'Record workouts, goals, habits, and progress so your fitness journey becomes measurable.',
  },
  {
    number: '04',
    title: 'Adapt',
    description:
      'Use your progress data to generate more relevant insights and continuously improve your routine.',
  },
]

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <p className="eyebrow">ABOUT FITZONE AI</p>

        <h1>
          Fitness should
          <br />
          <span>adapt to you.</span>
        </h1>

        <p>
          FitZone AI is being built around a simple idea: your fitness
          experience should become more personal as the system learns from your
          goals, habits, and progress.
        </p>
      </section>

      <section className="problem-section">
        <div className="problem-label">
          <p className="eyebrow">THE PROBLEM</p>
        </div>

        <div className="problem-content">
          <h2>
            Generic plans don't understand
            <span> your journey.</span>
          </h2>

          <p>
            Many fitness experiences separate workout planning, progress
            tracking, nutrition, and guidance into different places. That can
            make it difficult to understand what is actually working.
          </p>

          <p>
            FitZone AI aims to bring these pieces together into one connected
            system where your goals and progress can influence the experience
            over time.
          </p>
        </div>
      </section>

      <section className="vision-section">
        <div className="section-heading">
          <p className="eyebrow">THE FITZONE APPROACH</p>

          <h2>
            One journey.
            <br />
            <span>Four connected stages.</span>
          </h2>
        </div>

        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span className="step-number">{step.number}</span>

              <h3>{step.title}</h3>

              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="technology-section">
        <div className="technology-content">
          <p className="eyebrow">BUILT TO EVOLVE</p>

          <h2>
            From fitness tracking
            <br />
            to <span>fitness intelligence.</span>
          </h2>

          <p>
            The long-term goal is to combine reliable user data, analytics,
            machine learning, and intelligent assistance into a single
            platform.
          </p>

          <p>
            Advanced capabilities such as computer-vision-based exercise
            analysis are planned for future development and will be introduced
            only after they are properly built and tested.
          </p>
        </div>

        <div className="technology-stack">
          <div>
            <strong>01</strong>
            <span>USER DATA</span>
          </div>

          <div>
            <strong>02</strong>
            <span>ANALYTICS</span>
          </div>

          <div>
            <strong>03</strong>
            <span>AI SYSTEMS</span>
          </div>

          <div>
            <strong>04</strong>
            <span>INTELLIGENT INSIGHTS</span>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <p className="eyebrow">START YOUR JOURNEY</p>

        <h2>
          Build consistency.
          <br />
          <span>Train with purpose.</span>
        </h2>

        <p>
          Explore the FitZone AI experience and see where your fitness journey
          can begin.
        </p>

        <Link to="/membership" className="primary-button">
          Explore Membership
        </Link>
      </section>
    </main>
  )
}

export default About