# FitZone AI

Adaptive fitness + nutrition intelligence platform for the FitZone project.

## What is included

- Goal-aware adaptive workout intelligence
- Recommendation -> workout -> outcome linkage
- Real daily/weekly/monthly/yearly activity history
- FitZone activity matrix / heatmap
- Natural-language food logging with deterministic nutrition calculation
- Indian/international reference food catalog with confidence and review states
- Nutrition targets, history and behavior-intelligence signals
- Nutrition adherence ML with honest cold-start behavior
- Unified AI Assistant using FitZone state
- Protected authentication/session handling
- Owner/admin console with members, memberships, analytics, audit and export
- Security headers, rate limiting, validation and object-level ownership checks

## First setup

1. Copy `.env.example` to `.env` and fill in real server values.
2. Apply these Supabase migrations in order:
   - `backend/migrations/2026-09-24-recommendation-workout-link.sql`
   - `backend/migrations/2026-09-24-fitzone-platform.sql`
3. Install dependencies in `ai-service`, `backend` and `frontend`.
4. Start ML, backend and frontend in separate terminals.

### ML

```bat
cls
cd /d F:\FitZone-AI\ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### Backend

```bat
cls
cd /d F:\FitZone-AI\backend
npm install
npm start
```

### Frontend

```bat
cls
cd /d F:\FitZone-AI\frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Validation

Use:

```bat
tools\run-all-tests.cmd
```

The latest sandbox release checks are documented in `docs/FINAL_RELEASE_2026-09-26.md`.

## Important rules

FitZone never fabricates user activity, nutrition totals, progress, streaks, recommendation outcomes or ML training history. If a metric is not supported by available data, the UI reports that honestly.

The bundled food catalog is a curated reference catalog, not a complete commercial import of any external food database. Verify licensing before expanding it for commercial distribution.

## Authentication note

For the current development release, Supabase Email authentication has **Confirm email disabled** in the hosted project configuration. New accounts therefore receive a session immediately after successful signup. This is a Supabase Auth setting, not a SQL migration.

If email confirmation is re-enabled later, the registration UI should be updated to restore the confirmation flow.
