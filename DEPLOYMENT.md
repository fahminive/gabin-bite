# Deploying GabinBite.pwt to Supabase + Vercel

This project is ready to run on **Supabase Postgres** (database, sessions, cache)
and **Vercel** (Laravel on FrankenPHP, deployed as a container service).

```
Browser ──HTTPS──> Vercel (FrankenPHP container, Laravel)
                        │
                        └── Session pooler (IPv4) ──> Supabase Postgres
                                                       schema: gabinbite
```

The app lives in a dedicated `gabinbite` schema, so the bookkeeping tables are
**not** exposed through the Supabase Data API.

---

## 1. Supabase setup

### 1.1 Get the Session pooler connection string

In the Supabase Dashboard:

**Project Settings → Database → Connection string → Session pooler**

It looks like:

```
postgresql://postgres.rfbvtkkvbmbpcszdinyb:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
```

Use the **Session pooler** (port `5432`), not the direct `db.<ref>.supabase.co`
host and not the transaction pooler (port `6543`):

- The direct host is IPv6-only and is not reachable from Vercel Functions.
- The transaction pooler does not support prepared statements, which Laravel
  uses.

If the password contains special characters, URL-encode it.

### 1.2 Create the application schema

Open **SQL Editor** in Supabase, paste the contents of
[`database/supabase-setup.sql`](database/supabase-setup.sql), and run it.

This creates the `gabinbite` schema and revokes Data API access from the
`anon` / `authenticated` roles.

> The `supabase login`, `supabase init`, and `supabase link` commands are for the
> Supabase CLI. They are **not required** for this deployment. Everything here
> uses the Dashboard and Laravel's own migrations.

---

## 2. Copy the local SQLite data to Supabase

Run these commands from the project root on the machine that has the SQLite
data (`database/database.sqlite`).

### 2.1 Point the app at Supabase

Edit `.env` (this file is gitignored):

```dotenv
DB_CONNECTION=pgsql
DB_URL=postgresql://postgres.rfbvtkkvbmbpcszdinyb:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
DB_SEARCH_PATH=gabinbite
DB_SSLMODE=require
```

Alternatively use the individual variables:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=aws-0-<region>.pooler.supabase.com
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres.rfbvtkkvbmbpcszdinyb
DB_PASSWORD=...
DB_SEARCH_PATH=gabinbite
DB_SSLMODE=require
```

Then clear cached config:

```bash
php artisan config:clear
```

### 2.2 Create the tables

```bash
php artisan migrate --force
```

This creates all Laravel tables inside the `gabinbite` schema, including
`sessions`, `cache`, and `cache_locks` (required on Vercel).

### 2.3 Copy the data

```bash
php artisan db:import-sqlite
```

The command:

- reads every application table from `database/database.sqlite`,
- inserts rows in foreign-key order,
- converts SQLite booleans / JSON / empty dates to valid Postgres values,
- resets the `id` sequences,
- verifies row counts and rolls back on any mismatch.

It refuses to run when `APP_ENV=production` unless you add `--force`.

Useful options:

```bash
php artisan db:import-sqlite --source=/path/to/database.sqlite
php artisan db:import-sqlite --skip-truncate
```

> **Local PHP needs `pdo_pgsql`.** On Laragon, enable the `pdo_pgsql` and
> `pgsql` extensions in the PHP `php.ini`, then restart PHP. Without it you will
> see `could not find driver`.

---

## 3. Deploy to Vercel

The deployment uses Vercel's official Docker/FrankenPHP path:

| File               | Purpose                                            |
| ------------------ | -------------------------------------------------- |
| `Dockerfile.vercel` | PHP 8.4 + `pdo_pgsql`, Node build, `public/build`  |
| `Caddyfile`         | FrankenPHP server, listens on Vercel's `$PORT`     |
| `vercel.json`       | Declares the `app` container service and rewrites  |
| `.dockerignore`     | Keeps `.env`, SQLite, `vendor`, `node_modules` out |

### 3.1 Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add these for
**Production** (and Preview if desired):

| Variable            | Value                                                        |
| ------------------- | ------------------------------------------------------------ |
| `APP_NAME`          | `GabinBite.pwt`                                              |
| `APP_ENV`           | `production`                                                 |
| `APP_DEBUG`         | `false`                                                      |
| `APP_KEY`           | copy the existing `APP_KEY` from your local `.env` (see note below) |
| `APP_URL`           | `https://your-project.vercel.app` (or your custom domain)    |
| `DB_CONNECTION`     | `pgsql`                                                      |
| `DB_URL`            | the Supabase **Session pooler** URL                          |
| `DB_SEARCH_PATH`    | `gabinbite`                                                  |
| `DB_SSLMODE`        | `require`                                                    |
| `SESSION_DRIVER`    | `database`                                                   |
| `CACHE_STORE`       | `database`                                                   |
| `QUEUE_CONNECTION`  | `sync`                                                       |
| `LOG_CHANNEL`       | `stderr`                                                     |
| `LOG_LEVEL`         | `warning`                                                    |
| `FILESYSTEM_DISK`   | `local`                                                      |
| `SESSION_SECURE_COOKIE` | `true`                                                   |

