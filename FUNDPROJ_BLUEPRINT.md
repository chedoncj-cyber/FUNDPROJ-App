# FUNDPROJ APP — Full Architecture & Feature Blueprint

**Version:** 1.0.0  
**Date:** 2026-11-05  
**Template Base:** `vercel/nextjs-subscription-payments`  
**Owner:** chedoncj@gmail.com

---

## 1. PURPOSE & OVERVIEW

FUNDPROJ APP is a SaaS project-funding tracker that lets individuals contribute payments toward named projects — school projects, wedding planning, holiday planning, group savings goals, or any shared financial target. It acts as a central ledger that connects to multiple payment platforms (Changoapp.com, Stripe, PayPal, GoCardless, Flutterwave), ingests daily payment data via SFTP, and applies Revenue Recognition rules under ASC 606 / IFRS 15.

**Core value proposition:**
- One dashboard to see every individual's contribution to every project
- Automatic daily sync from payment apps — no manual entry
- Proper accounting controls: deferred vs recognised revenue, full audit trail
- Alphabetical member directory with stable ID numbers
- Subscription-style recurring contributions (weekly / monthly)

---

## 2. TECHNOLOGY STACK

| Layer | Choice | Alternative |
|---|---|---|
| Frontend framework | Next.js 14 (App Router) | Remix, SvelteKit |
| UI library | shadcn/ui + Tailwind CSS | Chakra UI, MUI |
| Auth | Supabase Auth (email + OAuth) | NextAuth.js, Clerk |
| Database | Supabase Postgres | PlanetScale, Neon |
| Realtime updates | Supabase Realtime | Pusher, Ably |
| File storage | Supabase Storage | AWS S3, Cloudflare R2 |
| Primary payments | Stripe Subscriptions | Paddle |
| SFTP sync | `ssh2-sftp-client` (Node.js) | `sftp` Python, AWS Transfer |
| Cron jobs | Vercel Cron Functions | GitHub Actions, Railway |
| Deployment | Vercel | Render, Railway |
| Language | TypeScript | JavaScript |

---

## 3. SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                        FUNDPROJ APP                             │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐   │
│  │  Next.js UI  │◄──►│  API Routes  │◄──►│  Supabase DB   │   │
│  │  (Vercel)    │    │  (Vercel)    │    │  (Postgres)    │   │
│  └──────────────┘    └──────┬───────┘    └────────────────┘   │
│                             │                                   │
│                    ┌────────┴────────┐                         │
│                    │  Payment Layer  │                         │
│                    └────────┬────────┘                         │
│                             │                                   │
│        ┌────────────────────┼─────────────────────┐           │
│        ▼                    ▼                     ▼           │
│  ┌──────────┐       ┌────────────┐        ┌────────────┐      │
│  │  Stripe  │       │ GoCardless │        │ Flutterwave│      │
│  │  (sub)   │       │ (DD UK/EU) │        │ (Africa)   │      │
│  └──────────┘       └────────────┘        └────────────┘      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               SFTP SYNC JOB (02:00 UTC daily)           │  │
│  │  Changoapp.com ──► CSV ingest ──► payment_ledger table  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          REVENUE RECOGNITION ENGINE (ASC 606)           │  │
│  │  Deferred Revenue ──► Recognition Schedule ──► Revenue  │  │
│  └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. CORE FEATURES

### 4.1 Project Management
- Create funding projects with name, description, target amount, currency, end date
- Project types: School, Wedding, Holiday, Savings, Custom
- Visibility: Private (invite-only) / Public (open contribution link)
- Project status: Active / Funded / Closed / Paused

### 4.2 Individual / Member List Management
- Create members: First Name, Last Name, Email, Phone, ID Number (auto-assigned)
- Upload bulk list via CSV or Excel file
- **Display always alphabetical** (Last Name → First Name)
- **Stable ID numbers** — once assigned, never change (format: FP-00001, FP-00002, …)
- Member roles: Contributor / Project Owner / Admin / Vendor / Student

### 4.3 Payment Tracking
- Per-member, per-project running balance
- Payment history: date, amount, currency, platform, reference
- Outstanding balance = target allocation − total paid
- Overpayment flag + notification

### 4.4 SFTP Daily Sync (Changoapp.com)
- Cron runs 02:00 UTC
- Downloads latest CSV from Changoapp SFTP server
- Maps Changoapp `member_ref` → FUNDPROJ `individual_id`
- Upserts into `payment_ledger` (idempotent on `platform_ref`)
- Sends notification summary email after sync

### 4.5 Subscription / Recurring Contributions
- Weekly or monthly standing orders via Stripe Billing
- Member subscribes to a project: sets amount + frequency
- Billing schedule auto-generates invoices
- Missed payment → email alert + suspend flag

### 4.6 Revenue Recognition (ASC 606 / IFRS 15)
- See `FUNDPROJ_REVREC_WORKBOOK.md` for full detail
- Deferred Revenue ledger per project per member
- Recognition released on project milestone or time schedule
- Monthly 'Revenue not yet recognised' report
- Audit trail: all schedule entries immutable

