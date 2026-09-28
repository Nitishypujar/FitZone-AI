# FitZone AI

## Adaptive Fitness Intelligence Platform

FitZone AI is a full-stack fitness intelligence platform that combines user goals, workout activity, progress, nutrition data, recommendation logic, and machine-learning signals to continuously adapt the user's fitness experience.

The project is built around a simple feedback loop:

User Profile + Goals
        ↓
Current Fitness State
        ↓
Fitness Brain
        ↓
Next Best Action
        ↓
Workout / Guidance
        ↓
Actual User Activity
        ↓
Progress & Outcomes
        ↓
Updated Fitness State
        ↓
Next Recommendation

The goal is not simply to generate more fitness content.

The goal is to make the application state-aware.

For example, if a user is behind their configured weekly activity target, the system can identify that state and prioritize an appropriate action instead of simply presenting another generic workout.

## Project Overview

Traditional fitness applications often provide predefined workouts, static plans, dashboards, and calculators.

FitZone AI approaches the problem differently.

The application continuously combines information about the user's:

- Fitness goal
- Fitness level
- Training frequency
- Workout history
- Completed activity
- Weekly progress
- Active minutes
- Active days
- Readiness
- Nutrition
- Recommendation outcomes
- Available machine-learning signals

This information is used to construct a structured representation of the user's current fitness state.

That state is then used across the application to keep recommendations, progress, nutrition, and assistant responses consistent.

## Core Concept: The Fitness Brain

The Fitness Brain is the central intelligence layer of FitZone AI.

It combines information from multiple parts of the application to build a structured representation of the user's current state.

The state can include:

- Primary fitness goal
- Fitness level
- Training frequency
- Preferred workout duration
- Recent workouts
- Weekly workout progress
- Weekly active minutes
- Active days
- Readiness
- Nutrition information
- Historical recommendation outcomes
- Machine-learning completion signals when available

The resulting state is used to determine:

Current State
        ↓
Priority
        ↓
Next Best Action
        ↓
Supporting Explanation

The same intelligence state is consumed by important parts of the application so that the Dashboard, AI Plan, Progress, Nutrition, and Assistant do not independently create conflicting versions of the user's current state.

## Recommendation Architecture

The recommendation pipeline is separated into multiple layers.

User & Activity Data
        ↓
Fitness Context
        ↓
+-------------------+-------------------+
|                   |                   |
Rule Logic       ML Signal       Historical Evidence
|                   |                   |
+-------------------+-------------------+
                    ↓
          Recommendation Logic
                    ↓
             Next Best Action
                    ↓
          Workout / User Guidance

The recommendation system can combine:

1. Deterministic fitness rules
2. Machine-learning completion signals
3. Historical recommendation outcomes
4. Current user state
5. Goal and activity context

The machine-learning signal is treated as an input to the decision process rather than as an unquestionable answer.

Historical learning is based on recorded evidence rather than assuming that a recommendation was successful simply because it was displayed.

## Recommendation Is Not Completion

One of the most important design decisions in FitZone AI is keeping recommendation state separate from actual workout completion.

The intended lifecycle is:

Recommendation
      ↓
Workout selected or generated
      ↓
User opens workout
      ↓
User performs workout
      ↓
Actual completion recorded
      ↓
Progress updated
      ↓
Recommendation outcome evaluated

A user accepting or viewing a recommendation does not automatically complete the workout.

Actual completion is tied to the workout lifecycle and recorded completion data.

This prevents the application from artificially increasing:

- Completed workouts
- Active minutes
- Exercise counts
- Streaks
- Progress
- Historical training evidence

The system does not automatically mark the latest recommendation as completed.

## Personalized Workout Engine

FitZone AI connects recommendations to actual workouts.

The workout experience can use information such as:

- Fitness goal
- Fitness level
- Training frequency
- Session duration
- Readiness
- Current recommendation
- Relevant user context

Workout information can include:

- Exercises
- Sets
- Repetitions
- Duration where applicable
- Rest periods

The workout is connected to the recommendation context instead of being treated as an unrelated piece of generated content.

The important distinction is:

Recommendation
        ↓
Workout
        ↓
Actual User Activity
        ↓
Recorded Completion
        ↓
Future Intelligence

## AI Assistant

The AI Assistant provides a conversational interface over the user's fitness state.

