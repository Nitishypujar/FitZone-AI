# 💪 FitZone AI

> **An AI-powered fitness platform that turns real user activity into adaptive fitness recommendations.**

**Plan → Train → Track → Analyze → Adapt → Repeat**

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-FitZone%20AI-success?style=for-the-badge)](https://fitzone-ai-web.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue?style=flat-square)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?style=flat-square)](https://nodejs.org/)
[![ML](https://img.shields.io/badge/ML-Python%20%2B%20FastAPI-orange?style=flat-square)](https://fastapi.tiangolo.com/)
[![Database](https://img.shields.io/badge/Database-Supabase-3FCF8E?style=flat-square)](https://supabase.com/)

---

## 🚀 Live Project

### 🌐 [Open FitZone AI](https://fitzone-ai-web.vercel.app)

**Production Status: 🟢 Fully Deployed & Operational**

FitZone AI is deployed using a separated production architecture:

| Service | Technology | Platform |
|---|---|---|
| Frontend | React + Vite | Vercel |
| Backend | Node.js + Express | Render |
| AI/ML Service | Python + FastAPI | Render |
| Database | PostgreSQL / Supabase | Supabase |
| AI Assistant | Gemini | Google |

### Production Services

- 🌐 **Frontend:** https://fitzone-ai-web.vercel.app
- ⚙️ **Backend:** https://fitzone-ai-backend.onrender.com
- 🧠 **AI/ML Service:** https://fitzone-ai-ml.onrender.com

> `fitzoneai.com` has been added to the production project. DNS configuration is pending.

---

## ✨ What Makes FitZone AI Different?

FitZone AI is designed around a simple principle:

> **Recommendations should evolve from real activity — not remain static plans.**

Instead of treating AI as only a chatbot, the platform connects:

**User Data → Fitness State → Recommendation → Real Activity → New Evidence**

This creates a continuous adaptive fitness loop.

---

## 🧠 Fitness Intelligence

The core of FitZone AI is the **Fitness Brain**.

It combines signals such as:

- 🎯 Fitness goal
- 📈 Experience level
- 🏋️ Weekly workout activity
- ⏱️ Active minutes
- ✅ Recent workout completion
- 📊 Progress toward targets
- 🔄 Behavioral and readiness signals

These signals help power the dashboard, AI Plan, workouts, nutrition planning, and adaptive recommendations.

### Recommendation ≠ Completion

A recommendation is **never automatically treated as a completed workout**.

Viewing or accepting a recommendation does not change workout completion data. Completion is recorded only when the actual workout is completed.

This keeps:

**Recommendation Data ≠ Real Activity Data**

---

## 🏗️ Architecture

```text
                    ┌───────────────────┐
                    │   React + Vite    │
                    │     Frontend      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ Node.js + Express │
                    │    Backend API    │
                    └───────┬─────┬─────┘
                            │     │
              ┌─────────────┘     └──────────────┐
              ▼                                  ▼
     ┌─────────────────┐                ┌─────────────────┐
     │ Supabase /      │                │ Python +        │
     │ PostgreSQL      │                │ FastAPI ML      │
     └─────────────────┘                └─────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │    Gemini AI    │
                                    │    Assistant    │
                                    └─────────────────┘
```

### Core Intelligence Loop

```text
User Activity
      ↓
Fitness State
      ↓
Fitness Brain
      ↓
Recommendation
      ↓
Workout / Nutrition / Goals
      ↓
Real Activity
      ↓
New Evidence
      ↓
Updated Fitness State
```

Gemini acts primarily as an **interaction and explanation layer**, while the application's fitness intelligence remains responsible for recommendation logic.

---

## 💡 Key Features

| Feature | Description |
|---|---|
| 🧠 Adaptive Intelligence | Fitness recommendations based on current user state |
| 🏋️ Workout Management | Plan, perform and track workouts |
| 📊 Progress Intelligence | Activity, active minutes, streaks and goals |
| 🍎 Nutrition Planning | Calorie and protein targets |
| 🤖 AI Assistant | Gemini-powered fitness interaction |
| 🎯 Goal Management | Fitness goals and weekly targets |
| 🔄 Adaptive Recommendations | Recommendations evolve with activity |
| 🔐 Secure Architecture | Authentication, validation, CORS and security middleware |

---

## 📱 Main Application Areas

| Area | Purpose |
|---|---|
| **Dashboard** | Current fitness state, activity and recommended actions |
| **My Workout** | Workout execution and completion tracking |
| **AI Plan** | Personalized recommendation and reasoning |
| **Progress** | Activity, workouts, streaks and targets |
| **Nutrition** | Calorie and protein targets |
| **Goals** | Fitness objectives and weekly goals |
| **AI Assistant** | Natural-language fitness interaction |
| **Profile** | Account and personalization |

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- CSS

### Backend

- Node.js
- Express
- JWT Authentication
- REST APIs

### AI / ML

- Python
- FastAPI
- Machine Learning Services
- Google Gemini

### Data

- PostgreSQL
- Supabase

### Deployment

- Vercel
- Render

### Development

- Git
- GitHub
- ESLint
- Automated Backend Tests

---

## 🔐 Engineering & Security

FitZone AI was built with data integrity and production security in mind.

- 🔒 Protected authentication routes
- 👤 User-data isolation
- 🛡️ API input validation
- 🌐 CORS allowlisting
- 🪖 Helmet security middleware
- 🔐 Content Security Policy
- 🔒 HSTS in production
- 🚫 Backend secrets kept server-side
- 🚫 No committed `.env` files
- 🚫 No backend secrets exposed in frontend bundles
- ⚡ Rate limiting
- 🔄 Secure authentication refresh flow

---

## 🧪 Testing & Verification

The project has been verified across development and production environments.

Testing and verification covers:

- Authentication
- Protected routes
- User-data isolation
- Workout completion behavior
- Recommendation integrity
- API validation
- CORS configuration
- Security policies
- Nutrition functionality
- AI Assistant integration
- Fitness intelligence
- Frontend linting
- Production build
- Production API health
- Production routing
- Production security headers
- React Router security updates

### Production Flow Verified

```text
Login
  ↓
Dashboard
  ↓
Workout
  ↓
AI Plan
  ↓
Progress
  ↓
Goals
  ↓
Nutrition
  ↓
AI Assistant
  ↓
Profile
```

---

## 📁 Project Structure

```text
FitZone-AI/
├── frontend/          # React + Vite frontend
├── backend/           # Express API & application logic
├── ai-service/        # Python FastAPI ML service
├── models/            # Model resources
├── docs/              # Documentation
├── tools/             # Development utilities
├── README.md
└── PROJECT_STATE.md
```

---

## 🚀 Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Nitishypujar/FitZone-AI.git
cd FitZone-AI
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
npm run dev
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
npm start
```

### 4. Install AI/ML Dependencies

```bash
cd ../ai-service
pip install -r requirements.txt
```

Configure the required environment variables for the frontend, backend, Supabase, Gemini, and ML service.

> ⚠️ Never commit API keys, database credentials, or other secrets.

---

## ☁️ Production Architecture

### Frontend — Vercel

Responsible for:

- User interface
- Authentication flow
- Dashboard
- Workout experience
- Progress visualization
- Nutrition interface
- AI Assistant interface

### Backend — Render

Responsible for:

- Authentication
- Application APIs
- Business logic
- Fitness intelligence
- Recommendations
- Workout tracking
- Nutrition logic
- Gemini integration
- Database communication

### AI/ML Service — Render

Responsible for:

- ML prediction functionality
- Fitness intelligence model services
- Model training and inference endpoints

### Database — Supabase

Responsible for persistent application data and user-related records.

---

## 🔄 Adaptive Fitness Loop

FitZone AI is designed around a continuous feedback loop:

```text
User Data
    ↓
Fitness State
    ↓
Recommendation
    ↓
Real Activity
    ↓
New Evidence
    ↓
Updated Fitness State
    ↓
New Recommendation
```

The goal is to progressively personalize recommendations as reliable user activity is collected.

---

## 🧊 Cold-Start Strategy

FitZone AI does not pretend to have a massive personalized dataset from day one.

The current system uses available user information and application signals while collecting meaningful activity data.

As reliable user data grows, the intelligence layer can progressively become more personalized.

---

## 🔮 Future Development

- More personalized ML models
- Stronger behavioral and adherence modeling
- Advanced workout adaptation
- Deeper nutrition intelligence
- Expanded progress analytics
- More automated testing
- Performance optimization
- Accessibility improvements
- Advanced personalization

---

## 👨‍💻 Author

### Nitish Y Pujar

**BTech AI/ML Student · Full-Stack Developer · AI/ML Developer**

🔗 **GitHub:** [@Nitishypujar](https://github.com/Nitishypujar)

---

## 📌 Project Status

### 🟢 Production — Deployed & Operational

FitZone AI currently includes:

- ✅ Production frontend
- ✅ Production backend
- ✅ Production ML service
- ✅ Supabase database
- ✅ Gemini integration
- ✅ Authentication
- ✅ Adaptive fitness intelligence
- ✅ Workout tracking
- ✅ Nutrition planning
- ✅ Progress analysis
- ✅ Security controls
- ✅ Production testing

### 🌐 Try FitZone AI

**[→ Open the Live Website](https://fitzone-ai-web.vercel.app)**

---

> **Built with a focus on practical AI, correctness, explainability, security, data integrity, and real-world engineering.**

**Plan → Train → Track → Analyze → Adapt → Repeat**