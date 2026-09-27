# FitZone AI — Final Release Notes — 24 Sep 2026

## Release scope

This source release integrates the current FitZone AI product flow across adaptive fitness intelligence, nutrition intelligence, activity history, authentication hardening, and the owner/admin console.

The release keeps the core product rule:

```text
ACTUAL DATA
  -> AUTHORITATIVE STATE
  -> DERIVED DAILY/WEEKLY STATE
  -> AI / ML INTELLIGENCE
  -> RECOMMENDATION
  -> USER ACTION
  -> OUTCOME
  -> LEARNING
```

## Included product features

### Adaptive fitness intelligence
- Goal-aware intelligence for the supported FitZone goals.
- Shared intelligence state across Dashboard, AI Plan, Workout and Assistant.
- Next-best-action recommendations using rules, historical recommendation outcomes, and completion-prediction ML when the ML service is available.
- Exact recommendation-to-workout identity via `recommendation_events.workout_id`.
- Actual workout completion remains authoritative through existing workout completion state.
- Weekly progress is derived from real completion timestamps and historical records are preserved.
- No recommendation acceptance is treated as workout completion.

### AI Assistant
- Uses the same FitZone intelligence context rather than an isolated generic chatbot path.
- Per-user browser conversation persistence, cross-tab sync, and clear action.
- Response-quality protections for professional wording and removal of common markdown artifacts.
- Gemini remains the natural-language/explanation layer; deterministic FitZone state remains authoritative.

### Nutrition intelligence
- Natural-language food entry such as `2 eggs, 2 chapatis and 150g chicken curry`.
- Food matching against the bundled FitZone reference catalog.
- Household-unit and explicit-weight normalization.
- Deterministic calculation of calories, protein, carbohydrates, fats and fiber from matched reference foods.
- Review-before-save flow, unmatched-food warnings, editable quantities, and confidence states.
- Indian-food aliases and reference entries for common Indian meals and ingredients.
- Nutrition timeline, daily totals, history views, personalized planning targets when profile data is sufficient, and AI nutrition actions.
- Nutrition logs retain a frozen `food_items` calculation snapshot for auditability.
- Nutrition behavior ML endpoint with a cold-start state until the model is trained from sufficient real historical data.
- Admin training flow builds examples from real member history only.

### Daily activity and progress
- Time-zone-aware daily activity aggregation.
- Real workout-day heatmap/activity matrix inspired by activity-platform conventions but implemented with FitZone's own UI.
- 7D / 4W / 3M / 1Y activity ranges.
- Day drill-down with actual workouts, active minutes and nutrition logging.
- Real current/max streak calculations from completed activity.
- No fabricated activity, nutrition, streak or score values.

### Dashboard
- Dynamic time-of-day greeting and full date.
- Real weekly workout/minute/activity/nutrition summary.
- Current-workout and adaptive-action cards.
- Activity history graph and 28-day activity matrix.
- Nutrition snapshot and AI action.
- Removed the dashboard shortcut that could falsely mark a workout complete.
- Range selection is included in the query identity so switching between 7D/4W/3M/1Y refreshes the correct server-derived history.

### Owner/Admin console
- Protected owner console route and backend admin authorization.
- Member directory and detailed member view.
- Membership table with active/trial/paused/expired/cancelled states.
- Membership mutation auditing.
- Organization-level activity/nutrition/goal aggregates.
- Nutrition ML status and real-history training action.
- Member CSV export.
- Protected audit trail.

### Authentication/security
- Backend session validation for protected frontend routes.
- Backend bearer-token authorization on protected endpoints.
- Role/owner allow-list checks for admin endpoints via configured admin email/user IDs or auth metadata.
- Rate limiting on sensitive operations.
- Security headers/CSP and static security checks.
- No secrets are included in this release archive.

## Nutrition data provenance and limitations

`backend/data/foods.json` is a curated FitZone reference catalog. It is not a complete copy of USDA FoodData Central or ICMR-NIN data. The catalog records source families for reference context and stores rounded values intended for tracking/planning. Household portions are estimates and are user-adjustable.

For production/commercial distribution, verify the licensing/attribution requirements of any expanded food datasets before adding them to the catalog.

The nutrition ML model is deliberately not shipped with a trained user-history state. Until an administrator trains it from sufficient real FitZone history, the backend reports a cold-start/warm-up state rather than pretending the model learned from real users.

## Required Supabase migrations

Run these in Supabase SQL Editor, in this order:

1. `backend/migrations/2026-09-24-recommendation-workout-link.sql`
2. `backend/migrations/2026-09-24-fitzone-platform.sql`