Instead of operating as an isolated chatbot, it receives structured context from the adaptive intelligence system used elsewhere in the application.

It can explain information such as:

- Current fitness state
- Weekly progress
- Current goal
- Readiness
- Next best action
- Recommendation reasoning
- Progress information
- Nutrition-related context

The architecture intentionally separates decision-making from explanation.

Decision
    ≠
Explanation

The Fitness Brain determines the structured decision.

Gemini helps explain that decision in natural language.

This means the language model is not the hidden decision-maker for the core fitness recommendation.

## Gemini Integration

Gemini is used as the natural-language layer of the application.

Its primary role is to explain and communicate structured application decisions.

The architecture follows:

Recorded Data
        ↓
Calculated State
        ↓
Recommendation
        ↓
AI-generated Explanation

This separation makes the system easier to reason about and prevents an LLM-generated response from becoming the application's source of truth.

## Machine Learning Service

FitZone AI includes a separate Python/FastAPI machine-learning service.

React Frontend
        ↓
Node / Express Backend
        ↓
Personalization Client
        ↓
Python FastAPI ML Service
        ↓
Prediction Signal

The ML service provides functionality around areas such as:

- Workout completion prediction
- Nutrition adherence prediction
- Model training
- Model information
- Service health

The completion-prediction pipeline supports a cold-start state when a trained model is not available.

This is intentional.

The application does not claim that a model is trained when sufficient evidence does not exist.

The ML service can therefore operate alongside deterministic intelligence while training evidence is being accumulated.

## Cold-Start Intelligence

A recommendation system cannot assume that a new user already has enough historical data for reliable personalization.

FitZone AI therefore distinguishes between:

- Cold-start behavior
- Deterministic intelligence
- Available ML prediction signals
- Historical training evidence
- Learned personalization

A simplified flow is:

Insufficient ML Evidence
        ↓
Cold-Start State
        ↓
Deterministic Fitness Intelligence
        ↓
Real User Outcomes
        ↓
Training Evidence
        ↓
Model Training
        ↓
ML Signal When Available

This prevents the system from presenting an unverified model as if it were already fully personalized.

## Nutrition Intelligence

Nutrition is connected to the user's fitness context rather than being treated as a completely isolated calculator.

The nutrition system can work with:

- Daily calorie targets
- Protein targets
- Nutrition progress
- Adherence signals
- Current fitness goal
- Profile information
- Activity context

The active goal is considered when determining nutrition inputs so that planning does not depend entirely on potentially stale profile information.

## Progress Tracking

FitZone AI tracks actual activity over time and exposes it through the Progress experience.

Tracked information includes:

- Completed workouts
- Active minutes
- Active days
- Exercises completed
- Workout streak
- Weekly targets
- Historical activity

The system also accounts for older completed workout records where newer completion timestamp fields may not have been populated.

Valid historical activity should remain part of the user's history rather than silently disappearing because the data was recorded by an earlier version of the application.

## Dashboard

The Dashboard provides a high-level view of the user's current fitness state.

It brings together information such as:

- Weekly workout progress
- Active minutes
- Active days
- Current workout state
- Fitness goal
- Readiness
- Next best action
- Nutrition progress
- Recent activity

The Dashboard is designed to answer one practical question:

"What is happening with my fitness right now, and what should I focus on next?"

## Main Application Areas

### Dashboard

Central overview of the user's current fitness state and next action.

### My Workout

Displays the user's workout, exercises, duration, difficulty, and completion state.

### AI Plan

Shows the current adaptive recommendation and the reasoning behind it.

### Progress

Tracks historical activity, weekly progress, active minutes, exercises, and streaks.

### Nutrition

Displays calorie and protein targets along with nutrition progress.

### Goals

Allows users to define and update fitness objectives and weekly targets.

### AI Assistant

Provides conversational explanations using the user's current fitness context.

### Profile

Stores personalization information used throughout the platform.

### Membership

Provides the application's membership and onboarding experience.

### Admin

Provides administrative functionality available to authorized users.

### Authentication

Handles authentication and protected application access.

