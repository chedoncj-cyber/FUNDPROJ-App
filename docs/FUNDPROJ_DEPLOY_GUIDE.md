# FUNDPROJ APP — Deployment Runbook
## Vercel + Supabase

**Version:** 1.0.0  
**Date:** 2026-11-05

---

## 1. PREREQUISITES

- Node.js 20+
- Git
- Vercel CLI: `npm i -g vercel`
- Supabase CLI: `npm i -g supabase`
- Stripe CLI (for webhook testing): `stripe listen`

---

## 2. STEP 1 — CLONE TEMPLATE

```bash
# Clone vercel/nextjs-subscription-payments as base
git clone https://github.com/vercel/nextjs-subscription-payments.git FUNDPROJ_APP
cd FUNDPROJ_APP

# Remove template origin, set your own
git remote remove origin
git remote add origin https://github.com/chedoncj-cyber/FUNDPROJ-App.git
git branch -M main
```

---

## 3. STEP 2 — SUPABASE SETUP

```bash
# Login to Supabase
supabase login

# Create new Supabase project (or link existing)
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# Apply schema
supabase db push --file docs/FUNDPROJ_DB_SCHEMA.sql

# Or via migrations:
supabase migration new initial_schema
# paste FUNDPROJ_DB_SCHEMA.sql content into migration file
supabase db push
```

**Get your keys from:** Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Enable Supabase Realtime** for tables: `payment_ledger`, `project_funding_summary`

---

## 4. STEP 3 — STRIPE SETUP

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Create products and prices in Stripe Dashboard
# (Or via API — one price per contribution frequency)
# - Monthly contribution price: £X/month recurring
# - Weekly contribution price: £X/week recurring

# Get webhook secret
stripe listen --forward-to localhost:3000/api/payments/stripe/webhook
# Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET
```

---

## 5. STEP 4 — ENVIRONMENT VARIABLES

Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Changoapp SFTP
CHANGOAPP_SFTP_HOST=sftp.changoapp.com
CHANGOAPP_SFTP_PORT=22
CHANGOAPP_SFTP_USER=fundproj_user
CHANGOAPP_SFTP_PASSWORD=
CHANGOAPP_SFTP_PATH=/exports/fundproj/

# Cron security
CRON_SECRET=generate-a-long-random-string

# App
NEXT_PUBLIC_SITE_URL=https://fundproj.vercel.app
```

---

## 6. STEP 5 — LOCAL DEV

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 7. STEP 6 — DEPLOY TO VERCEL

```bash
vercel login
vercel

# Or link to existing project:
vercel link

# Add all env vars to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
# (repeat for each variable)

# Deploy to production
vercel --prod
```

**Vercel project settings:**
- Framework: Next.js
- Build command: `npm run build`
- Output directory: `.next`
- Node.js version: 20.x

**Add env vars via Vercel Dashboard:**  
Settings → Environment Variables → Add all from `.env.local`

---

## 8. STEP 7 — CRON JOB (SFTP Sync)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sftp-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Verify cron is registered:**
Vercel Dashboard → Project → Cron Jobs → Should show daily 02:00 UTC

**Test manually:**
```bash
curl -X POST https://fundproj.vercel.app/api/sftp-sync \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Alternative (GitHub Actions fallback):**
```yaml
# .github/workflows/sftp-sync.yml
name: Daily SFTP Sync
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger SFTP Sync
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/sftp-sync \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

---

## 9. STEP 8 — STRIPE WEBHOOKS (Production)

In Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://fundproj.vercel.app/api/payments/stripe/webhook`
- Events: `invoice.payment_succeeded`, `invoice.payment_failed`, `customer.subscription.deleted`

---

## 10. STEP 9 — GOCARD LESS & FLUTTERWAVE WEBHOOKS

**GoCardless:**
- Dashboard → Developers → Webhooks → `https://fundproj.vercel.app/api/payments/gocardless/webhook`

**Flutterwave:**
- Dashboard → Settings → Webhooks → `https://fundproj.vercel.app/api/payments/flutterwave/webhook`
- Set `FLW_WEBHOOK_HASH` → same value in env vars

---

## 11. POST-DEPLOYMENT CHECKS

```
[ ] Supabase tables created (check Dashboard → Table Editor)
[ ] Auth: signup + login works
[ ] Stripe: test subscription created with test card 4242 4242 4242 4242
[ ] SFTP: manual sync via /api/sftp-sync returns success
[ ] Cron: Vercel shows cron registered
[ ] Member list: shows alphabetical, correct FP-00001 ID format
[ ] Revenue recognition: schedule generates on payment insert
[ ] Webhook: Stripe test event received and processed
[ ] Email: post-sync notification email arrives at chedoncj@gmail.com
```

---

## 12. GITHUB REPO

```
Repository: https://github.com/chedoncj-cyber/FUNDPROJ-App
Main branch: main
```

Deploy workflow: push to `main` → Vercel auto-deploys (autodeploy ON)