`workouts.id` is not changed.

## Environment configuration

Root `.env` should contain server-only values using the names in `.env.example`:

```text
PORT=5000
SUPABASE_URL=...
SUPABASE_SECRET_KEY=...
GEMINI_API_KEY=...
ML_SERVICE_URL=http://127.0.0.1:8000
ML_REQUEST_TIMEOUT_MS=2500
FRONTEND_URL=http://localhost:5173
ADMIN_EMAILS=owner@example.com
ADMIN_USER_IDS=
VITE_API_BASE_URL=http://localhost:5000
```

The Supabase secret key must remain server-side. Do not place it in frontend `.env` files.

## Local start order (Windows)

### CMD 1 — ML
```bat
cls
cd /d F:\FitZone-AI\ai-service
python -m pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### CMD 2 — Backend
```bat
cls
cd /d F:\FitZone-AI\backend
npm install
npm start
```

### CMD 3 — Frontend
```bat
cls
cd /d F:\FitZone-AI\frontend
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Verification performed for this release

Verified in the source-only sandbox:

- `node tools/verify-project.js` — passed; 61 JS files and 16 integration contracts checked.
- `node backend/tests/nutrition-platform.test.js` — passed.
- `node tools/security-check.js` — passed.
- `python -m py_compile ai-service/main.py` — passed.
- Node syntax checks on changed backend modules and nutrition tests — passed.
- Frontend JSX/JS syntax parsing with TypeScript transpilation — passed for 23 frontend source files.
- The ML FastAPI nutrition-adherence endpoints were exercised previously with health/cold-start/training/trained-prediction checks using synthetic test inputs; the synthetic model state was removed afterward and is not shipped.

## Verification limits

This environment did not have a usable final frontend dependency tree after the source changes because network access to the npm registry was unavailable. Therefore this release does **not** claim a fresh final `npm run lint` or `npm run build` result for the latest UI source in the sandbox.

Live Supabase, live Gemini, authenticated browser flows, and the user's Windows runtime were also not available here, so those are not claimed as sandbox-verified.

The source is packaged with its lockfiles so the intended Windows install can reproduce dependencies with `npm install`.

## Important operational rules

- Never add fake activity, nutrition, progress, streaks or AI outcomes.
- Do not delete user history on logout.
- Do not change `workouts.id`.
- Do not ship a nutrition ML state file trained on synthetic data.
- Keep the server-only Supabase secret off the frontend.
- Apply both migrations before using the new platform/admin features.
- Do not re-complete an already completed workout just to test the completion path.

## Final UI integration pass

This final archive also includes the member-facing UI pass completed after the earlier release notes were written:

- Replaced the generic `F` branding with a dedicated FitZone AI SVG mark across the public header, authentication screens, dashboard shell and Assistant.
- Redesigned the authenticated sidebar with grouped navigation, meaningful icons, member identity, adaptive-brand treatment and responsive mobile drawer behavior.
- Redesigned Progress around a real daily activity timeline with 7D / 4W / 3M / 1Y ranges, calendar-style activity cells, selected-day drill-down, active-minute trend, streaks and honest no-target states.
- Added a backend `/api/progress/activity` aggregation endpoint using completed workouts, completed exercise logs and nutrition log timestamps in the user's requested timezone.
- Changed dashboard weekly target defaults from invented `7 / 380` values to `null` when no target is configured.
- Improved Assistant interaction design, keyboard behavior, loading/typing state, retry affordance and live-context presentation.
- Added a deterministic FitZone response path when Gemini is unavailable or quota-limited, so the Assistant can still answer using authoritative FitZone state instead of returning a dead chat error.
- Gemini quota responses no longer trigger a second quota request; transient server/network failures may receive one short retry before the deterministic FitZone response is used.

The Admin Console code already present in the source archive was not expanded during this UI pass; Admin remains intentionally parked for later work.

## Latest archive validation

After the final UI integration pass:

- `node tools/verify-project.js` — passed; 61 JavaScript files and 17 integration contracts checked.
- Node syntax checks — passed for all 60 backend JavaScript files in the archive.
- Python `compileall` — passed for the AI service source before packaging; generated `__pycache__` files were removed from the archive afterward.
- Secret scan — no live API key/service-role secret patterns found in the packaged source.
- No `.env`, `node_modules`, `dist`, or Python bytecode is included in the final archive.
- A fresh frontend `npm run lint` / `npm run build` was not executed in this sandbox because the final source tree does not contain a dependency installation and registry access is unavailable. Run those on Windows after `npm install`.
