import { Link } from 'react-router-dom'

const plans = [
  {
    name: 'Basic',
    price: '29',
    description: 'A simple starting point for building a consistent fitness routine.',
    features: [
      'Personal fitness profile',
      'Workout tracking',
      'Basic progress insights',
      'Goal tracking',
    ],
  },
  {
    name: 'Premium',
    price: '59',
    description: 'More intelligence and guidance for people ready to level up.',
    featured: true,
    features: [
      'Everything in Basic',
      'Personalized workout plans',
      'Advanced progress analytics',
      'AI fitness insights',
      'Nutrition tracking',
    ],
  },
  {
    name: 'Elite',
    price: '99',
    description: 'The complete FitZone AI experience for a highly personalized journey.',
    features: [
      'Everything in Premium',
      'Adaptive AI planning',
      'AI fitness assistant',
      'Detailed performance analytics',
      'Priority platform features',
    ],
  },
]

function Membership() {
  return (
    <main className="membership-page">
      <section className="membership-hero">
        <p className="eyebrow">FITZONE AI MEMBERSHIP</p>

        <h1>
          Choose your
          <br />
          <span>fitness journey.</span>
        </h1>

        <p>
          Start with the tools you need today and unlock more intelligent
          fitness experiences as your goals evolve.
        </p>
      </section>

      <section className="pricing-section">
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              className={`pricing-card ${plan.featured ? 'featured' : ''}`}
              key={plan.name}
            >
              {plan.featured && (
                <div className="popular-badge">MOST POPULAR</div>
              )}

              <div className="pricing-header">
                <p className="plan-name">{plan.name}</p>

                <div className="price">
                  <span>$</span>
                  <strong>{plan.price}</strong>
                  <small>/ month</small>
                </div>

                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-divider"></div>

              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span className="check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className={
                  plan.featured
                    ? 'plan-button plan-button-primary'
                    : 'plan-button'
                }
              >
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="membership-bottom">
        <p className="eyebrow">YOUR NEXT STEP</p>

        <h2>
          Your goals deserve
          <br />
          <span>a smarter system.</span>
        </h2>

        <p>
          FitZone AI is being built to bring planning, tracking, intelligence,
          and consistency together in one platform.
        </p>

        <Link to="/contact" className="primary-button">
          Start Your Journey
        </Link>
      </section>
    </main>
  )
}

export default Membership