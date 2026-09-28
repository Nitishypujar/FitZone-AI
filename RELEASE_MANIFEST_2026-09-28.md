# FitZone AI — Release Manifest 2026-09-28

Clean deadline release built from the uploaded FitZone-AI source archive.

## Included
- frontend/
- backend/
- ai-service/
- models/
- docs/
- tools/
- .env.example / backend/.env.example / frontend/.env.example
- root README

## Removed from distributable
- duplicate nested FitZone-AI project
- node_modules
- frontend/dist
- Python caches
- Git metadata
- local .env secrets
- obsolete backup server.js.before-fitness-brain-fix

## Code fixes
- route-level scroll restoration restored and wired into App shell
- frontend lint errors and hook warnings corrected
- integration contracts expanded for navigation/structure
- canonical outer Fitness Brain implementation preserved

## Verification
See docs/FINAL-VERIFICATION-2026-09-28.md.
