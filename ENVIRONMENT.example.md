# Faithful Hearts environment

Copy these values into a local `.env` file before running the server. Do not commit `.env`.

```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://user:password@localhost:4000/faithful_hearts
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=30d
UPLOAD_DIR=uploads
```

`DATABASE_URL` must point to a MySQL-compatible database. Use a long, random `JWT_SECRET` in production. `UPLOAD_DIR` can be an absolute path when the process runs outside the project directory.
