# FitZone AI — Current Project State

## Current milestone

Adaptive intelligence integration has been completed across the main product flow. The repository now uses one adaptive decision brain for Dashboard, AI Plan generation, Recommendation API, and AI Assistant.

## What is implemented

- Deterministic fitness state from Supabase remains authoritative.
- Next-best-action combines rule scoring, completion-prediction ML when the local ML service is available, and historical recommendation outcomes.
- Historical recommendation learning uses contextual evidence with Bayesian smoothing.
- Actual workout completion remains authoritative and is still performed through `PUT /api/workouts/:id`.
- Recommendation events now store the exact generated `workout_id`; completion resolves that exact event first, with legacy snapshot matching only as a compatibility fallback.
- Weekly workout state is calculated from `completed_at` and preserves historical records across week changes.
- Goal selections now affect the effective primary goal used by intelligence and personalized workout generation.
- AI workout generation consumes the same next-best-action state rather than a separate deterministic recommendation path.
- Generated exercises now include usable sets/repetitions/rest or duration prescriptions.
- AI Assistant now receives the same adaptive intelligence snapshot as Dashboard/AI Plan and persists chat history in browser localStorage per logged-in user, with cross-tab synchronization and an explicit clear action.
- Shared frontend API client is used throughout the main pages; hardcoded backend URLs were removed from page-level API calls.
- Workout, nutrition, goal, and profile mutations invalidate shared intelligence/dashboard caches.
- A dependency-light adaptive backend smoke-test suite is now available with `npm test`.

## ML reality

The current local ML service at `http://127.0.0.1:8000` is a real lightweight logistic-regression completion model with a cold-start fallback. It is not currently using the repository’s separate ONNX artifacts for `/predict/completion`. The ONNX files and heavier training pipeline remain available but are not claimed as the active inference path.

## Validation status

- Backend JavaScript syntax: passed in sandbox.
- Python syntax: passed in sandbox.
- Adaptive backend smoke tests: passed in sandbox.
- ML FastAPI smoke tests: passed in sandbox for health, cold-start prediction, training, and trained prediction.
- Frontend ESLint/Vite build: not executed in this sandbox because the uploaded dependency tree is incomplete and the user environment is Windows/ia32. The source verifier and backend tests pass; Windows must run `npm install`, `npm run lint`, and `npm run build`.
- Live Supabase, Gemini, authentication, and browser runtime were not available in the sandbox and are therefore not claimed as verified.

## Required database migration
Run `backend/migrations/2026-09-24-recommendation-workout-link.sql` once in Supabase SQL Editor before using exact recommendation/workout linking.

## Local run order

1. ML service: `cd /d F:\FitZone-AI\ai-service` then `python -m uvicorn main:app --host 127.0.0.1 --port 8000`
2. Backend: `cd /d F:\FitZone-AI\backend` then `npm start`
3. Frontend: `cd /d F:\FitZone-AI\frontend` then `npm run dev`

## Important known machine issue

The earlier backend run reported `JWT issued at future`. That condition is external to the source-only sandbox and must be rechecked on the user’s Windows machine after restoring the ZIP. Verify the system clock/time zone and the current Supabase auth configuration before treating a live intelligence snapshot failure as a code defect.

## Explicitly preserved

- `workouts.id` type/shape unchanged.
- No duplicate workout-completion endpoint.
- No Git history manipulation.
- Security hardening remains paused.
- Existing backup/report files should not be deleted.
