# 🏋️ FitZone AI

> An AI-powered fitness platform that combines workout tracking, nutrition planning, progress analysis, and adaptive recommendations into one intelligent fitness experience.

**Plan → Train → Track → Analyze → Adapt → Repeat**

FitZone AI is built around the idea that fitness recommendations should evolve from real user activity instead of remaining static plans.

---

## ✨ Key Features

- 🧠 **Adaptive Fitness Intelligence** — analyzes the user's current fitness state and determines the next best action.
- 🏋️ **Workout Management** — workout planning, exercise tracking, and completion tracking.
- 📊 **Progress Intelligence** — weekly activity, active minutes, workout history, streaks, and goal progress.
- 🥗 **Nutrition Planning** — calorie and protein targets based on the user's active fitness goal.
- 🤖 **AI Assistant** — uses Gemini to explain fitness decisions and answer user questions.
- 🎯 **Goal Management** — tracks workout frequency, activity targets, and fitness goals.
- 🔐 **Security & User Isolation** — authentication, validation, protected routes, CORS, and security middleware.
- 🔄 **Adaptive Recommendations** — recommendations respond to the user's current state and activity.

---

## 🧠 Fitness Intelligence

The core of FitZone AI is the **Fitness Brain**.

It combines signals such as:

- Fitness goal
- Experience level
- Weekly workout activity
- Active minutes
- Recent workout completion
- Progress toward targets
- Readiness and behavioral signals

These signals are used to create an intelligence snapshot that powers the dashboard, AI Plan, workout experience, nutrition planning, and assistant.

### Recommendation ≠ Completion

A recommendation is **not** treated as a completed workout.

Viewing or accepting a recommendation does not change workout completion data. Completion is recorded only when the actual workout is completed.

This keeps **recommendation data** and **real activity data** separate.

---

## 🏗️ Architecture

**React + Vite**  
↓  
**Node.js + Express**  
↓  
**Fitness Brain + Recommendation System + Application APIs**  
↓  
**Supabase / PostgreSQL**

The backend also communicates with:

**Python + FastAPI ML Service**

and

**Gemini AI**

Gemini acts as an **explanation and interaction layer**. The application's fitness intelligence remains responsible for the actual recommendation logic.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL / Supabase |
| AI Assistant | Gemini |
| ML Service | Python, FastAPI |
| Authentication | JWT / Application Authentication |
| Styling | CSS |
| Testing | Node Test Suite, ESLint, Vite Build |
| Version Control | Git & GitHub |

---

## 📱 Main Application Areas

| Area | Purpose |
|---|---|
| **Dashboard** | Current fitness state, weekly activity, goals, and next recommended action |
| **My Workout** | Workout execution and completion tracking |
| **AI Plan** | Current recommendation and reasoning |
| **Progress** | Activity, workouts, active minutes, streaks, and goal progress |
| **Nutrition** | Calorie and protein targets |
| **Goals** | Fitness objectives and weekly targets |
| **AI Assistant** | Natural-language fitness interaction and explanations |
| **Profile** | Personalization and account information |

---

## 🔐 Engineering Principles

FitZone AI focuses on correctness and data integrity rather than simply adding AI features.

Key decisions include:

- Workout completion is recorded only through the actual completion flow.
- Recommendations are never automatically marked as completed.
- Workout IDs remain compatible with the existing database schema.
- Recommendation event IDs remain UUID-based.
- User data is isolated between accounts.
- Protected routes require authentication.
- API inputs are validated.
- Security middleware and CORS policies are configured.
- Current intelligence is derived from application state rather than stale UI assumptions.
- Completed workouts are not incorrectly presented as pending workouts.

---

## 🧪 Testing

The project includes automated checks covering:

- Authentication and protected routes
- User-data isolation
- Workout completion behavior
- Recommendation integrity
- API validation
- Security policies
- CORS configuration
- Assistant integration
- Nutrition functionality
- Fitness intelligence behavior
- Frontend linting
- Frontend production build

The project is tested locally before major changes are finalized.

---

## 🚀 Running Locally

### Clone the repository

    git clone https://github.com/Nitishypujar/FitZone-AI.git
    cd FitZone-AI

### Install frontend dependencies

    cd frontend
    npm install

### Install backend dependencies

    cd ../backend
    npm install

### Install ML service dependencies

    cd ../ai-service
    pip install -r requirements.txt

### Configure environment variables

Create the required environment configuration for the frontend, backend, database, Gemini integration, and ML service.

Never commit API keys, database credentials, or other secrets.

### Start the services

Run the frontend, backend, and ML service according to the project's local development configuration.

---

## 📂 Project Structure

    FitZone-AI/
    ├── frontend/       # React + Vite application
    ├── backend/        # Express API and application logic
    ├── ai-service/     # Python ML service
    ├── models/         # Model-related resources
    ├── docs/           # Supporting documentation
    ├── README.md
    └── PROJECT_STATE.md

---

## 🔮 Future Direction

- More personalized ML models as meaningful user data grows
- Stronger behavioral and adherence modeling
- More advanced workout adaptation
- Improved nutrition intelligence
- Deeper progress analytics
- Expanded automated testing
- Further performance and accessibility improvements

The current system uses a **cold-start approach** rather than pretending that a large personalized ML dataset already exists.

---

## 💡 Project Focus

FitZone AI is more than a fitness website with an AI chatbot.

Its central loop is:

**User Data → Fitness State → Recommendation → Real Activity → New Evidence**

The goal is to build a system where recommendations can become increasingly personalized as reliable user activity is collected.

---

## 👨‍💻 Author

**Nitish Y Pujar**

BTech AI/ML Student | Full-Stack & AI/ML Developer

GitHub: https://github.com/Nitishypujar

---

## 📌 Project Status

FitZone AI is an actively developed AI/full-stack project focused on adaptive fitness intelligence, recommendation systems, workout tracking, nutrition planning, progress analysis, and explainable AI-assisted interaction.

**Built with a focus on correctness, explainability, and practical engineering.**