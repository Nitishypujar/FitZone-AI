# FitZone AI Security Architecture

FitZone AI uses defense-in-depth rather than relying on a single control. The controls below are mapped primarily to OWASP API Security Top 10 2023 and OWASP ASVS 5.0 guidance.

## 1. Edge / transport layer

- Deploy the production frontend and API only over HTTPS.
- HSTS is enabled by the Express security configuration when `NODE_ENV=production`.
- `X-Powered-By` is disabled.
- Referrer policy is `no-referrer`.
- The frontend deployment should also send HSTS and security headers at the hosting/CDN layer.

## 2. Browser layer

- Helmet configures CSP, frame restrictions, object restrictions, and referrer policy for the API.
- The React application renders user text through React escaping rather than raw HTML.
- No `dangerouslySetInnerHTML`, `document.write`, `eval`, or `new Function` usage is permitted by the security source check.
- Do not add third-party scripts without reviewing their trust and CSP impact.

## 3. Cross-origin layer

- CORS is allowlist-based in production using `FRONTEND_URL`.
- localhost/127.0.0.1 origins are accepted only outside production.
- Credentials are not enabled through CORS because the application currently authenticates API requests with a Bearer token header.

## 4. Authentication layer

- Protected API routes require a Supabase access token.
- The backend validates the token through Supabase before using the user identity.
- Login and registration have a dedicated rate limiter.
- The frontend clears stale authentication state after a 401 response.
- Dashboard routes redirect to login when no access token is present.

### Important architecture note

The current application stores access/refresh tokens in browser storage. This is less resistant to token theft than an HttpOnly, Secure, SameSite cookie session. Migrating to cookie-based sessions is a separate authentication architecture change and should be performed deliberately with CSRF protection. This build therefore relies heavily on CSP, React escaping, backend authorization, and short-lived/managed Supabase sessions rather than claiming browser-storage tokens are equivalent to HttpOnly cookies.

## 5. Authorization / object ownership layer

Every user-owned object mutation must constrain the database operation by the authenticated `user.id` as well as the object identifier.

Examples in this build include:

- `goals`: `.eq('id', goalId).eq('user_id', user.id)`
- `workouts`: `.eq('id', workoutId).eq('user_id', user.id)`
- `nutrition_logs`: `.eq('id', nutritionId).eq('user_id', user.id)`
- recommendation events: user-scoped lookups and updates.

This directly addresses OWASP API1 Broken Object Level Authorization.

## 6. Input / property validation layer

- Unknown request properties are rejected on sensitive write endpoints.
- Numeric ranges are validated before database writes.
- Goal IDs use a dedicated positive-integer validator because the `goals.id` database field is numeric.
- UUID validation remains available for UUID-backed resources.
- Nutrition meal names are length-limited.
- Nutrition numeric values are finite and non-negative.
- Assistant questions are limited to 2000 characters and conversation history is bounded.

This addresses mass-assignment/property-level risks and reduces resource abuse.

## 7. Resource-consumption layer

Rate limits are applied at multiple levels:

- global API limiter
- authentication limiter
- assistant chat limiter
- workout/AI-plan generation limiter
- ML training limiter

The ML training endpoint is especially restricted because training is a more expensive operation than normal inference.

## 8. Data / privacy layer

- API responses use `Cache-Control: no-store` to reduce browser/proxy caching of authenticated data.
- Error responses avoid returning database records and the database test endpoint no longer exposes arbitrary profile IDs.
- User-owned queries are filtered by the authenticated user.
- Secrets are supplied through environment variables and are not packaged in the ZIP.

## 9. AI-specific safety layer

- FitZone fitness state is derived from backend data.
- Deterministic rules and recommendation logic remain authoritative for fitness decisions.
- ML prediction is treated as a prediction signal, not as a source of truth.
- Gemini is used to explain the system's decision rather than inventing a conflicting fitness state.
- The Assistant receives bounded conversation history.

## 10. Testing layer

Local automated checks include:

- JavaScript syntax verification
- adaptive recommendation smoke tests
- goal-ID/security validation tests
- static security source checks
- frontend ESLint
- frontend production build on a compatible Node/npm environment
- Python syntax compilation

An optional OWASP ZAP baseline launcher is included at `tools/security-scan.cmd`. ZAP's baseline scan is a passive spider/passive-scan workflow and is not a substitute for authenticated penetration testing.

## 11. Deployment hardening still required

Before public deployment:

1. Use HTTPS end-to-end.
2. Set an explicit production `FRONTEND_URL` allowlist.
3. Keep Supabase keys in the deployment secret manager.
4. Run the ZAP baseline against the actual deployed URL.
5. Run an authenticated API authorization test using two separate test accounts.
6. Run dependency vulnerability scanning from a network-enabled CI environment (`npm audit`/SCA/Snyk/Dependabot as appropriate).
7. Configure host/CDN security headers and a production CSP appropriate to the final API/frontend domains.
8. Review Supabase RLS policies independently; application-layer checks do not replace database authorization.
9. Do not expose administrative ML-training capability to ordinary users.
10. Consider migrating browser tokens to HttpOnly Secure SameSite cookies with CSRF protection before handling higher-sensitivity production data.

## Browser protected-route session verification

Protected application routes are gated by a server-verified session check at `/api/auth/session`. The browser token is only a client-side credential; its mere presence is not treated as proof of authentication. Backend APIs continue to validate the bearer token with Supabase on every protected request.