## System Architecture

                         +----------------------+
                         |    React + Vite      |
                         |      Frontend        |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |    Node / Express    |
                         |       Backend        |
                         +----------+-----------+
                                    |
            +-----------------------+-----------------------+
            |                       |                       |
            v                       v                       v
     Fitness Brain            Gemini Layer             Supabase
     Intelligence             Explanation            PostgreSQL
            |
            v
 Recommendation Logic
            |
       +----+----+
       |         |
       v         v
     Rules      ML
                 |
                 v
       Python FastAPI Service
                 |
                 v
        Prediction Signal
                 |
                 v
          Next Best Action
                 |
                 v
        Personalized Workout

## Technology Stack

### Frontend

- React
- Vite
- JavaScript / JSX
- React Router
- CSS
- ESLint

### Backend

- Node.js
- Express
- JavaScript
- REST APIs
- Supabase
- PostgreSQL
- Authentication and authorization
- Helmet
- CORS
- Request validation

### AI and Machine Learning

- Python
- FastAPI
- NumPy
- ONNX Runtime support
- Machine-learning prediction services
- Google Gemini

### Development and Testing

- Git
- GitHub
- npm
- Automated regression tests
- Contract tests
- Frontend linting
- Production build verification

## Project Structure

    FitZone-AI/
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   ├── hooks/
    │   │   ├── pages/
    │   │   └── api/
    │   ├── public/
    │   ├── tests/
    │   └── package.json
    │
    ├── backend/
    │   ├── services/
    │   ├── middleware/
    │   ├── tests/
    │   ├── migrations/
    │   ├── server.js
    │   └── package.json
    │
    ├── ai-service/
    │   ├── dataset/
    │   ├── models/
    │   ├── training/
    │   ├── main.py
    │   └── requirements.txt
    │
    ├── models/
    ├── docs/
    ├── tools/
    ├── README.md
    └── PROJECT_STATE.md

## End-to-End User Flow

### 1. Onboarding

The user provides profile and fitness information.

### 2. Goal Selection

The user selects an active fitness goal and relevant weekly targets.

### 3. State Construction

FitZone AI combines profile, goals, activity, workout history, and available signals.

### 4. Intelligence Analysis

The Fitness Brain evaluates the current state.

### 5. Recommendation

The system produces the next actionable recommendation.

### 6. Workout

The user performs the recommended or assigned workout.

### 7. Completion

The workout is recorded only when actual completion occurs.

### 8. Feedback

The completed activity becomes new evidence.

### 9. Adaptation

Future recommendations can use the updated state.

The core feedback loop is:

Observe → Analyze → Recommend → Act → Measure → Adapt

## Engineering Decisions

### Recommendation and Completion Are Separate

A recommendation event and a completed workout represent different facts.

Keeping them separate prevents false progress.

### Centralized Intelligence State

Multiple intelligence-driven UI surfaces consume the same structured state.

This reduces inconsistencies between:

- Dashboard
- AI Plan
- Progress
- Nutrition
- Assistant

### Timezone-Aware Activity

Weekly activity is evaluated with timezone context rather than blindly treating all activity as UTC-based.

### Historical Compatibility

Older valid workout records remain usable when newer completion timestamp fields are unavailable.

### Canonical Active Goal

The active goal is resolved from the authoritative goal state so that nutrition and intelligence remain aligned.

### Cold-Start Awareness

The system distinguishes between genuine learned personalization and baseline behavior when insufficient training data exists.

### Decision and Explanation Are Separate

Gemini explains structured application decisions instead of silently replacing the decision layer.

### Actual User Activity Is Authoritative

A recommendation, prediction, or assistant response does not create workout completion by itself.

## Data Integrity Rules

The following rules are intentionally maintained throughout the application:

1. A recommendation is not a completed workout.
2. Workout completion must come from the workout lifecycle.
3. Recommendation events are separate from workout records.
4. Completed workouts should not remain incorrectly represented as current unfinished workouts.
5. Historical activity should not disappear because a newer timestamp field is missing.
6. The active fitness goal should remain consistent across intelligence and nutrition.
7. Gemini explains application decisions rather than replacing the decision layer.
8. ML personalization should only be described as learned when the underlying evidence and model path support that claim.

## Security

Security is treated as part of the application's engineering rather than only as a final deployment task.

The project includes controls and validation around:

- Authentication
- Authorization
- User isolation
- Protected routes
- CORS
- Security headers
- Request validation
- Sensitive configuration
- Workout lifecycle validation

