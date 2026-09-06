import { Link } from 'react-router-dom'

const services = [
  {
    number: '01',
    title: 'AI Fitness Assessment',
    description:
      'Build a fitness profile around your goals, experience, schedule, and preferences so the platform can understand where to start.',
    tag: 'PERSONALIZATION',
  },
  {
    number: '02',
    title: 'Personalized Workout Plans',
    description:
      'Receive structured workout recommendations designed around your fitness goals and adjusted as your progress changes.',
    tag: 'AI PLANNING',
  },
  {
    number: '03',
    title: 'Progress Intelligence',
    description:
      'Track workouts, consistency, performance, and goals while turning your history into useful progress insights.',
    tag: 'ANALYTICS',
  },
  {
    number: '04',
    title: 'Nutrition & Wellness',
    description:
      'Keep your nutrition and wellness habits organized alongside your fitness journey for a more complete view of your routine.',
    tag: 'WELLNESS',
  },
  {
    number: '05',
    title: 'AI Fitness Assistant',
    description:
      'Ask questions about your workouts, goals, and routine and receive helpful guidance based on the information available in your profile.',
    tag: 'AI ASSISTANT',
  },
  {
    number: '06',
    title: 'Exercise Form Analysis',
    description:
      'An advanced computer-vision feature planned for a future phase that can analyze exercise movement and provide form feedback.',
    tag: 'COMPUTER VISION',
  },
]

function Services() {
  return (
    <main className="services-page">
      <section className="services-hero">
        <p className="eyebrow">THE FITZONE AI SYSTEM</p>

        <h1>
          Everything you need
          <br />
          to <span>train smarter.</span>
        </h1>

        <p>
          FitZone AI brings planning, tracking, analytics, and intelligent
          assistance together into one connected fitness experience.
        </p>
      </section>

      <section className="services-grid-section">
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.number}>
              <div className="service-top">
                <span className="service-number">{service.number}</span>
                <span className="service-tag">{service.tag}</span>
              </div>

              <div className="service-content">
                <h2>{service.title}</h2>

                <p>{service.description}</p>
              </div>

              <div className="service-arrow">↗</div>
            </article>
          ))}
        </div>
      </section>

      <section className="services-cta">
        <p className="eyebrow">READY TO START?</p>

        <h2>
          Your fitness journey.
          <br />
          <span>Your system.</span>
        </h2>

        <p>
          Start with a personalized fitness experience and build from there.
        </p>

        <Link to="/membership" className="primary-button">
          Explore Membership
        </Link>
      </section>
    </main>
  )
}

export default Services