# FitZone AI — Final Acceptance Checklist

## Core journey

- [ ] Register / login
- [ ] Profile loads
- [ ] Goals loads
- [ ] Goal saves without UUID error
- [ ] Goal appears in effective intelligence state
- [ ] AI Plan generates a workout
- [ ] Recommendation event receives exact `workout_id`
- [ ] My Workout resolves the same workout
- [ ] Workout completion stores `completed_at`
- [ ] Recommendation outcome is linked to the exact workout
- [ ] Progress uses real completion timestamps
- [ ] Nutrition add/edit/delete works
- [ ] Nutrition affects intelligence context
- [ ] Assistant uses FitZone intelligence context
- [ ] Changing goal changes downstream planning

## Security

- [ ] Unauthenticated protected routes return 401
- [ ] Goal ID `3` is accepted as numeric; malformed IDs are rejected
- [ ] User A cannot mutate User B's goal/workout/nutrition object by changing the ID
- [ ] Unknown request properties are rejected on hardened write endpoints
- [ ] Rate limits activate on authentication, assistant, generation, and ML training routes
- [ ] Production CORS does not trust localhost automatically
- [ ] Security headers are present in production
- [ ] API responses are not cached
- [ ] 401 clears stale frontend session state
- [ ] No raw HTML injection APIs are used in React source
- [ ] ZAP baseline scan reviewed before public release
- [ ] Supabase RLS policies independently reviewed
- [ ] Dependency SCA completed from a network-enabled CI environment

## UI

- [ ] Nutrition no longer renders as raw browser controls
- [ ] Goals visual hierarchy matches the rest of FitZone
- [ ] Mobile layouts remain usable
- [ ] Loading, empty, saving, and error states are visible
- [ ] Sign out is accessible from the dashboard shell

## Browser protected-route session verification

Protected application routes are gated by a server-verified session check at `/api/auth/session`. The browser token is only a client-side credential; its mere presence is not treated as proof of authentication. Backend APIs continue to validate the bearer token with Supabase on every protected request.
