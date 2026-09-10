# duenext

Self-hosted tracker for expiration dates (visas, passports, subscription trials) and
due dates (bills, tasks), with scheduled reminders over email and [Ntfy](https://ntfy.sh).

- Multi-user, admin-managed accounts (no public signup)
- Per-item visibility: only me, all users, or specific users
- Configurable reminder offsets per item (e.g. 30/14/7/1/0 days before)
- Reminders delivered by email (SMTP) and/or Ntfy, per-user channel preferences
- Single Docker image, Postgres backend

## Deploying with Docker Compose

1. Copy the env template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   At minimum, set `POSTGRES_PASSWORD`, `AUTH_SECRET` (`openssl rand -base64 32`),
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` (used to create the first account on first boot),
   and `DEFAULT_NTFY_URL` if you run your own Ntfy server. `AUTH_TRUST_HOST=true`
   is required for self-hosting (Auth.js only trusts the request host automatically
   on Vercel).

2. Start it:

   ```bash
   docker compose up -d
   ```

   Plain `docker compose up -d` builds the image locally (via `docker-compose.override.yml`).
   To run the prebuilt image published by CI instead:

   ```bash
   docker compose -f docker-compose.yml up -d
   ```

3. Open `http://localhost:3000` (or `$APP_PORT`) and log in with `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
   Create additional accounts from **Admin → Users** — there's no public signup.

Database migrations run automatically on container start. Data persists at
`$DUENEXT_DATA_PATH/postgres` on the host.

## Notifications

- **Email**: set `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`. Each user
  opts in under **Profile**.
- **Ntfy**: `DEFAULT_NTFY_URL` pre-fills the server URL for new users; each user sets
  their own topic (and an optional access token for protected topics) under **Profile**.

The reminder scheduler runs hourly inside the app process (no separate cron container).
It re-checks on every run, so a reminder that was missed while the container was down
still fires on the next hourly pass.

## Local development

Requires Node 20+ and a Postgres database.

```bash
npm install
cp .env.example .env   # point DATABASE_URL at a local Postgres
npx prisma migrate dev
npm run dev
```

## CI/CD

`.github/workflows/docker-publish.yml` builds and pushes the image to
`ghcr.io/kaiserdrake/duenext:latest` on every push to `main`.
