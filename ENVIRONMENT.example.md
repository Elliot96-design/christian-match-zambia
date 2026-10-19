# Faithful Hearts environment

Copy these values into a local `.env` file before running the server. Do not commit `.env`.

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:4000/faithful_hearts
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=30d
UPLOAD_DIR=uploads
APP_URL=http://localhost:3000

# Optional SMTP email delivery
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=Faithful Hearts <no-reply@example.com>

# Optional Cloudflare Turnstile CAPTCHA (required in production if enabled)
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret
VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key

# Optional Google OIDC
GOOGLE_CLIENT_ID=your-google-web-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.example/api/auth/social/google/callback

# Optional Apple Sign in with Apple
APPLE_CLIENT_ID=com.example.faithfulhearts.web
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI=https://your-domain.example/api/auth/social/apple/callback

# Railway-only optional CORS allowlist. Leave blank when frontend and API use the same service/domain.
CORS_ORIGINS=
```

`DATABASE_URL` must point to a MySQL-compatible database. Use a long, random `JWT_SECRET` in production. `UPLOAD_DIR` can be an absolute path when the process runs outside the project directory. Configure SMTP before production use so verification and reset emails are delivered. If Turnstile is configured, set both keys; after repeated failed logins the UI will require the CAPTCHA challenge. For social sign-in, register the exact callback URLs shown above in Google Cloud Console and Apple Developer. Never commit provider secrets or the Apple private key.

## Railway deployment notes

This project is prepared as one Railway service: Express serves the built Vite frontend and the tRPC API from the same HTTPS origin. Railway supplies `PORT`; do not hard-code a production port. The service starts with `pnpm start` after Railway runs `pnpm build`, and its health check is `/healthz`.

After Railway assigns the service domain, set `APP_URL` to that exact HTTPS origin and replace the placeholder Google and Apple redirect URIs with that same domain. For durable profile uploads, attach a Railway Volume mounted at `/data` and set `UPLOAD_DIR=/data/uploads`; otherwise Railway’s local filesystem should be treated as ephemeral.
