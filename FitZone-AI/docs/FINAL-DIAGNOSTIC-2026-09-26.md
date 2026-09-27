# FitZone AI — Final Diagnostic & Engineering Audit

Date: 2026-09-26

## Fixed in this release

### 1. Shared daily activity failure
Dashboard and Progress were using two different activity implementations. The Dashboard endpoint selected `workout_logs.completed_at`, while the established workout-log contract uses `logged_at`. That could make `/api/activity/daily` fail even though workouts themselves loaded correctly.

Fix:
- Added one canonical `getDailyActivity()` data path.
- Uses `workout_logs.logged_at`.
- Dashboard and Progress consume the same `/api/activity/daily` representation.
- Kept `/api/progress/activity` as a compatibility endpoint that delegates to the same service.
- Added shared `today`, `days`, `entries`, and summary fields so pages cannot drift in their activity calculations.

### 2. Scroll-position bug during SPA navigation
The application did not explicitly restore scroll position when changing React Router routes. Long pages could therefore open at the previous page's scroll position, making a newly opened page appear to jump to the bottom.

Fix:
- Added `frontend/src/components/ScrollToTop.jsx`.
- It resets scroll position on pathname changes without affecting intentional in-page scrolling.

### 3. Intelligence timezone mismatch
The frontend supplied a timezone to `/api/intelligence/snapshot`, but the intelligence router ignored it and built the snapshot in UTC.

Fix:
- Intelligence snapshot now validates and uses the requested IANA timezone.
- This keeps profile/goal/workout/weekly state aligned with activity and nutrition date boundaries.

### 4. Progress navigation reload
Progress used a normal `<a href="/assistant">`, which forces a full browser reload and can reintroduce scroll/session-loading behavior.

Fix:
- Replaced it with React Router `<Link>` navigation.

### 5. Workout exercise completion UI consistency
A completed exercise could be toggled back to an unchecked local state even though no server-side undo was persisted. That could make the UI disagree with the database after refresh.

Fix:
- Completed exercises are now treated as persisted outcomes and their completion control is disabled instead of pretending an undo was saved.

## Verified architecture contracts

- Workout completion remains authoritative through `workouts.completed` / `completed_at`.
- Recommendation acceptance is not treated as workout completion.
- Recommendation-to-workout identity remains linked through `recommendation_events.workout_id`.
- ML completion prediction remains behind the backend personalization client.
- Gemini remains the language/explanation layer with deterministic FitZone fallback.
- Weekly progress remains based on actual completion dates and user timezone.
- Missing targets remain represented as unavailable rather than invented defaults.
- Admin functionality was not changed.

## Verification performed on the release source

Passed:
- `node tools/verify-project.js`
- `node backend/tests/completion-regression.test.js`
- `node backend/tests/adaptive-smoke.js`
- `node backend/tests/product-integration-contract.js`
- Node syntax checks for modified backend files
- Python `py_compile` for `ai-service/main.py`
- Direct canonical daily-activity aggregation test with a mocked Supabase data source
- Source scan for common mojibake / encoding corruption in application source
- Source scan for TODO/FIXME/HACK markers in application source

The frontend source had already been observed building successfully in the user's environment before this release patch. A clean isolated `npm run build` could not be rerun in the packaging environment because the npm registry package cache was incomplete; therefore this release does not claim a fresh isolated frontend build.

## External/runtime checks still depend on the user's environment

1. Supabase must contain the expected existing FitZone tables/columns and the supplied migrations must be applied where applicable.
2. The local ML service must be started separately:

```cmd
cd /d F:\FitZone-AI\ai-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

3. A running ML service returning HTTP 200 does not by itself mean a trained model is active. `/health` or `/model` should be checked for `model_trained` / `trained` and `training_samples`.
4. Gemini availability depends on the configured API key and quota. FitZone contains a deterministic fallback so an exhausted Gemini quota does not need to become the user's only assistant response path.
5. Production deployment, production environment variables, and live E2E browser verification are not claimed by this package.
