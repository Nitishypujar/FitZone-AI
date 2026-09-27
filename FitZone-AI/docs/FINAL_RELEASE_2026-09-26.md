# FitZone AI — Finalization Release Notes — 2026-09-26

## Scope

This source-only archive is based on the verified uploaded `FitZone-AI-FINAL-2026-09-25.zip` and includes the finalization work performed in the sandbox on 26 Sep 2026. Existing adaptive workout, recommendation, nutrition, progress, authentication, ML and Assistant architecture was preserved.

## Finalization changes

- Removed registration-time personalization defaults that could make an unconfigured member appear to have a goal, fitness level, training frequency or session duration they never supplied.
- Profile now preserves missing fitness level/goal as unset and provides an explicit selection placeholder. Saving partial profile data is allowed; personalized workout generation requires the relevant configuration.
- Goal slug values synchronize to canonical profile labels so Goals and Profile do not disagree about the same objective.
- AI Plan clearly blocks generation until the four required personalization inputs are present and provides a direct Profile action.
- The adaptive decision layer returns `complete-profile` for incomplete personalization and does not call the completion ML ranking path for that state.
- Progress streaks are computed from the full completed-workout history passed to the activity service rather than the selected chart window.
- Timezone query parameters used by activity/nutrition aggregation are validated as IANA timezones and fall back safely to UTC when invalid.
- Dashboard, Nutrition and Assistant now display an unset goal honestly rather than substituting General Fitness.
- Added regression coverage for the new profile/goal/no-target contracts and global streak behavior.

## Verification performed

PASS:
- `node backend/tests/completion-regression.test.js`
- `node backend/tests/nutrition-platform.test.js`
- `node backend/tests/adaptive-smoke.js`
- `node backend/tests/auth-route-contract.js`
- `node backend/tests/assistant-quality.test.js`
- `node backend/tests/product-integration-contract.js`
- `node tools/verify-project.js`
- `node tools/security-check.js`
- Python compile check for `ai-service`
- Node syntax checks for the changed/server backend source files

Environment limitations:
- Full frontend Vite/ESLint execution was not completed because the temporary npm dependency installation timed out, leaving `vite` unavailable in the sandbox.
- The dependency-loaded `security-validation.js` suite was not claimed as passing because the temporary backend dependency installation was incomplete.
- No live Supabase, Gemini, ML-service or authenticated browser test was performed in this build environment.

## Packaging

The archive is source-only. It excludes `.git`, `node_modules`, frontend/backend build output, Python bytecode/cache directories, local virtual environments, `.env` files, logs and temporary files. Package lockfiles and environment examples are retained.

Admin functionality remains present in the source where already implemented, but no new Admin work was performed in this finalization pass.
