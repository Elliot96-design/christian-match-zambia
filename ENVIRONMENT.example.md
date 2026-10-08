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
```

`DATABASE_URL` must point to a MySQL-compatible database. Use a long, random `JWT_SECRET` in production. `UPLOAD_DIR` can be an absolute path when the process runs outside the project directory. When SMTP is omitted, development runs still print one-time links to the server log; configure SMTP before production use.
