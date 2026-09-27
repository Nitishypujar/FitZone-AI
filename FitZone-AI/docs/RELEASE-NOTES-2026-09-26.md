# FitZone AI Release Notes — 2026-09-26

This release focuses on cross-page consistency, activity-state reliability, navigation behavior, and ML/intelligence plumbing.

Key changes:
- Canonical daily activity service shared by Dashboard and Progress.
- Fixed workout-log timestamp field used by the shared activity aggregation.
- Preserved compatibility for the older Progress activity endpoint.
- Added SPA scroll restoration on route changes.
- Made intelligence snapshots timezone-aware.
- Converted Progress assistant navigation to SPA routing.
- Prevented the workout UI from showing a false persisted exercise undo.
- Added engineering audit and local ML runbook documentation.
