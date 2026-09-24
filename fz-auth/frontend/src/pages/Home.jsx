import { Link } from 'react-router-dom'

function Home() {
  return (
    <>
      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <p className="eyebrow">INTELLIGENT FITNESS PLATFORM</p>

            <h1>
              Train smarter.
              <br />
              <span>Become stronger.</span>
            </h1>

            <p className="hero-description">
              FitZone AI combines personalized fitness planning, progress
              tracking, and intelligent insights to help you build a healthier
              routine that actually fits your goals.
            </p>

            <div className="hero-actions">
              <Link to="/membership" className="primary-button">
                Start Your Journey
              </Link>

              <a href="#features" className="secondary-button">
                Explore Features
              </a>
            </div>

            <div className="hero-trust">
              <div>
                <strong>AI</strong>
                <span>Personalized Plans</span>
              </div>

              <div>
                <strong>24/7</strong>
                <span>Fitness Assistant</span>
              </div>

              <div>
                <strong>360°</strong>
                <span>Progress Insights</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="glow"></div>

            <div className="fitness-card">
              <div className="card-header">
                <span>YOUR FITNESS JOURNEY</span>
                <span className="status-dot"></span>
              </div>

              <div className="score">
                <strong>78</strong>
                <span>/ 100</span>
              </div>

              <p>Weekly Fitness Score</p>

              <div className="progress-track">
                <div className="progress-value"></div>
              </div>

              <div className="card-stats">
                <div>
                  <strong>4</strong>
                  <span>Workouts</span>
                </div>

                <div>
                  <strong>2.8h</strong>
                  <span>Active Time</span>
                </div>

                <div>
                  <strong>86%</strong>
                  <span>Goal Progress</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="section-heading">
            <p className="eyebrow">BUILT AROUND YOU</p>

            <h2>Fitness that gets smarter with you.</h2>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-icon">01</div>

              <h3>Personalized Plans</h3>

              <p>
                Workout recommendations designed around your goals, experience,
                schedule, and progress.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">02</div>

              <h3>Progress Intelligence</h3>

              <p>
                Turn your workout history into meaningful insights and
                understand how your consistency is improving.
              </p>
            </article>

            <article className="feature-card">
              <div className="feature-icon">03</div>

              <h3>AI Fitness Assistant</h3>

              <p>
                Get helpful guidance about your workouts, goals, and fitness
                routine whenever you need it.
              </p>
            </article>
          </div>
        </section>

        <section className="about-preview" id="about">
          <p className="eyebrow">THE FITZONE VISION</p>

          <h2>
            Not another fitness website.
            <br />
            A <span>personal fitness system.</span>
          </h2>

          <p>
            FitZone AI is being built to connect planning, tracking, analytics,
            and artificial intelligence into one focused fitness experience.
          </p>
        </section>
      </main>
    </>
  )
}

export default Home