Important:

- Do **not** set `APP_CONFIG_CACHE` / `APP_ROUTES_CACHE` to `/tmp/*`. Laravel
  must read Vercel's runtime environment variables on every instance.
- `APP_KEY` must stay stable. **Reuse the `APP_KEY` from your local `.env`** so
  encrypted data imported from SQLite (for example two-factor secrets) remains
  readable. Only generate a fresh key with `php artisan key:generate --show`
  when deploying an empty database. Changing the key invalidates sessions and
  encrypted data.
- Keep `APP_URL` on the final HTTPS domain because passkeys derive their
  relying-party ID from it.

### 3.2 Deploy

**Option A — Vercel CLI (no Git repository needed):**

```bash
npm install -g vercel
vercel login
vercel link

vercel deploy --prod
```

**Option B — Vercel Dashboard:**

1. Import the project repository.
2. Framework preset: **Other**.
3. Vercel detects `vercel.json` and builds `Dockerfile.vercel` remotely.
4. Add the environment variables above.
5. Deploy.

You do **not** need Docker locally; Vercel builds the image on its own
infrastructure.

### 3.3 Run migrations after the first deploy

Migrations must **not** run at container startup (multiple instances could run
them at once). Run them once from your machine, pointed at Supabase:

```bash
php artisan migrate --force
php artisan db:import-sqlite   # only for the first deployment
```

---

## 4. Partner access

The existing accounts are preserved by the data import, including the three
partner owners:

| Email                  | Role    |
| ---------------------- | ------- |
| `admin@sikeju.com`     | admin   |
| `partner.a@sikeju.com` | owner   |
| `partner.b@sikeju.com` | owner   |
| `partner.c@sikeju.com` | owner   |

Their current passwords keep working after the import.

Before sharing the URL, consider:

- changing the seeded partner passwords (`password123` is the original seed),
- using **Settings → Security** to change your own password,
- production passwords must be at least 12 characters with mixed case, a
  number, and a symbol (Laravel's production password policy).

Then send partners the Vercel URL and their email/password.

---

## 5. Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| `502` from Vercel | FrankenPHP not listening on `$PORT`; keep the official `Caddyfile`, do not hard-code port 80. |
| `could not find driver` locally | Enable `pdo_pgsql` + `pgsql` in PHP, restart PHP. |
| `connection timed out` on Vercel | You used the direct `db.<ref>.supabase.co` host (IPv6-only). Use the Session pooler. |
| `prepared statement ... does not exist` | You used the transaction pooler (port `6543`). Use the Session pooler (port `5432`). |
| Logged out on every request | `SESSION_DRIVER` is not `database` (or `sessions` table missing). Run migrations. |
| `No application encryption key` | `APP_KEY` missing in Vercel environment variables. |
| `Vite manifest not found` | The Docker image was built without `public/build`; rebuild with `Dockerfile.vercel`. |
| 500 after changing `.env` | Run `php artisan config:clear` locally. On Vercel, redeploy after changing env vars. |

Health check: `https://your-project.vercel.app/up` should return `200`.
