# LOOP — Corporate-Grade Multi-Tenant AI Customer-Feedback Intelligence Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma-2d3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Neon-336791?style=flat&logo=postgresql)](https://neon.tech/)
[![Anthropic Claude](https://img.shields.io/badge/AI-Claude%20Sonnet%20(Server--Side)-d97706)](https://anthropic.com/)

**LOOP** is a corporate-grade, multi-tenant AI Customer-Feedback Intelligence Platform built for high-scale B2B SaaS teams. LOOP ingests unstructured feedback across disparate channels (support tickets, app store reviews, NPS surveys, sales call notes, community discussions), auto-classifies sentiment and thematic clusters via Claude Sonnet, surfaces trend velocity and spike detection, provides strict evidence-grounded Q&A ("Ask LOOP") via vector retrieval, and generates deterministic Voice-of-Customer executive reports.

---

## 🚀 Demo Credentials & Instant RBAC Roles

A seeded workspace (**Apex Cloud Technologies**) is pre-configured with 130 realistic feedback records and 3 documented accounts to test role-based access control (RBAC):

| Role | Email | Password | Permissions Summary |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@loop.dev` | `Password123!` | Full workspace access: manage team roles, invite members, delete feedback, trigger auto-classification, generate reports. |
| **ANALYST** | `analyst@loop.dev` | `Password123!` | Feedback triage: ingest single & bulk CSV feedback, update workflow status (`NEW` → `REVIEWED` → `ACTIONED`), run AI classification, generate VoC reports. Cannot modify member roles. |
| **VIEWER** | `viewer@loop.dev` | `Password123!` | Read-only access: view dashboard charts, browse inbox, query Ask LOOP, inspect themes and VoC reports. Mutation actions are blocked server-side (HTTP 403). |

> **Pro Tip:** In the bottom-left of the sidebar or on the login page, use the **One-Click Role Switcher** to seamlessly evaluate Admin, Analyst, and Viewer permissions without manual logouts.

---

## 🏛️ Architecture & Tenant Isolation

```
Browser Client (Next.js 14 App Router, Tailwind CSS, Recharts)
   │
   ▼
[Auth Guard & Role Middleware]  ──(NextAuth JWT with workspaceId & role)
   │
   ├── HTTP 401 Unauthorized (if unauthenticated)
   ├── HTTP 403 Forbidden (if role has insufficient permissions)
   │
   ▼
[API Route Handlers with Zod Validation]
   │
   ├── Auto-Classification Pipeline ──► Anthropic Claude Sonnet API (Server-side only)
   ├── Vector Similarity Search     ──► Cosine Retrieval / pgvector (Scoped to workspaceId)
   ├── VoC Synthesis Engine         ──► Stage 1: Deterministic Metrics Calculation in Code
   │                                     Stage 2: Claude Narrative Generation
   │
   ▼
[Prisma ORM Client]
   │
   ▼
[PostgreSQL / SQLite Database] ──(Strict Multi-Tenant Query Scoping: WHERE workspaceId = ?)
```

### Strict Multi-Tenancy Guarantee
Every query touching `Feedback`, `Theme`, `FeedbackTheme`, `Embedding`, `Report`, or `User` is strictly scoped by the authenticated user's `session.user.workspaceId`. Users from one company can never inspect or modify another organization's telemetry, even by guessing IDs in the URL.

## 🧰 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) + TypeScript |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) — Dark-mode palette |
| **Database (Dev)** | SQLite via Prisma (`prisma/schema.prisma`) — zero-config local dev |
| **Database (Prod)** | PostgreSQL on [Neon](https://neon.tech/) / [Supabase](https://supabase.com/) with pgvector |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Auth** | [NextAuth (Auth.js)](https://next-auth.js.org/) — Credentials provider + JWT sessions with `workspaceId` + `role` |
| **AI** | [Anthropic Claude Sonnet (`claude-sonnet-4-6`)](https://anthropic.com/) — **server-side only** |
| **Embeddings** | Normalized float-array vectors (cosine similarity) stored in Prisma, pgvector-compatible |
| **Charts** | [Recharts](https://recharts.org/) |
| **Validation** | [Zod](https://zod.dev/) on every API boundary |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **CSV Parsing** | [PapaParse](https://www.papaparse.com/) |
| **Deployment** | [Vercel](https://vercel.com/) + hosted PostgreSQL |

---

## 📋 Features Overview

### ✅ M1 — Auth, Multi-Tenancy & RBAC
- **Credentials-based login** (NextAuth JWT) with one-click demo role switcher on the login page.
- **Multi-tenant isolation**: every Prisma query is scoped by `session.user.workspaceId` — no cross-org data leaks.
- **Three RBAC roles** enforced server-side with HTTP 403:
  - `ADMIN`: full workspace control (members, roles, delete feedback, all AI features)
  - `ANALYST`: feedback triage (ingest, classify, update status, generate reports)
  - `VIEWER`: read-only (dashboard, inbox, Ask LOOP, report inspection)

### ✅ M2 — Feedback Ingestion & Inbox
- **Single entry form** with Zod validation (channel, sentiment, customer label, content).
- **Bulk CSV upload** with PapaParse — success/failure count report.
- **Channel Simulator** with 5 preset channel event generators.
- **Feedback Inbox** with server-side pagination, debounced search, and multi-faceted filters:
  - Channel, sentiment, theme, and status filters.
  - Inline status workflow: `NEW` → `REVIEWED` → `ACTIONED`.
  - Feedback inspection drawer with Re-classify button.

### ✅ M2 — Analytics Dashboard
- 5 stat cards (total, avg sentiment, positive %, negative %, actioned %).
- **Volume Over Time** (Recharts AreaChart).
- **Sentiment Breakdown** (Recharts PieChart / Donut).
- **Top Themes Distribution** (Recharts BarChart).
- **Channel Distribution** (Recharts RadialBarChart).
- **Spike Detection Banner** — alerts when a theme grows >40% in 7 days.

### ✅ M3 AI1 — Auto-Classification (Claude)
- Every new feedback item is automatically classified server-side on ingestion.
- **Classification output**: sentiment (`POS` / `NEG` / `NEU`), sentiment score (`-2` to `+2`), theme clusters (multi-label), feature area label.
- **Manual re-classification** ("Re-classify with Claude") available from the feedback inspection drawer.
- Falls back to a high-fidelity local engine if `ANTHROPIC_API_KEY` is not set (platform never crashes during offline/keyless testing).

### ✅ M3 AI2 — Theme Clustering & Trend Velocity
- 7-day velocity metric per theme (growth rate vs. prior period).
- **Spike Detection**: themes with ≥40% growth are automatically flagged with a spike badge.
- Themes view with click-through to filtered inbox.
- Custom theme creation modal.

### ✅ M3 AI3 — Ask LOOP (Grounded Q&A with Vector Retrieval)
- Natural-language question interface backed by a **RAG pipeline**:
  1. Question is embedded and compared to all workspace feedback vectors via cosine similarity.
  2. Top-K citations are retrieved scoped strictly to the user's `workspaceId`.
  3. Claude synthesizes a **strictly grounded answer** citing real feedback items by ID — no hallucinations about data that is not present.
- Suggested questions as preset chips to onboard new users.

### ✅ M4 AI4 — Voice-of-Customer (VoC) Executive Reports
- **Two-stage deterministic pipeline**:
  1. **Stage 1 (Code):** Pre-compute exact metrics (total count, sentiment distribution, theme velocities, top quotes, key friction areas) deterministically in TypeScript.
  2. **Stage 2 (Claude):** Claude writes the executive narrative around the verified Stage-1 numbers — ensuring the prose is never contradicted by the data.
- **Report Viewer** with: Executive Briefing, Sentiment Scorecard, Satisfaction Drivers, Friction Points, Representative Quotes, and Prioritized Action Plan (P0/P1/P2).
- **Export to PDF / Print** via `window.print()` with `@media print` optimized styles.
- **Shareable link** copy button.
- Historical report archive with generation metadata.

### ✅ M4 — Team Management
- Workspace member list with name, email, role badge, and join date.
- **Invite Member modal** (Admin only) — creates user in the same workspace.
- **Inline role selector** to promote/demote members (Admin only, server-enforced).
- Permission matrix legend explaining ADMIN / ANALYST / VIEWER capabilities.

---

## ⚙️ Local Setup

### Prerequisites
- **Node.js** ≥18.17
- **npm** ≥9

> No external database or API key is required for local development. SQLite is used by default, and a local AI fallback engine is bundled for testing without an Anthropic key.

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd loop
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#environment-variables) below). For local development, the defaults in `.env.example` work immediately.

### 3. Initialize Database & Seed

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

This creates the SQLite database at `prisma/dev.db`, runs the schema, and seeds:
- 1 workspace: **Apex Cloud Technologies**
- 3 users with RBAC roles (see [Demo Credentials](#-demo-credentials--instant-rbac-roles))
- 7 theme clusters
- **130 realistic feedback items** across 5 channels with sentiment, scores, and theme assignments spanning 42 days
- 130 vector embeddings for semantic search
- 1 baseline VoC report

### 4. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). The root redirects to `/login`.

---

## 🌍 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# === DATABASE ===
# Local dev uses SQLite (default — no changes required)
DATABASE_URL="file:./prisma/dev.db"

# Production: Neon / Supabase PostgreSQL
# DATABASE_URL="postgresql://user:pass@hostname/dbname?sslmode=require"

# === AUTH ===
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# === ANTHROPIC CLAUDE AI ===
# Optional for local dev. Platform uses a local fallback engine when not set.
# Required for production AI quality.
ANTHROPIC_API_KEY="sk-ant-..."
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | SQLite path for dev, PostgreSQL URL for production |
| `NEXTAUTH_SECRET` | ✅ | Random 32-byte base64 string |
| `NEXTAUTH_URL` | ✅ | Full base URL of your deployment |
| `ANTHROPIC_API_KEY` | ⚠️ Optional | Claude Sonnet API key — falls back to local engine if absent |

---

## 🚀 Production Deployment (Vercel + Neon)

### 1. Set Up PostgreSQL (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the **connection string** (format: `postgresql://user:pass@host/dbname?sslmode=require`).

### 2. Switch Prisma Schema to PostgreSQL

```bash
# Backup existing schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma.bak

# Activate PostgreSQL schema
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

Then run:

```bash
npx prisma generate
npx prisma db push        # Creates tables in Neon
npx tsx prisma/seed.ts    # Seeds demo data
```

### 3. Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Set these **Environment Variables** in your Vercel project dashboard:

| Variable | Value |
| :--- | :--- |
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Your 32-byte random secret |
| `NEXTAUTH_URL` | `https://your-project.vercel.app` |
| `ANTHROPIC_API_KEY` | Your Claude API key |

---

## 📁 Project Structure

```
loop/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx           # Sign-in with one-click demo role buttons
│   │   └── register/page.tsx        # Organization registration
│   ├── (dashboard)/
│   │   ├── layout.tsx               # Sidebar shell, workspace badge, role switcher
│   │   ├── dashboard/page.tsx       # Analytics with 4 Recharts visualizations
│   │   ├── inbox/page.tsx           # Feedback inbox with filtering & pagination
│   │   ├── trends/page.tsx          # Theme clusters, velocity, spike detection
│   │   ├── ask/page.tsx             # Ask LOOP — grounded Q&A chat
│   │   ├── reports/
│   │   │   ├── page.tsx             # VoC report list & generator modal
│   │   │   └── [id]/page.tsx        # Executive report viewer with PDF export
│   │   └── team/page.tsx            # Team management & RBAC role assignment
│   ├── api/
│   │   ├── analytics/route.ts       # Dashboard metrics & time-series
│   │   ├── ask/route.ts             # Grounded Q&A with vector retrieval
│   │   ├── auth/
│   │   │   ├── [...nextauth]/       # NextAuth JWT handler
│   │   │   └── register/            # Workspace + first ADMIN creation
│   │   ├── feedback/
│   │   │   ├── route.ts             # GET (paginated) / POST (single ingestion)
│   │   │   ├── bulk/route.ts        # POST bulk CSV ingestion
│   │   │   ├── simulate/route.ts    # POST channel simulation
│   │   │   └── [id]/
│   │   │       ├── route.ts         # GET / PATCH status / DELETE
│   │   │       └── classify/route.ts # POST manual AI re-classification
│   │   ├── reports/
│   │   │   ├── route.ts             # GET history / POST generate
│   │   │   └── [id]/route.ts        # GET single report / DELETE
│   │   ├── themes/route.ts          # GET velocities / POST custom theme
│   │   └── workspace/members/route.ts # GET members / POST invite / PATCH role
│   ├── globals.css                  # Dark theme palette + @media print styles
│   ├── layout.tsx                   # Root layout with SessionProvider
│   └── page.tsx                     # Root redirect → /login or /dashboard
├── components/
│   ├── badges.tsx                   # SentimentBadge, ChannelBadge, StatusBadge, RoleBadge
│   ├── feedback-drawer.tsx          # Feedback inspection drawer with AI re-classify
│   ├── ingest-modal.tsx             # Single / CSV / Simulator ingestion modal
│   └── providers.tsx                # SessionProvider client wrapper
├── lib/
│   ├── analytics.ts                 # Deterministic metrics, spike detection, VoC stats
│   ├── anthropic.ts                 # Claude API client + local fallback engine
│   ├── auth-guard.ts                # requireAuth(), requireRole() — tenant isolation
│   ├── auth.ts                      # NextAuth options, credentials provider
│   ├── db.ts                        # Cached Prisma client singleton
│   ├── validations.ts               # All Zod schemas
│   └── vector-search.ts             # Embedding generation + cosine similarity search
├── prisma/
│   ├── schema.prisma                # SQLite schema (local dev)
│   ├── schema.postgresql.prisma     # PostgreSQL + pgvector schema (production)
│   └── seed.ts                      # Workspace, users, themes, 130 feedback items + embeddings
├── types/
│   ├── index.ts                     # Shared TypeScript interfaces
│   └── next-auth.d.ts               # NextAuth session augmentation (workspaceId, role)
├── scripts/
│   └── test-platform.ts             # Automated 8-check platform verification
├── .env.example                     # Environment variable template
└── README.md                        # This document
```

---

## 🔒 Security Architecture

| Concern | Implementation |
| :--- | :--- |
| **Multi-tenancy** | `workspaceId` scoped on every DB query via `requireAuth()` |
| **RBAC enforcement** | `requireRole()` server-side guard returns HTTP 403 — not just hidden UI |
| **AI calls client-side** | ❌ Never — Claude API is only ever called inside `app/api/` route handlers |
| **Password hashing** | `bcryptjs` with salt rounds = 12 |
| **Session** | NextAuth JWT with short-lived expiry; `workspaceId` and `role` embedded in token |
| **Input validation** | Zod schemas on every API boundary — invalid payloads rejected with 400 |
| **Cross-tenant reads** | Impossible — all feedback, theme, embedding, and report queries filter by `workspaceId` |

---

## 🧪 Verification

Run the included automated platform verification script:

```bash
npx tsx scripts/test-platform.ts
```

**Output (all 8 checks must pass):**
- ✅ Workspace and 3 demo users present
- ✅ All 3 bcrypt password hashes verified (`Password123!`)
- ✅ 130 feedback items + 130 vector embeddings indexed
- ✅ 7 themes with velocity calculation
- ✅ Spike detection correctly flagged (+475% velocity threshold hit)
- ✅ Vector similarity search returns grounded citations
- ✅ Auto-classification pipeline (sentiment + themes + feature area)
- ✅ Two-stage VoC report: deterministic metrics + Claude executive narrative

---

## 📄 License

MIT — built as a portfolio-grade SaaS platform demonstration.