Security-related behavior is also covered by automated tests.

## Testing

The project includes automated testing across important application layers.

Test coverage includes areas such as:

- Adaptive intelligence
- Fitness Brain behavior
- Workout completion
- Recommendation integrity
- Authentication
- Protected routes
- User isolation
- CORS policy
- Security headers
- API validation
- Assistant behavior
- Nutrition behavior
- Product integration
- Regression scenarios

Frontend verification includes:

- ESLint
- Production build

### Backend Tests

    cd backend
    npm test

### Frontend Lint

    cd frontend
    npm run lint

### Frontend Production Build

    cd frontend
    npm run build

The ML service also exposes a health endpoint for local service verification.

## Local Development

### Prerequisites

Install or configure:

- Node.js
- npm
- Python
- Supabase project
- Required Gemini configuration
- Git

### Clone the Repository

    git clone https://github.com/Nitishypujar/FitZone-AI.git
    cd FitZone-AI

### Frontend

    cd frontend
    npm install
    npm run dev

The Vite development server normally runs on:

    http://localhost:5173

### Backend

Open another terminal:

    cd backend
    npm install
    npm start

The backend normally runs on:

    http://localhost:5000

### AI Service

Open another terminal:

    cd ai-service
    pip install -r requirements.txt
    python main.py

The ML service normally runs on:

    http://127.0.0.1:8000

FastAPI documentation is available through:

    http://127.0.0.1:8000/docs

Configure the required environment variables before starting the services.

Do not commit API keys, database credentials, JWT secrets, or other private configuration.

## Environment Configuration

The application requires environment-specific configuration for services such as:

- Supabase / PostgreSQL
- Authentication
- Gemini
- ML service communication
- Backend configuration

Environment files should be kept local and sensitive credentials must never be committed to the repository.

## Current ML State

FitZone AI supports an ML service and prediction infrastructure, but the project intentionally distinguishes between:

- Cold-start behavior
- Deterministic intelligence
- Available prediction services
- Actual learned personalization
- Historical training data

This distinction is important because the existence of an ML endpoint does not by itself mean that the system has learned a personalized model for every user.

The system can therefore operate with deterministic intelligence while sufficient training evidence is being accumulated.

## Current Limitations

FitZone AI is currently a local/development portfolio project.

It is not being presented as a publicly deployed production service.

The ML component can operate in cold-start mode when sufficient training evidence is unavailable.

The project also does not claim to provide medical-grade or clinical fitness recommendations.

Fitness information provided by the application should be treated as general fitness guidance and not as medical advice.

## Future Improvements

Potential future improvements include:

- Larger real-world training datasets
- More extensive ML evaluation
- Stronger recommendation outcome analysis
- Improved long-term personalization
- Expanded exercise knowledge
- More detailed progress analytics
- Additional end-to-end testing
- Production deployment architecture
- Monitoring and observability
- More advanced recommendation evaluation
- Accessibility improvements
- Performance optimization

These are future directions and are not presented as currently implemented features.

## What This Project Taught Me

The most challenging part of FitZone AI was not building individual pages.

It was keeping the different parts of the system consistent.

For example:

A recommendation
      ≠
A completed workout

An ML prediction
      ≠
A guaranteed outcome

An AI explanation
      ≠
The application's source of truth

Building around these distinctions required working across:

- Frontend development
- Backend APIs
- Database design
- Authentication
- Recommendation systems
- Machine learning
- AI integration
- State management
- Security
- Testing
- System architecture

The project reinforced an important engineering principle:

Reliable data
      ↓
Clear state
      ↓
Decision logic
      ↓
Valid action
      ↓
Feedback
      ↓
Adaptation

## Project Status

**Status:** Active development / portfolio project

The repository contains the finalized project structure and the intelligence hardening work completed for the current development baseline.

The project is intended to demonstrate practical work across AI/ML, full-stack development, intelligent recommendation systems, API design, database integration, security, and software testing.

## Author

### Nitish Y Pujar

BTech AI/ML Student

Interested in:

- Artificial Intelligence
- Machine Learning
- Full-Stack Development
- Intelligent Systems
- Applied AI Engineering

GitHub:

https://github.com/Nitishypujar

## License

This project is maintained primarily as a personal academic, learning, and portfolio project.

Refer to the repository for the applicable license and usage terms.