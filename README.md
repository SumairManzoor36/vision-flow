# Vision Audit Flow Pro

> **AI-Powered Automated Inventory Audit System**
> Enterprise-grade. Self-hostable. Built on Next.js 15 + MariaDB 11 + Prisma + Google Gemini Vision.

![Vision Audit Flow Pro](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![MariaDB](https://img.shields.io/badge/MariaDB-11.x-003545?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini-Vision-4285F4?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)

---

## ✨ What it does

Snap a photo of any shelf, warehouse aisle, or stockroom and let **Google Gemini Vision** count and identify every item — then automatically reconcile against your master catalog and flag every discrepancy. Built for warehouses, retail chains, and manufacturers who refuse to lose another dollar to shrinkage.

### Key features

- 📸 **AI Vision Audit** — Upload a photo, Gemini detects items, counts quantities, returns confidence-scored JSON with bounding boxes.
- 🔄 **Auto-reconciliation** — Detected items are matched against your product catalog, expected stock levels are pulled from MariaDB, discrepancies surface instantly.
- 🧠 **AI Insights** — Generate operational recommendations & anomaly detection from your audit history.
- 📊 **Live dashboard** — KPIs, 14-day trend chart, recent audits, and severity-ranked AI insights.
- 📦 **Inventory** — Products, SKUs, barcodes, categories, multi-location stock tracking, low-stock alerts.
- 🏢 **Multi-location** — Warehouses, retail stores, stockrooms, transit zones.
- 👥 **Role-based access** — `ADMIN`, `MANAGER`, `AUDITOR`, `VIEWER` with strict server-side enforcement.
- 🔐 **Auth.js** — Secure credentials auth with bcrypt-hashed passwords + JWT sessions.
- 🎨 **Premium UI/UX** — Glass morphism, dark mode, animated gradients, custom SVG iconography.
- 🚀 **Fast** — RSC + Turbopack + edge-ready middleware. Sub-second page transitions.
- 🛠 **Plesk-ready** — Drop-in entry point, env-based configuration, runs on Phusion Passenger.

---

## 🧬 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 15** (App Router, RSC, Turbopack) |
| UI | **React 19** + **TailwindCSS 3.4** + Radix primitives |
| Animations | **Framer Motion** |
| Charts | **Recharts** |
| Icons | **Lucide React** (SVG) + custom branded SVG logo |
| Auth | **Auth.js v5** (NextAuth) + bcryptjs |
| Database | **MariaDB 11.x** |
| ORM | **Prisma 5** |
| AI | **Google Gemini** (`gemini-2.0-flash-exp` for vision, `gemini-1.5-pro` for text) |
| Forms / Validation | React Hook Form + Zod |
| Notifications | Sonner |

---

## 🚀 Quickstart (local dev)

### 1. Prerequisites

- **Node.js 22 LTS or newer** (Node 23+ also works; Node 25 once it's GA)
- **MariaDB 11.x** (or MySQL 8 — also compatible)
- A **Google Gemini API key** ([get one here](https://aistudio.google.com/app/apikey))

### 2. Clone & install

```bash
git clone <your-repo-url> vision-audit-flow-pro
cd vision-audit-flow-pro
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://vision_user:STRONG_PASSWORD@localhost:3306/vision_audit_flow"
AUTH_SECRET="generate with: openssl rand -base64 32"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_VISION_MODEL="gemini-2.0-flash-exp"
GEMINI_TEXT_MODEL="gemini-1.5-pro"
```

### 4. Create the MariaDB database

```sql
CREATE DATABASE vision_audit_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vision_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON vision_audit_flow.* TO 'vision_user'@'localhost';
FLUSH PRIVILEGES;
```

### 5. Run migrations + seed

```bash
npm run db:push       # creates schema (or `npm run db:migrate` for migration history)
npm run db:seed       # demo users, products, locations, audits, insights
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 7. Log in

| Role    | Email                            | Password       |
|---------|----------------------------------|----------------|
| Admin   | `admin@vision-audit.app`         | `admin1234`    |
| Manager | `manager@vision-audit.app`       | `manager1234`  |
| Auditor | `auditor@vision-audit.app`       | `auditor1234`  |

⚠️ **Change these immediately in production.**

---

## 📁 Project structure

```
vision-audit-flow-pro/
├── prisma/
│   ├── schema.prisma          # Full data model (users, audits, products, AI insights…)
│   └── seed.ts                # Demo data
├── src/
│   ├── app/
│   │   ├── (auth)/            # Login + register
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/     # KPI dashboard
│   │   │   ├── audits/
│   │   │   │   ├── new/       # 🌟 AI Vision capture flow
│   │   │   │   └── [id]/      # Audit detail + review
│   │   │   ├── inventory/
│   │   │   ├── locations/
│   │   │   ├── reports/
│   │   │   ├── insights/      # AI-generated insights
│   │   │   └── admin/         # Users, activity log, settings
│   │   ├── api/
│   │   │   ├── auth/          # Auth.js handlers + register
│   │   │   ├── audits/        # CRUD + Gemini scan
│   │   │   ├── inventory/
│   │   │   ├── locations/
│   │   │   ├── audit-items/   # Item review API
│   │   │   └── insights/      # AI insight generation
│   │   ├── layout.tsx
│   │   └── page.tsx           # Marketing landing page
│   ├── components/
│   │   ├── ui/                # shadcn-style primitives
│   │   ├── icons/             # Custom branded SVG logo
│   │   ├── dashboard/         # Sidebar, topbar, KPI card, chart
│   │   ├── providers.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Prisma client
│   │   ├── auth.ts            # Auth.js v5 config
│   │   ├── gemini.ts          # Gemini Vision + text client
│   │   ├── upload.ts          # Image storage helpers
│   │   ├── api.ts             # API route helpers
│   │   ├── rbac.ts            # Role-based access control
│   │   └── utils.ts
│   └── middleware.ts          # Auth-aware route protection
├── public/uploads/            # Saved audit scan images
├── plesk.app.js               # Plesk / Passenger entrypoint
├── .env.example
├── package.json
└── README.md
```

---

## 🤖 How the AI Vision flow works

1. **User uploads/captures a photo** of a shelf, aisle, or stockroom from the *New AI Scan* page.
2. The image is **base64-encoded and POSTed** to `/api/audits/[id]/scan`.
3. The server saves the file to `public/uploads/` and calls **Gemini Vision** (`gemini-2.0-flash-exp`) with a strict JSON-output prompt.
4. Gemini returns: `[{ label, category, quantity, confidence, boundingBox, notes }, …]` plus a summary and warnings.
5. Each detected item is **fuzzy-matched** against `Product` rows by name, then **persisted** as `AuditItem` rows.
6. Detected vs expected quantities (from `StockItem`) are compared → discrepancies counted.
7. The audit transitions `DRAFT` → `PROCESSING` → `REVIEW` and a human can adjust quantities, accept or reject, then mark `COMPLETED`.

The AI prompt and parsing live in [`src/lib/gemini.ts`](src/lib/gemini.ts) — easy to swap to a newer model by changing `GEMINI_VISION_MODEL`.

---

## 🔐 Roles & permissions

| Capability              | VIEWER | AUDITOR | MANAGER | ADMIN |
|------------------------|:------:|:-------:|:-------:|:-----:|
| View dashboard / reports |   ✓    |    ✓    |    ✓    |   ✓   |
| Create / run audits      |        |    ✓    |    ✓    |   ✓   |
| Edit inventory & locations |      |         |    ✓    |   ✓   |
| Generate AI insights     |        |         |    ✓    |   ✓   |
| Manage users             |        |         |         |   ✓   |
| System settings          |        |         |         |   ✓   |

The first user to register automatically becomes `ADMIN`.

---

## 🌍 Plesk deployment

A **complete, step-by-step Plesk deployment guide** is in [`PLESK_DEPLOYMENT.md`](./PLESK_DEPLOYMENT.md) and a fully-automated re-deploy script in [`deploy.sh`](./deploy.sh).

**TL;DR** for the first install:

1. **Create a Node.js application** in Plesk (Domains → Node.js, Node 22+, Application Startup File = `plesk.app.js`).
2. **Create a `utf8mb4` MariaDB database** + user from Plesk → Databases.
3. **Upload the code** (Git clone or SFTP) into the Application root.
4. **Set env vars** in the Plesk Node.js panel (`DATABASE_URL`, `AUTH_SECRET`, `GEMINI_API_KEY`, …).
5. SSH in and run:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh --seed     # first deploy, with demo data
   ```
6. From the Plesk Node.js panel: **Restart App**.

For every subsequent release:

```bash
ssh user@yourdomain.com
cd ~/httpdocs && ./deploy.sh
```

`deploy.sh` handles `git pull` → `npm ci` → `prisma migrate deploy` → `next build` → graceful Passenger restart → health check.

> **Persistent storage:** the `public/uploads` directory must be writable by the Plesk user (chmod 750). `deploy.sh` never wipes it.

---

## 🧪 Development scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Next.js with Turbopack |
| `npm run build` | Production build (runs `prisma generate` first) |
| `npm run start` | Run production server |
| `npm run db:push` | Sync schema to DB (no migration files) |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Run seed script |
| `npm run db:studio` | Open Prisma Studio |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

---

## 🔧 Configuration reference

All configuration is environment-driven. See [`.env.example`](.env.example).

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DATABASE_URL` | ✓ |  | MariaDB connection string |
| `AUTH_SECRET` | ✓ |  | JWT signing key (`openssl rand -base64 32`) |
| `GEMINI_API_KEY` | ✓ |  | Google Gemini API key |
| `GEMINI_VISION_MODEL` |  | `gemini-2.0-flash-exp` | Vision model ID |
| `GEMINI_TEXT_MODEL` |  | `gemini-1.5-pro` | Text generation model ID |
| `UPLOAD_DIR` |  | `./public/uploads` | Where audit scans are saved |
| `MAX_UPLOAD_MB` |  | `20` | Per-file image upload limit |
| `NEXT_PUBLIC_APP_URL` |  | `http://localhost:3000` | Public URL of your deployment |

---

## 🛡 Security notes

- All passwords are bcrypt-hashed (cost 12).
- Auth uses **JWT sessions** signed with `AUTH_SECRET`.
- API routes enforce roles server-side via `requireRoleSession()` from [`src/lib/api.ts`](src/lib/api.ts).
- Middleware redirects unauthenticated users to `/login` and authenticated users away from auth pages.
- Strict CSP-friendly headers (`X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`) configured in [`next.config.ts`](next.config.ts).
- File uploads are size-capped and stored outside source code.
- Camera permission requested only on the audit capture page.

---

## 🗺 Roadmap

- [ ] Webcam live scanning (currently file-upload only)
- [ ] Bulk import products from CSV
- [ ] CSV / PDF / Excel report exports
- [ ] Realtime audit collaboration via WebSockets
- [ ] Multi-tenant workspaces
- [ ] Automated reorder workflows triggered by AI insights
- [ ] Mobile PWA install
- [ ] Native mobile apps (Expo)

---

## 📄 License

MIT — use it, fork it, ship it.

---

**Built with ♥ for operations teams worldwide.**
