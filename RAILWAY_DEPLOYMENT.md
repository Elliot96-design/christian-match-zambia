# Faithful Hearts — GitHub and Railway Deployment

## Architecture

Faithful Hearts is deployed as one Railway service. The Node/Express server serves the compiled React/Vite frontend and the tRPC API from the same origin:

- Frontend: Vite build output in `dist/public`
- Backend: Express entrypoint bundled to `dist/index.js`
- API: `/api/trpc`
- Health check: `/healthz`
- Uploads: `/uploads`
- Database: existing TiDB/MySQL database through `DATABASE_URL`

A separate frontend service is not required and would require an API-base-url change that the current same-origin client does not need.

## GitHub

The local project already has a GitHub remote for `Elliot96-design/christian-match-zambia`. Before pushing any new history:

```bash
git status --short
git diff --check
git add .
git commit -m "Prepare Faithful Hearts for Railway deployment"
git push origin main
```

Confirm on GitHub that these are not committed:

- `.env` and `.env.*` files
- `DATABASE_URL`, `JWT_SECRET`, SMTP passwords, OAuth client secrets
- Apple `.p8` files and other private keys
- `uploads/`, `dist/`, and runtime logs

If the repository remote is not available in a new environment, add it through GitHub’s normal repository settings or replace `origin` with the intended HTTPS GitHub URL. Never put a personal access token into a committed Git remote or source file.

## Railway

1. Create or open a Railway project.
2. Choose **Deploy from GitHub repo** and select `Elliot96-design/christian-match-zambia`.
3. Select the `main` branch.
4. Railway reads `railway.json`:
   - Build: `pnpm build`
   - Start: `pnpm start`
   - Health check: `/healthz`
5. Set the production variables listed below in Railway’s service Variables tab.
6. Deploy and wait for `/healthz` to return HTTP 200.
7. Copy the Railway-generated HTTPS domain and set `APP_URL` to that exact origin.
8. If preserving local uploads, attach a Railway Volume mounted at `/data` and set `UPLOAD_DIR=/data/uploads`.
9. Do not run `pnpm db:push` against production unless the migration files have been reviewed and the existing TiDB/MySQL database has been backed up. The application must use the existing `DATABASE_URL`; do not create or reset a replacement database.

## Required Railway variables

```text
NODE_ENV=production
DATABASE_URL=<existing TiDB/MySQL connection string>
JWT_SECRET=<long random production secret>
JWT_EXPIRES_IN=30d
APP_URL=https://<Railway-generated-domain>
UPLOAD_DIR=/data/uploads              # if a Railway Volume is attached
```

`PORT` is supplied by Railway and must not be manually fixed. The server binds to `0.0.0.0`.

## Email and security variables

Required for production email delivery and optional CAPTCHA:

```text
SMTP_HOST=<SMTP host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<SMTP username>
SMTP_PASSWORD=<SMTP password>
SMTP_FROM=Faithful Hearts <no-reply@your-domain>
TURNSTILE_SECRET_KEY=<Cloudflare Turnstile secret>
VITE_TURNSTILE_SITE_KEY=<Cloudflare Turnstile public site key>
```

If SMTP is omitted, reset and verification links are only suitable for development logging. If Turnstile is omitted, CAPTCHA escalation is disabled.

## Google OIDC variables

```text
GOOGLE_CLIENT_ID=<Google web OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_REDIRECT_URI=https://<Railway-generated-domain>/api/auth/social/google/callback
```

Register the exact production URI in Google Cloud Console under the web OAuth client’s Authorized redirect URIs. The local development URI is:

```text
http://localhost:3000/api/auth/social/google/callback
```

## Apple Sign in with Apple variables

```text
APPLE_CLIENT_ID=<Apple Services ID>
APPLE_TEAM_ID=<Apple Developer Team ID>
APPLE_KEY_ID=<Sign in with Apple key ID>
APPLE_PRIVATE_KEY=<Apple .p8 private key, stored only in Railway Variables>
APPLE_REDIRECT_URI=https://<Railway-generated-domain>/api/auth/social/apple/callback
```

In Apple Developer, enable Sign in with Apple, create/configure the Services ID, associate it with the App ID, verify the Railway domain, and add the exact Return URL above.

## Database safety

The application preserves the existing schema and data. Deployment does not require a new database. Existing Drizzle migrations remain in `drizzle/`. Review migration state before applying any new migration manually. Never run destructive SQL against the production database as part of deployment.

## Verification checklist

- `GET /healthz` returns `{ "ok": true, "service": "faithful-hearts" }`.
- The home page loads from the Railway HTTPS origin.
- Email/password login and logout work.
- A protected tRPC request reaches the existing database.
- Password reset and verification emails use the Railway `APP_URL`.
- Google callback URI exactly matches Google Cloud Console.
- Apple Return URL exactly matches Apple Developer.
- Existing users, premium state, profiles, messages, and matching data remain intact.
- No secrets appear in GitHub history, build logs, or client-side bundles.
