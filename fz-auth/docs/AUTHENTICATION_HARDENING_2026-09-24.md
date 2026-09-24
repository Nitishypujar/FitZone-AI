FitZone AI authentication hardening update
Date: 2026-09-24

Issue fixed:
Protected frontend routes previously trusted the mere presence of fitzone_access_token in localStorage. A stale or fabricated token could therefore render the private shell before the server verified the session.

Fix:
Added frontend ProtectedRoute session gate calling /api/auth/session. The endpoint validates the bearer token through Supabase before protected UI is rendered. Backend protected API routes continue to authenticate independently.

Important:
Frontend route guards are UX/navigation controls, not the security boundary. Backend authorization remains mandatory.
