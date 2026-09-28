# FitZone AI — Release Notes 2026-09-28

## Fixed

- Restored and wired route-level `ScrollToTop` so SPA navigation does not inherit the previous page's scroll position.
- Corrected the shared Fitness Brain hook to consume the canonical `/api/intelligence/snapshot` endpoint and unwrap its `{ status, data }` response envelope.
- Corrected Dashboard to consume the same canonical intelligence snapshot and the current-workout endpoint.
- Corrected Goals to unwrap the `/api/fitness/state` response envelope before reading weekly goal state.
- Improved AI Plan loading/error presentation so `Synchronizing` is shown only while the intelligence query is loading, and the model source is reported from the actual recommendation snapshot.

## ML status

The local completion service is intentionally cold-start until the admin training route has enough real historical recommendation outcomes. The service returns successful predictions during cold start, but `model_enabled` remains false. This release does **not** train on synthetic data and does not mislabel cold-start inference as a trained model.

## Scope

No production deployment configuration, database schema conversion, workout completion endpoint duplication, Gemini decision-making, or security-hardening expansion was introduced by this release.
