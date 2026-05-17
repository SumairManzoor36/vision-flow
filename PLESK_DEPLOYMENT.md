# Vision Audit Flow Pro — Complete Plesk Deployment Guide

> Production deployment guide for Plesk Obsidian (18.x+) on Linux (Ubuntu / Debian / AlmaLinux / CloudLinux).
> App stack: **Next.js 15 + Node 22 + MariaDB 11 + Prisma 5 + Gemini Vision** running under **Phusion Passenger**.

---

## Table of contents

1. [Server prerequisites](#1-server-prerequisites)
2. [Create the domain & Node.js app in Plesk](#2-create-the-domain--nodejs-app-in-plesk)
3. [Provision the MariaDB database](#3-provision-the-mariadb-database)
4. [Upload the source code](#4-upload-the-source-code)
5. [Configure environment variables](#5-configure-environment-variables)
6. [First-time install & build](#6-first-time-install--build)
7. [Run migrations & seed](#7-run-migrations--seed)
8. [Start the application](#8-start-the-application)
9. [SSL / HTTPS](#9-ssl--https)
10. [Persistent storage (uploads)](#10-persistent-storage-uploads)
11. [Re-deploys with `deploy.sh`](#11-re-deploys-with-deploysh)
12. [Logs, monitoring & troubleshooting](#12-logs-monitoring--troubleshooting)
13. [Hardening & best practices](#13-hardening--best-practices)
14. [Backup & restore](#14-backup--restore)
15. [FAQ / common errors](#15-faq--common-errors)

---

## 1. Server prerequisites

On the **Plesk server** confirm/install:

| Component | Required | How to verify in Plesk |
|-----------|----------|------------------------|
| **Plesk Obsidian** | 18.0.50+ | Tools & Settings → About Plesk |
| **Node.js extension** | installed, v22 LTS available | Tools & Settings → Updates → Add/Remove Components → "Node.js support" |
| **MariaDB** | 10.6+ (11.x recommended) | Tools & Settings → Database Servers |
| **Git** (optional but recommended) | latest | `git --version` over SSH |
| **SSH access** for the subscription user | enabled | Subscriptions → *yourdomain.com* → Web Hosting Access → "Access to the server over SSH" = `/bin/bash` |

> **Why SSH?** Plesk's UI can install/build but `prisma migrate deploy` and `db:seed` are easier and far less error-prone over SSH. The `deploy.sh` script in this repo expects SSH.

**Recommended Node version:** 22 LTS. The `package.json` requires `>=22.0.0`. Plesk lets you pick the version per-app under Domains → Node.js.

---

## 2. Create the domain & Node.js app in Plesk

1. **Domains → Add Domain** (or use an existing one).
2. Open the domain → **Node.js** → **Enable Node.js**.
3. Fill the form:

   | Field | Value |
   |-------|-------|
   | Node.js version | **22.x** (or newest LTS available) |
   | Package manager | **npm** |
   | Document root | `/httpdocs` *(default — leave it; Passenger ignores this for Node apps)* |
   | Application mode | **production** |
   | Application root | `/httpdocs` *(or a subdirectory like `/vision-audit` — be consistent everywhere)* |
   | Application URL | `https://yourdomain.com` |
   | **Application Startup File** | `plesk.app.js` |

4. Click **Enable Node.js** / **OK**. Plesk will create the app skeleton and start Passenger (it'll fail until we deploy the code — that's normal).

> The "Application Startup File" must exactly match the filename `plesk.app.js` at the application root. This file is already included in the repo and spawns `next start` for you.

---

## 3. Provision the MariaDB database

In Plesk:

1. **Databases → Add Database**
2. Settings:

   | Field | Value |
   |-------|-------|
   | Database name | `vision_audit_flow` |
   | Related site | *yourdomain.com* |
   | Database server | the local MariaDB |
   | **Character set** | **`utf8mb4`** *(critical — Prisma full-text indexes need this)* |
   | Collation | `utf8mb4_unicode_ci` |
   | Add a database user | ✓ |
   | Username | `vision_user` |
   | Password | *generate a strong password — save it* |
   | User has access to all databases | ✗ (leave unchecked) |

3. Click **OK**.

**Verify** over SSH:

```bash
mysql -u vision_user -p -e "SHOW DATABASES; SELECT VERSION();"
```

You should see `vision_audit_flow` listed and a version `>=10.6`. If the server is on `localhost`, your `DATABASE_URL` host will be `localhost` (or `127.0.0.1`).

---

## 4. Upload the source code

Pick **one** of the following — Git is strongly recommended for repeat deploys.

### Option A — Git (recommended)

In Plesk: **Domains → *yourdomain.com* → Git** → **Add Repository**:

- **Repository URL**: your repo (HTTPS or SSH key)
- **Server path**: same as the Node.js Application root (e.g. `/httpdocs`)
- **Deployment mode**: *Manual* (we'll run our own `deploy.sh`) — or *Automatic* if you want Plesk to redeploy on push.
- **Branch**: `main` (or whichever you ship from)

Plesk will clone the repo into the app root.

### Option B — SFTP / File Manager

Upload the entire project (excluding `node_modules`, `.next`, `.env`) into the Application root.

### Option C — SSH `git clone`

```bash
ssh user@yourdomain.com
cd ~/httpdocs            # or your app root
rm -rf *                 # only if the dir is supposed to be empty
git clone https://github.com/your-org/vision-audit-flow-pro.git .
```

---

## 5. Configure environment variables

You have **two equivalent ways** to set env vars; do **one**, not both:

### 5a. Plesk UI (easiest, survives redeploys)

Domains → *yourdomain.com* → **Node.js** → scroll to **Custom environment variables** → add each one:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | leave **unset** — Passenger injects it |
| `NEXT_PUBLIC_APP_NAME` | `Vision Audit Flow Pro` |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
| `DATABASE_URL` | `mysql://vision_user:STRONG_PW@localhost:3306/vision_audit_flow` |
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | `true` |
| `GEMINI_API_KEY` | *your Google AI Studio key* |
| `GEMINI_VISION_MODEL` | `gemini-2.0-flash-exp` |
| `GEMINI_TEXT_MODEL` | `gemini-1.5-pro` |
| `UPLOAD_DIR` | `./public/uploads` |
| `MAX_UPLOAD_MB` | `20` |
| `BRAND_PRIMARY_COLOR` | `#3a64ff` |

Click **Apply** — Plesk re-renders Passenger's env file at `~/httpdocs/.env`.

### 5b. `.env.production` file (used by `deploy.sh`)

If you prefer file-based config, create `~/httpdocs/.env.production`:

```bash
ssh user@yourdomain.com
cd ~/httpdocs
cp .env.example .env.production
nano .env.production    # fill in real values
chmod 600 .env.production
```

Next.js loads `.env.production` automatically when `NODE_ENV=production`.

> **Never commit** `.env.production`. It's already in `.gitignore`.

---

## 6. First-time install & build

Over SSH:

```bash
ssh user@yourdomain.com
cd ~/httpdocs

# Use the Plesk-managed Node version
# Plesk exposes it via the "nodejs" alias; if not, source the env Plesk wrote:
source /opt/plesk/node/22/enable 2>/dev/null || true

node -v        # should print v22.x.x
npm -v

npm ci         # installs exact lockfile versions; runs `prisma generate` postinstall
npm run build  # next build (also re-runs `prisma generate`)
```

> If `npm ci` fails because there's no `package-lock.json` yet, run `npm install` once locally, commit the lockfile, and redeploy. Production should always use `npm ci` for reproducibility.

---

## 7. Run migrations & seed

```bash
# Apply Prisma migrations (creates all tables)
npm run db:deploy

# OR — if this repo doesn't yet contain a migrations folder, do a one-off push:
npm run db:push

# Seed demo data (admin user, products, locations, sample audits)
npm run db:seed
```

After seeding, the demo accounts work:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@vision-audit.app` | `admin1234` |
| Manager | `manager@vision-audit.app` | `manager1234` |
| Auditor | `auditor@vision-audit.app` | `auditor1234` |

> **Change these immediately** in production: log in as admin, go to *Admin → Users*, rotate passwords, then disable or delete the auditor/manager demo accounts you don't need.

---

## 8. Start the application

In Plesk → Domains → *yourdomain.com* → **Node.js**:

1. Click **NPM install** (only needed if you skipped step 6).
2. Click **Restart App**.
3. Visit `https://yourdomain.com` — the marketing landing page should render.

Passenger logs every restart to `~/logs/error_log` and `~/logs/passenger.log`.

---

## 9. SSL / HTTPS

In Plesk → Domains → *yourdomain.com* → **SSL/TLS Certificates**:

- Click **Install a free basic certificate provided by Let's Encrypt**.
- Enable: ✓ *Secure the domain*, ✓ *www subdomain*, ✓ *Include a "www" subdomain*.
- Apply.

Then under **Hosting Settings**:

- ✓ *Permanent SEO-safe 301 redirect from HTTP to HTTPS*
- ✓ *HSTS* (after you've verified HTTPS works)

Update `NEXT_PUBLIC_APP_URL` to `https://...` and restart the app.

---

## 10. Persistent storage (uploads)

The app saves audit scan images to `public/uploads/`. This directory **must persist across deploys** and be writable by the Plesk subscription user.

```bash
ssh user@yourdomain.com
cd ~/httpdocs
mkdir -p public/uploads
chmod 750 public/uploads
# Owner is already the Plesk user; verify:
ls -ld public/uploads
```

Our `deploy.sh` never wipes `public/uploads`. If you ever do a clean re-clone, **back up this folder first**.

> **Heavy upload volume?** Move uploads to an out-of-tree directory and symlink it:
> ```bash
> mkdir -p ~/persistent/uploads
> rm -rf ~/httpdocs/public/uploads
> ln -s ~/persistent/uploads ~/httpdocs/public/uploads
> ```
> This way `git clean -fdx` or fresh clones won't ever touch your data.

---

## 11. Re-deploys with `deploy.sh`

Every subsequent deployment is a single command:

```bash
ssh user@yourdomain.com
cd ~/httpdocs
./deploy.sh
```

What it does, in order:

1. **Sanity-checks** Node version + required env vars.
2. **`git pull`** the latest from your tracking branch (skippable with `--no-pull`).
3. **`npm ci`** for an exact dependency tree (skippable with `--no-install`).
4. **`prisma migrate deploy`** to apply pending migrations.
5. **`next build`** to produce the production bundle.
6. **Touches `tmp/restart.txt`** — Phusion Passenger detects this and gracefully restarts the app (zero-downtime).
7. **Health-checks** `https://yourdomain.com` and reports HTTP status.

Flags:

| Flag | Effect |
|------|--------|
| `--no-pull` | skip `git pull` (use when you uploaded code by SFTP) |
| `--no-install` | skip `npm ci` (faster when only env/config changed) |
| `--no-migrate` | skip `prisma migrate deploy` |
| `--seed` | also run `npm run db:seed` (⚠ idempotent only on a fresh DB) |
| `--branch <name>` | check out & pull a specific branch |

Example: deploy without changing dependencies:

```bash
./deploy.sh --no-install
```

---

## 12. Logs, monitoring & troubleshooting

### Where the logs live

| Log | Path |
|-----|------|
| Passenger / app stdout+stderr | `~/logs/error_log` |
| Plesk Node.js panel log viewer | Domains → Node.js → **Logs** |
| Nginx access log | `/var/www/vhosts/system/yourdomain.com/logs/access_ssl_log` |
| Nginx error log | `/var/www/vhosts/system/yourdomain.com/logs/error_log` |

Tail in real time:

```bash
tail -f ~/logs/error_log
```

### Common diagnostic commands

```bash
# Confirm the app is bound by Passenger
ps -ef | grep -i passenger | grep node

# Verify Prisma can talk to the DB
cd ~/httpdocs && npx prisma db pull --print

# Confirm the build output exists
ls -la ~/httpdocs/.next/BUILD_ID

# Rebuild Prisma client only (after npm install errors)
npx prisma generate
```

### Force a hard restart

A graceful restart is enough 99% of the time:

```bash
mkdir -p ~/httpdocs/tmp && touch ~/httpdocs/tmp/restart.txt
```

If the app is wedged, do a hard restart from the Plesk UI:

Domains → Node.js → **Disable Node.js** → wait 5s → **Enable Node.js** → **Restart App**.

---

## 13. Hardening & best practices

- **Rotate `AUTH_SECRET`** every 6–12 months (sessions will be invalidated).
- **Disable demo users** after first login.
- **Restrict DB user**: the `vision_user` account should only have privileges on `vision_audit_flow`, not `*.*`.
- **Firewall**: keep MariaDB bound to `127.0.0.1` only. Use Plesk Firewall to block external 3306.
- **Plesk Fail2Ban**: enable jails for `plesk-panel`, `ssh`, and `nginx-badbots`.
- **Auto-updates**: turn on **Tools & Settings → Update Settings → Install security updates automatically**.
- **Resource limits** (CloudLinux only): set per-tenant CPU/RAM caps in LVE Manager.
- **Rate-limit `/api/auth/*` and `/api/audits/*/scan`** at the Nginx layer if you expect public traffic. Add to *Apache & nginx Settings → Additional nginx directives*:

  ```nginx
  limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
  location /api/auth/ { limit_req zone=auth burst=10 nodelay; proxy_pass http://127.0.0.1; }
  ```

- **Headers** — already set in `next.config.ts` (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`). Add HSTS via Plesk SSL/TLS settings.

---

## 14. Backup & restore

### Database

In Plesk: Domains → *yourdomain.com* → **Backup Manager** → schedule daily incremental + weekly full to remote storage (S3, Backblaze, FTP).

Manual one-off:

```bash
mysqldump -u vision_user -p \
  --single-transaction --quick --routines --triggers \
  vision_audit_flow > ~/backups/vision_$(date +%F).sql
gzip ~/backups/vision_*.sql
```

Restore:

```bash
gunzip -c vision_2026-05-17.sql.gz | mysql -u vision_user -p vision_audit_flow
```

### Uploads

```bash
tar -czf ~/backups/uploads_$(date +%F).tgz -C ~/httpdocs/public uploads
```

### `.env.production`

Encrypt and store off-server. Treat it like a credential.

---

## 15. FAQ / common errors

**`Error: P1001: Can't reach database server at 'localhost:3306'`**
→ MariaDB isn't running, or `DATABASE_URL` host/port is wrong. Verify with `mysql -u vision_user -p`.

**`PrismaClientInitializationError: ... ENOENT: ... .prisma/client`**
→ `prisma generate` didn't run. Fix: `npx prisma generate` then restart the app.

**`Module not found: Can't resolve 'sharp'` during `next build`**
→ Some Plesk Node builds need: `npm install --include=optional sharp`.

**App returns 502 / "We're sorry, but something went wrong"**
→ This is Passenger's error page. Check `~/logs/error_log` — usually a missing env var or unhandled DB error on boot.

**Auth.js: `[auth][error] MissingSecret`**
→ `AUTH_SECRET` is empty. Set it in Plesk env vars and restart.

**Auth.js: `UntrustedHost`**
→ Set `AUTH_TRUST_HOST=true` (already in this guide).

**Uploads return 413 Payload Too Large**
→ Plesk Nginx caps body size. Add to *Apache & nginx Settings → Additional nginx directives*:

  ```nginx
  client_max_body_size 25m;
  ```

**`next start` runs but only on port 3000, Plesk shows 502**
→ Don't set `PORT` in env vars; Passenger injects its own. Our `plesk.app.js` already respects this.

**Build OOM-killed on small VPS (<2 GB RAM)**
→ Run with a memory cap and swap:

  ```bash
  NODE_OPTIONS="--max-old-space-size=1024" npm run build
  ```

  Or build locally and `rsync` the `.next/` directory up.

---

**You're done.** Visit `https://yourdomain.com`, log in as admin, and start auditing.

For the automated re-deploy script see [`deploy.sh`](./deploy.sh).
