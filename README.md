# TapBusiness

NFC business cards linked to an editable digital profile. An admin creates an account for each customer and links it to a card; the customer activates the account and edits their profile; anyone who taps the card sees the latest version.

Available in **English** and **Bahasa Indonesia** (UI, public profiles and emails).

## Features

**Customers**
- Activate the account from an invite link, log in, reset a forgotten password
- Profile editor with live phone preview and autosave: personal info, social links, photo and cover, sections (text, link buttons, photo gallery, YouTube video), 6 themes
- Share tab: profile link, downloadable QR code, NFC card URL, vCard, show/hide profile
- Statistics: profile views, card taps, link clicks, contacts saved (7/30/90 days) and the most clicked links
- Account: name, language, username (with availability check), password
- Tap simulation showing what people see when the card is tapped

**Admins**
- Dashboard with customer counts and 30-day views and taps
- Search and filter all accounts
- Create customer (or admin) accounts with username and card ID. You get an activation link to copy or send via WhatsApp (or email, if SMTP is set up), the NFC card URL and a QR code
- Edit account details, create new activation or password-reset links, disable/enable, delete
- Edit any customer's profile on their behalf
- Per-customer statistics

**Public**
- `/u/:username`: the profile, with "Save contact" (vCard with photo), share button and language switch
- `/c/:cardId`: the URL written on the NFC chip. It counts the tap and redirects to the profile, so the card keeps working if the username changes

## Project layout

```
shared/     Types and zod validation shared by both sides
backend/    Fastify + PostgreSQL (Drizzle ORM) API
frontend/   React 19 + Vite + Tailwind SPA
deploy/     Production docker-compose and Caddyfile
.github/    CI and deploy workflows
```

npm workspaces; run everything from the repository root.

## Development

Requirements: Node 20.19+ (24 recommended) and PostgreSQL 17.

```bash
npm install
cp backend/.env.example backend/.env       # adjust DATABASE_URL if needed

# no local Postgres? start one in Docker (also creates tapbusiness_test):
docker compose -f compose.dev.yml up -d
# then set DATABASE_URL=postgres://postgres:postgres@localhost:5432/tapbusiness in backend/.env

npm run dev     # API on :3000, web on http://localhost:5173 (proxies /api, /uploads, /c)
```

Log in at http://localhost:5173/login with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`. The admin is created on first start.

| Command | |
|---|---|
| `npm run dev` | Backend and frontend with reload |
| `npm test` | Backend integration tests. Needs a `tapbusiness_test` database; override with `TEST_DATABASE_URL` |
| `npm run typecheck` | Typecheck all workspaces |
| `npm run build` | Production builds |
| `npm run db:generate -w backend` | Create a migration after changing `backend/src/db/schema.ts` |
| `npm run cli -w backend -- create-admin <email> [name]` | Create another admin and print a set-password link |

Migrations in `backend/drizzle/` run automatically when the backend starts.

### Translations

Strings live in `frontend/src/i18n/en.ts` and `id.ts`. `en.ts` defines the keys, and the build fails if `id.ts` is missing one. API errors come back as codes (`USERNAME_TAKEN`, …) and are translated in the browser. Email templates are in `backend/src/lib/mailer.ts`.

## Deployment

Two workflows deploy to a single Linux server running Docker:

- **Deploy backend**: on pushes to `main` touching `backend/`, `shared/` or the lockfile
- **Deploy frontend**: on pushes to `main` touching `frontend/`, `shared/`, the lockfile or the Caddyfile

Each runs the CI checks (typecheck, tests against Postgres, build) and then builds a Docker image. It pushes the image to GitHub Container Registry (`ghcr.io/<owner>/<repo>-backend` / `-web`) and SSHes into the server to pull and restart that one service. Both can also be started by hand from the Actions tab (**Run workflow**). CI also runs on pull requests and other branches.

On the server, [Caddy](https://caddyserver.com) serves the frontend, gets an HTTPS certificate automatically and forwards `/api`, `/uploads` and `/c` to the backend. Postgres data and uploaded images live in Docker volumes.

### One-time setup

1. **Server**: any VPS with Docker and the compose plugin, ports 80 and 443 open. Point your domain's DNS A record at it.
2. **Deploy user**: create a user that may run Docker (in the `docker` group), and add the public half of a new SSH key to its `~/.ssh/authorized_keys`.
3. **Deploy folder**: `sudo mkdir -p /opt/tapbusiness && sudo chown deploy: /opt/tapbusiness`
4. **GitHub** → Settings → Environments → create `production`, then add:

   | Type | Name | Value |
   |---|---|---|
   | Secret | `SSH_HOST` | Server IP or hostname |
   | Secret | `SSH_USER` | Deploy user, e.g. `deploy` |
   | Secret | `SSH_PRIVATE_KEY` | The private SSH key |
   | Secret | `SSH_KNOWN_HOSTS` | Output of `ssh-keyscan <host>` (recommended) |
   | Variable or secret | `DOMAIN` | e.g. `tapbusiness.example.com` (no `https://`) |
   | Secret | `ADMIN_EMAIL` | Login email of the first admin |
   | Secret | `ADMIN_PASSWORD` | Password of the first admin (no single quotes) |
   | Variable | `ADMIN_NAME` | Optional, default `Admin` |
   | Variable | `TIMEZONE` | Optional, default `Asia/Jakarta` |
   | Variable | `SSH_PORT` | Optional, default `22` |
   | Variable | `DEPLOY_PATH` | Optional, default `/opt/tapbusiness` |

   Every deploy writes these into `/opt/tapbusiness/.env` on the server, so there's nothing to edit there by hand. Add required reviewers to the environment if deploys should wait for approval.
5. **First deploy**: run **Deploy backend**, then **Deploy frontend**, from the Actions tab, then log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

The admin is only created when no account with `ADMIN_EMAIL` exists yet. Changing `ADMIN_PASSWORD` in GitHub later does not change the password of an existing admin; use the Account page or a reset link for that.

This is a demo setup: Postgres has no password (it's only reachable from the backend container) and no emails are sent; admins share activation and reset links themselves.

### Operations

```bash
cd /opt/tapbusiness
docker compose ps
docker compose logs -f backend
docker compose exec backend node dist/cli.js create-admin someone@example.com "Name"
docker compose exec db pg_dump -U tapbusiness tapbusiness > backup.sql   # back up the database
```

To roll back, re-run an older successful deploy run from the Actions tab; it rebuilds and redeploys that commit. Back up the `uploads` volume along with the database.
