# FitZone AI — Current Project State

## Current milestone

Finalization pass completed on 26 Sep 2026 against the uploaded 25 Sep source release. The source now tightens the no-fake-data rule across registration/profile/AI Plan, makes incomplete personalization an explicit intelligence state, keeps real activity/streak history independent of the selected chart range, hardens timezone validation, and preserves the existing adaptive workout/recommendation architecture.

## Product architecture

```text
USER DATA / MESSAGE
    -> Intent / Tool Selection
    -> Authoritative FitZone State
    -> Rules + ML Intelligence
    -> Recommendation / Next Action
    -> Gemini Natural-Language Explanation
    -> User Action
    -> Outcome
    -> recommendation_events / persisted history
    -> Future adaptation
```

For nutrition:

```text
Natural-language food entry
    -> Food matching
    -> Quantity normalization
    -> Reference food composition
    -> Deterministic nutrient calculation
    -> Saved nutrition snapshot
    -> Nutrition intelligence
    -> Behavioral ML signal
    -> AI action / explanation
```

## Included features

### Fitness intelligence
- Supported goals: Fat Loss, Weight Gain, Muscle Growth, Strength, Endurance, General Fitness, Maintain Fitness, Flexibility, Stamina.
- Goal-aware workout recommendation and generation path.
- Next-best-action state shared across Dashboard, AI Plan, Workout and Assistant.
- Completion-prediction ML with explicit cold-start reporting.
- Historical recommendation outcome learning with contextual smoothing.
- Exact recommendation-to-workout linkage through `recommendation_events.workout_id`.
- Actual workout completion remains authoritative; recommendation acceptance never completes a workout.
- Weekly state derives from real completion timestamps and history is preserved across week boundaries.

### Dashboard/activity
- Dynamic time-of-day greeting and date.
- Real 7D / 4W / 3M / 1Y daily activity history.
- Activity matrix / heatmap uses completed workout activity only; nutrition logging is shown separately.
- Clickable day detail.
- Real active minutes, workout days, nutrition days and streak fields.
- No fabricated scores/streaks/activity.
- Range is part of the React Query identity, so switching ranges loads the corresponding backend-derived history.
- Removed the dashboard shortcut that could mark a workout complete outside the authoritative workout flow.

### Nutrition
- Natural-language meal entry.
- Bundled curated reference-food catalog with common Indian and international foods/aliases.
- Explicit weight and household-unit normalization.
- Deterministic calories/protein/carbohydrate/fat/fiber calculation.
- Review-before-save with item-level quantity editing.
- Unmatched-food blocking and confidence messaging.
- Daily nutrition timeline.
- 7D / 4W / 3M / 1Y nutrition history.
- Profile-based planning target when age, height and weight are present; no fake target when they are not.
- Nutrition target includes the active profile goal.
- Nutrition actions based on actual intake and targets.
- Frozen `food_items`, source and confidence metadata stored with a saved entry.
- Nutrition ML adherence prediction, honest cold-start state, and admin training from real historical member data only.
- The nutrition page uses the shared FitZone design language and responsive chart/card hierarchy.

### AI Assistant
- Shared intelligence snapshot.
- Per-user browser chat history, cross-tab sync and clear action.
- Professional output formatting and prompt/output safety validation.
- Gemini is the language/explanation layer, not the numeric source of truth.

### Authentication/security
- Backend session validation for protected routes.
- Bearer-token authorization on protected APIs.
- Goal ownership / object-level authorization.
- Admin authorization via configured admin identities or auth role metadata.
- Rate limiting and security headers/CSP.
- Email confirmation/resend flow with correct local redirect.
- Logout clears only session material; database history remains.

### Owner/admin console
- Protected `/admin` UI plus backend admin endpoints.
- Member directory and member detail.
- Membership state/plan editor.
- Organization-level activity/nutrition/goal aggregates.
- Nutrition ML status and training.
- CSV member export.
- Audit trail for sensitive admin actions.
- Admin navigation is server-session gated.

