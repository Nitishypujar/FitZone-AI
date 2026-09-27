# FitZone AI — Email Verification Flow

## Local flow

1. Registration calls `POST /api/register`.
2. The backend calls Supabase `signUp()` with an explicit `emailRedirectTo` of `http://localhost:5173/register?confirmed=1` (or the first configured `FRONTEND_URL` origin).
3. If email confirmation is required, the Register page stays in a `Check your inbox` state.
4. The user opens the Supabase confirmation email.
5. Supabase verifies the link and redirects to the FitZone Register page.
6. The Register page shows `Email verified` and provides the normal Sign In action.
7. Expired/denied verification links are handled on the Register page, with a resend action.

## Supabase dashboard configuration

For local development, add this exact redirect URL under Authentication → URL Configuration → Redirect URLs:

`http://localhost:5173/register?confirmed=1`

Set the Site URL to the deployed application URL for production. Add the production confirmation URL to the Redirect URL allow-list. Supabase requires redirect URLs passed to auth methods to be allow-listed.

## Security

- Password minimum is 8 characters in both UI and backend.
- Confirmation resend is rate-limited.
- Resend responses do not reveal whether an account exists.
- Confirmation links are never handled by the FitZone backend as raw tokens.
- The application does not disable email confirmation.
- Authentication remains enforced by Supabase and the backend bearer-token check.


## Supabase dashboard setup required

For local testing:

1. Open Supabase Dashboard → Authentication → URL Configuration.
2. Set **Site URL** to `http://localhost:5173`.
3. Add this exact **Redirect URL**:
   `http://localhost:5173/register?confirmed=1`
4. Keep **Confirm Email** enabled.
5. After changing this configuration, create a new test account or use the Register page's **Resend confirmation email** action. Existing emails that were generated with the old `localhost:3000` redirect will still contain the old destination and should not be used for the final test.

For production, replace the local URL with the deployed HTTPS origin and add only the required production redirect URL(s). Do not add broad wildcard redirects unless there is a documented need.
