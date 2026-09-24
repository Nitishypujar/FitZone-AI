# FitZone AI — CORS Login Regression Fix — 2026-09-24

## Symptom

Browser login failed with `TypeError: Failed to fetch` and this preflight error:

`Request header field cache-control is not allowed by Access-Control-Allow-Headers in preflight response.`

## Root cause

The shared frontend API client was sending `Cache-Control: no-store` as a **request** header on every API call. The backend CORS allow-list intentionally permits only `Authorization` and `Content-Type` request headers. Browsers therefore rejected the login preflight before `/api/login` could execute.

## Correct fix

`Cache-Control: no-store` is a response caching policy, so it belongs on backend responses, not as a browser request header. The backend already applies `Cache-Control: no-store` to `/api` responses.

The frontend API client now sends:

- `Content-Type: application/json`
- `Authorization: Bearer ...` when an authenticated request has a token
- any explicitly supplied endpoint-specific headers

It no longer injects `Cache-Control` into requests.

## Security reasoning

The fix does **not** weaken the response cache policy. The backend continues to send `Cache-Control: no-store` for API responses. It also preserves the production CORS allow-list instead of broadening `Access-Control-Allow-Headers` merely to accommodate an unnecessary client request header.

## Verification performed in the build environment

- JavaScript syntax check: PASS
- Python syntax check: PASS
- frontend API-client regression contract: PASS
- production CORS policy remains allow-list based: PASS by source inspection
- backend response cache policy remains present: PASS by source inspection

The final Windows/browser acceptance step must be run on the user's integrated environment because the browser's CORS preflight is the failing runtime behavior.
