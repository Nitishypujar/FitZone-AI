import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { checkBackend } from '../api'

function Dashboard() {
  useEffect(() => {
    checkBackend()
      .then((data) => {
        console.log('Backend connected:', data)
      })
      .catch((error) => {
        console.error('Backend connection failed:', error)
      })
   }, [])
  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">FITZONE AI DASHBOARD</p>

          <h1>
            Welcome back,
            <br />
            <span>let's get moving.</span>
          </h1>

          <p>
            Your fitness journey at a glance. Track today's activity, monitor
            your progress, and stay consistent.
          </p>
        </div>

        <Link to="/services" className="secondary-button">
          Explore Fitness Tools
        </Link>
      </section>

      <section className="dashboard-stats">
        <article className="dashboard-stat-card">
          <span>WEEKLY SCORE</span>

          <strong>78</strong>

          <p>+8% from last week</p>
        </article>

        <article className="dashboard-stat-card">
          <span>WORKOUTS</span>

          <strong>4</strong>

          <p>of 5 weekly goal</p>
        </article>

        <article className="dashboard-stat-card">
          <span>ACTIVE TIME</span>

          <strong>2.8h</strong>

          <p>This week</p>
        </article>

        <article className="dashboard-stat-card">
          <span>CONSISTENCY</span>

          <strong>86%</strong>

          <p>Great momentum</p>
        </article>
      </section>

      <section className="dashboard-main-grid">
        <article className="dashboard-card today-workout">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">TODAY'S PLAN</p>
              <h2>Upper Body Strength</h2>
            </div>

            <span className="dashboard-status">READY</span>
          </div>

          <p className="dashboard-card-description">
            A focused strength session designed to keep you progressing toward
            your current fitness goals.
          </p>

          <div className="workout-details">
            <div>
              <span>DURATION</span>
              <strong>45 min</strong>
            </div>

            <div>
              <span>EXERCISES</span>
              <strong>6</strong>
            </div>

            <div>
              <span>INTENSITY</span>
              <strong>Moderate</strong>
            </div>
          </div>

          <button className="primary-button">Start Workout</button>
        </article>

        <article className="dashboard-card ai-insight">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">FITZONE AI</p>
              <h2>Today's insight</h2>
            </div>

            <span className="ai-badge">AI</span>
          </div>

          <div className="ai-insight-content">
            <div className="ai-score">
              <strong>4/5</strong>
              <span>weekly target</span>
            </div>

            <p>
              You're one workout away from completing your weekly target.
              Staying consistent today could help you maintain your current
              momentum.
            </p>
          </div>

          <Link to="/services" className="text-link">
            View fitness insights →
          </Link>
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <article className="dashboard-card progress-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">PROGRESS</p>
              <h2>Weekly activity</h2>
            </div>

            <span className="progress-percent">86%</span>
          </div>

          <div className="weekly-chart">
            <div className="chart-day">
              <div className="chart-bar completed" style={{ height: '78%' }}></div>
              <span>MON</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar completed" style={{ height: '92%' }}></div>
              <span>TUE</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar" style={{ height: '45%' }}></div>
              <span>WED</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar completed" style={{ height: '82%' }}></div>
              <span>THU</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar completed" style={{ height: '65%' }}></div>
              <span>FRI</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar" style={{ height: '30%' }}></div>
              <span>SAT</span>
            </div>

            <div className="chart-day">
              <div className="chart-bar" style={{ height: '20%' }}></div>
              <span>SUN</span>
            </div>
          </div>
        </article>

        <article className="dashboard-card goals-card">
          <div className="dashboard-card-heading">
            <div>
              <p className="eyebrow">YOUR GOALS</p>
              <h2>Current focus</h2>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>Weekly workouts</span>
              <strong>4 / 5</strong>
            </div>

            <div className="goal-progress">
              <div style={{ width: '80%' }}></div>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>Active minutes</span>
              <strong>168 / 200</strong>
            </div>

            <div className="goal-progress">
              <div style={{ width: '84%' }}></div>
            </div>
          </div>

          <div className="goal-item">
            <div>
              <span>Monthly consistency</span>
              <strong>86%</strong>
            </div>

            <div className="goal-progress">
              <div style={{ width: '86%' }}></div>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default Dashboard