### 4.7 Reporting & Audit
- Project funding progress (% funded, amount raised, outstanding)
- Member contribution history
- Deferred vs recognised revenue reconciliation
- SFTP sync log (success / failures / records processed)
- Export: CSV / Excel / PDF

---

## 5. USER FLOWS

### 5.1 Admin creates a project
1. Login → Dashboard → New Project
2. Enter: Name, Type, Target Amount, Currency, Start/End Date, Payment frequency
3. Add members (manual or CSV upload)
4. System assigns ID numbers alphabetically
5. Share contribution link with members

### 5.2 Member makes payment on Changoapp.com
1. Member opens Changoapp.com app
2. Makes payment referencing their FUNDPROJ ID (FP-XXXXX)
3. Changoapp records payment in their system
4. At 02:00 UTC — SFTP job pulls latest file
5. Payment_ledger updated → member balance updated
6. Dashboard reflects new total instantly (Supabase Realtime)

### 5.3 Revenue Recognition cycle (monthly)
1. Month-end: Finance Admin opens RevRec report
2. System shows deferred balance per project
3. Releases recognised amount per schedule
4. Journals posted: Dr Deferred Revenue / Cr Revenue
5. Report exported for audit

---

## 6. ALTERNATIVE APPROACHES

| Decision | Recommended | Alternative A | Alternative B |
|---|---|---|---|
| Payment sync | SFTP daily CSV | Changoapp Webhook (real-time) | Manual CSV upload |
| Recurring billing | Stripe Subscriptions | GoCardless (UK DD) | Manual invoicing |
| Auth | Supabase Auth | Clerk | Auth0 |
| Database | Supabase Postgres | PlanetScale MySQL | Firebase Firestore |
| RevRec store | Supabase tables | D365 Finance module | QuickBooks + plugin |
| SFTP runner | Vercel Cron | GitHub Actions cron | Railway cron worker |
| Frontend base | nextjs-subscription-payments | Create-T3-App | Blitz.js |

---

## 7. ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Changoapp SFTP
CHANGOAPP_SFTP_HOST=
CHANGOAPP_SFTP_PORT=22
CHANGOAPP_SFTP_USER=
CHANGOAPP_SFTP_PASSWORD=
CHANGOAPP_SFTP_PATH=/exports/payments/

# GoCardless
GOCARDLESS_ACCESS_TOKEN=
GOCARDLESS_WEBHOOK_SECRET=

# Flutterwave
FLW_PUBLIC_KEY=
FLW_SECRET_KEY=
FLW_WEBHOOK_HASH=

# PayPal
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# App
NEXT_PUBLIC_SITE_URL=https://fundproj.app
CRON_SECRET=
```

---

## 8. PROJECT FOLDER STRUCTURE

```
FUNDPROJ_APP/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   ├── members/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── settings/
│   ├── api/
│   │   ├── payments/             # Stripe, GoCardless webhooks
│   │   ├── sftp-sync/            # SFTP cron endpoint
│   │   ├── members/              # CRUD
│   │   └── revrec/               # Revenue recognition engine
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── members/
│   │   ├── MemberList.tsx        # Alphabetical sorted list
│   │   ├── MemberCard.tsx
│   │   └── MemberUpload.tsx      # CSV upload
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── FundingProgress.tsx
│   │   └── PaymentHistory.tsx
│   └── reports/
│       ├── RevRecReport.tsx
│       └── SyncLog.tsx
├── lib/
│   ├── supabase/
│   ├── stripe/
│   ├── sftp/                     # Changoapp SFTP client
│   ├── revrec/                   # ASC 606 engine
│   └── payments/                 # Multi-platform normaliser
├── jobs/
│   └── sftp-sync.ts              # Daily SFTP ingestion job
├── supabase/
│   └── migrations/               # DB schema migrations
└── docs/
    ├── FUNDPROJ_BLUEPRINT.md
    ├── FUNDPROJ_API_SPEC.md
    ├── FUNDPROJ_DB_SCHEMA.sql
    ├── FUNDPROJ_REVREC_WORKBOOK.md
    ├── FUNDPROJ_SFTP_SPEC.md
    ├── FUNDPROJ_FRONTEND_GUIDE.md
    └── FUNDPROJ_DEPLOY_GUIDE.md
```

---

## 9. MILESTONES

| Phase | Deliverable | Est. Duration |
|---|---|---|
| 0 | Repo scaffold (nextjs-subscription-payments clone) | 1 day |
| 1 | Supabase schema + Auth | 2 days |
| 2 | Member list UI (alphabetical, ID numbers, CSV upload) | 3 days |
| 3 | Project creation & management | 2 days |
| 4 | Stripe subscriptions integration | 2 days |
| 5 | Changoapp SFTP sync job | 2 days |
| 6 | Revenue Recognition engine | 3 days |
| 7 | Reports & export | 2 days |
| 8 | GoCardless + Flutterwave connectors | 3 days |
| 9 | Vercel deployment + Cron | 1 day |
| **Total** | | **~21 days** |
