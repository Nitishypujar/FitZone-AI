# FitZone AI — Hardening Batch 2

## Implemented

- Restored route scroll handling for pathname, query-string, hash navigation, browser history and refresh behavior.
- Made current-workout selection strict: only today's incomplete scheduled workout is current; stale unfinished workouts no longer become today's session.
- Kept weekly activity state authoritative in the Fitness Brain and made Progress consume that canonical weekly state for goal progress.
- Changed adherence to use eligible planned sessions due by the current local date rather than every workout row, and changed recent training load to a fixed 14-day window.
- Preserved exact recommendation-to-workout identity and removed snapshot-based completion matching.
- Passed request timezone through assistant workout context.
- Added distinct Stamina goal handling and strengthened goal-specific workout/nutrition differentiation.
- Added a minimum real-outcome threshold of five examples before the local ML service can enter trained mode.
- Added Assistant canonical-goal enforcement so Gemini cannot silently reinterpret General Fitness (or another selected goal) as a different goal.
- Added regression tests for timezone boundaries, current-workout selection, goal differentiation, nutrition targets, navigation, recommendation identity and ML training threshold.

## Deliberately not changed

- Existing authentication flow and database identifiers.
- Existing workout completion endpoint and completion semantics.
- Gemini remains explanation-only; deterministic Fitness Brain remains the decision layer.
- ONNX artifacts remain available but are not falsely claimed as the active completion inference path.
- Production deployment configuration was not added.

## Follow-up state consistency hardening — 2026-09-28

- Fixed the frontend Fitness Brain hook to consume the canonical intelligence snapshot instead of the legacy user-state-only compatibility response.
- Added timezone propagation to the intelligence snapshot route.
- Kept `/api/fitness/state` backward-compatible while exposing the canonical intelligence fields required by current pages.
- Fixed weekly workout aggregation for older completed workout rows that have `completed=true` but no `completed_at`, using the best recorded date available instead of silently dropping valid history.
- Prevented an older unfinished workout from being surfaced as today's current workout.
- Made Dashboard ignore already-completed today's workouts when deciding whether a current session is available.
- Made nutrition intelligence use the active goal as the canonical goal when calculating targets, preventing profile/goal drift from producing contradictory nutrition targets.
- Added regression coverage for legacy completion timestamps, canonical intelligence consumption, compatibility response fields, goal synchronization, and current-workout behavior.

## Final UX consistency pass — 2026-09-28
- Clarified Goals weekly target controls as `PER WEEK` with explicit minimum/maximum labels so extracted/accessibility text cannot concatenate into misleading values such as `WEEK 27` or `WEEK 60500`.
- Bumped Assistant browser conversation storage to v4 and added a live-state refresh marker so older persisted responses are clearly identified as conversation history rather than current fitness state.
- Preserved the Assistant's per-user local persistence, clear action, and live intelligence snapshot behavior.
