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
```

`DATABASE_URL` must point to a MySQL-compatible database. Use a long, random `JWT_SECRET` in production. `UPLOAD_DIR` can be an absolute path when the process runs outside the project directory. Configure SMTP before production use so verification and reset emails are delivered. If Turnstile is configured, set both keys; after repeated failed logins the UI will require the CAPTCHA challenge.