## Data model additions

### `nutrition_logs`
Added:
- `fiber_g`
- `entry_source`
- `nutrition_confidence`
- `food_items`
- `logged_at`

### `memberships`
- `id`
- `user_id`
- `membership_plan`
- `status`
- `start_date`
- `end_date`
- timestamps

### `admin_audit_logs`
- identity of admin action
- action name
- target user where applicable
- JSON metadata
- timestamp

## ML state

The existing completion model remains a lightweight logistic-regression service with honest cold-start fallback.

Nutrition now has a separate behavioral adherence logistic-regression model. A model state file is only written after training. The release intentionally does not ship a nutrition model state trained from synthetic examples.

## Food catalog note

`backend/data/foods.json` is a curated FitZone reference catalog. It is not a complete copy of USDA FoodData Central or ICMR-NIN. Values are rounded planning/tracking references and household servings are estimates. Verify dataset licensing/attribution requirements before commercial expansion.

## Required migrations

Run in Supabase SQL Editor in this order:

1. `backend/migrations/2026-09-24-recommendation-workout-link.sql`
2. `backend/migrations/2026-09-24-fitzone-platform.sql`

`workouts.id` is unchanged.

## Environment variables

See `.env.example`. Server-only values include:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `GEMINI_API_KEY`
- `ML_SERVICE_URL`
- `ML_REQUEST_TIMEOUT_MS`
- `FRONTEND_URL`
- `ADMIN_EMAILS`
- `ADMIN_USER_IDS`

Frontend uses `VITE_API_BASE_URL`.

## Verification state

Passed in this build environment:
- backend JavaScript syntax checks for the changed/server source
- Python compile check for `ai-service`
- adaptive smoke test
- completion regression test, including no-target semantics and incomplete-profile contracts
- authentication route contract test
- email confirmation route contract test
- Assistant quality/format test
- product integration contract test
- nutrition platform test, including timezone-aware activity and streak history checks
- source verification (`tools/verify-project.js`)
- security static checks (`tools/security-check.js`)

Not claimed as verified here:
- full frontend Vite build or ESLint execution; the temporary npm install did not complete and `vite` was therefore unavailable in the sandbox
- dependency-loaded backend security-validation suite; the sandbox dependency tree is incomplete after the timed-out npm install
- live Supabase database/auth connectivity
- live Gemini API responses
- live ML service responses; adaptive tests intentionally pass when the ML service is unavailable and report that condition
- authenticated browser acceptance on the user's Windows machine
- public deployment

## Finalization changes — 26 Sep 2026

- Registration no longer injects Beginner / General Fitness / 3 days / 45 minutes when the member has not supplied personalization data.
- Profile no longer initializes missing fitness level or goal with invented defaults; blank values remain blank until the member configures them.
- Goal synchronization maps goal slugs such as `fat-loss` and `muscle-growth` to the canonical profile labels used by the rest of the product.
- AI Plan blocks personalized workout generation until the required profile personalization fields are actually configured and links directly to Profile.
- The intelligence layer returns an explicit `complete-profile` next action for incomplete personalization instead of ranking a fabricated default workout.
- Progress/workout streaks are calculated from all supplied completed workout history, not capped by the selected 7D/4W/3M/1Y display range; the current day can remain part of an ongoing streak before a workout is recorded today.
- Activity and nutrition endpoints use validated IANA timezone input instead of passing unchecked strings into date aggregation.
- Dashboard, Nutrition and Assistant goal displays use `Not set` / `No goal set` when the member has not configured an objective.
- Existing recommendation acceptance remains distinct from actual workout completion; workout completion updates the exact linked recommendation outcome.
- Admin functionality was not expanded in this pass and remains intentionally parked.

## Preserve

- `workouts.id` shape/type
- exact recommendation workout identity
- actual workout completion as the source of truth
- no fake data rule
- `backend/server.security-batch2a-prepatch.bak` when present
- `fitzone-inspection-report.txt` when present
- no synthetic nutrition model state in release
