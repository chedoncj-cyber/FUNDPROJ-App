# FUNDPROJ APP — Payment Platform API Integration Spec

**Version:** 1.0.0  
**Date:** 2026-11-05

---

## 1. INTEGRATION OVERVIEW

FUNDPROJ connects to payment platforms via two patterns:
- **Push (Webhook):** Platform calls FUNDPROJ API in real-time when a payment event occurs
- **Pull (SFTP/REST):** FUNDPROJ polls the platform daily at 02:00 UTC

| Platform | Method | Priority | Region |
|---|---|---|---|
| Changoapp.com | SFTP + REST API | 1 — Primary | Caribbean / Global |
| Stripe | Webhook (real-time) + REST | 2 | Global |
| GoCardless | Webhook + REST | 3 | UK / EU |
| PayPal | Webhook + REST | 4 | Global |
| Flutterwave | Webhook + REST | 5 | Africa |
| Square | Webhook + REST | 6 | US / CA / AU |

---

## 2. CHANGOAPP.COM INTEGRATION

### 2.1 SFTP Pull (Primary Method)
Changoapp exports daily payment CSVs to an SFTP server.

**File format:**
```csv
member_ref,project_code,amount,currency,payment_date,platform_ref,status
FP-00001,PROJ-WEDDING-001,50.00,USD,2026-11-04,CHNG-TXN-9981234,completed
FP-00002,PROJ-SCHOOL-002,25.00,USD,2026-11-04,CHNG-TXN-9981235,completed
```

**SFTP connection config:**
```typescript
const sftpConfig = {
  host: process.env.CHANGOAPP_SFTP_HOST,
  port: parseInt(process.env.CHANGOAPP_SFTP_PORT || '22'),
  username: process.env.CHANGOAPP_SFTP_USER,
  password: process.env.CHANGOAPP_SFTP_PASSWORD,
  remotePath: process.env.CHANGOAPP_SFTP_PATH
};
```

**Sync logic (idempotent):**
```typescript
// jobs/sftp-sync.ts
async function syncChangoapp() {
  const rows = await downloadAndParseSFTP();
  for (const row of rows) {
    await supabase
      .from('payment_ledger')
      .upsert({
        individual_id: row.member_ref,
        project_id: row.project_code,
        amount: row.amount,
        currency: row.currency,
        payment_date: row.payment_date,
        platform_ref: row.platform_ref,   // UNIQUE — prevents duplicate insert
        platform: 'changoapp',
        status: row.status
      }, { onConflict: 'platform_ref' });
  }
}
```

### 2.2 REST API (Fallback / Supplemental)
If SFTP file is absent, fall back to Changoapp REST API:
```
GET https://api.changoapp.com/v1/transactions
  ?from=2026-11-04
  &to=2026-11-04
  &project_ref={project_code}
Authorization: Bearer {CHANGOAPP_API_KEY}
```

**Alternative approach:** Request Changoapp to send real-time webhooks to:
`POST https://fundproj.app/api/payments/changoapp/webhook`

---

## 3. STRIPE INTEGRATION

Based on `vercel/nextjs-subscription-payments` template.

### 3.1 Subscription Billing
```typescript
// Create a subscription for recurring contribution
const subscription = await stripe.subscriptions.create({
  customer: stripeCustomerId,
  items: [{ price: priceId }],
  metadata: {
    fundproj_individual_id: 'FP-00001',
    fundproj_project_id: 'PROJ-WEDDING-001'
  },
  payment_behavior: 'default_incomplete',
  expand: ['latest_invoice.payment_intent']
});
```

### 3.2 Webhook Handler
`POST /api/payments/stripe/webhook`
```typescript
// Events to handle:
switch (event.type) {
  case 'invoice.payment_succeeded':
    // Record payment in payment_ledger
    // Trigger revenue recognition schedule update
    break;
  case 'invoice.payment_failed':
    // Flag member as overdue
    // Send alert email
    break;
  case 'customer.subscription.deleted':
    // Mark subscription inactive
    break;
}
```

---

## 4. GOCARDLESS INTEGRATION (UK/EU Direct Debit)

Best alternative for UK-based projects. Lower fees than Stripe for recurring DD.

```typescript
const gocardless = new GoCardlessClient(
  process.env.GOCARDLESS_ACCESS_TOKEN,
  Environments.Live
);

// Create mandate (one-time setup)
const mandate = await gocardless.mandates.create({
  scheme: 'bacs',
  links: { customer_bank_account: bankAccountId }
});

// Create subscription
const subscription = await gocardless.subscriptions.create({
  amount: 5000,         // pence
  currency: 'GBP',
  interval_unit: 'monthly',
  name: 'FUNDPROJ - Wedding Fund',
  links: { mandate: mandate.id }
});
```

**Webhook:** `POST /api/payments/gocardless/webhook`

---

## 5. FLUTTERWAVE INTEGRATION (Africa)

For African contributors — supports M-Pesa, MTN Mobile Money, local bank transfers.

```typescript
// Initiate payment link
const response = await flw.Payment.initialize({
  tx_ref: `FP-${Date.now()}`,
  amount: 100,
  currency: 'GHS',
  redirect_url: 'https://fundproj.app/payment/confirm',
  customer: {
    email: member.email,
    name: `${member.first_name} ${member.last_name}`
  },
  meta: {
    fundproj_individual_id: 'FP-00001',
    fundproj_project_id: 'PROJ-SCHOOL-001'
  }
});
```

**Webhook:** `POST /api/payments/flutterwave/webhook`  
**Verification header:** `verif-hash: {FLW_WEBHOOK_HASH}`

---

## 6. INTERNAL FUNDPROJ API ROUTES

### Members
```
GET    /api/members                  → list all (alphabetical, paginated)
POST   /api/members                  → create individual
GET    /api/members/:id              → get by FUNDPROJ ID
PUT    /api/members/:id              → update
POST   /api/members/upload           → bulk CSV upload
```

### Projects
```
GET    /api/projects                 → list projects
POST   /api/projects                 → create project
GET    /api/projects/:id             → project detail + funding summary
GET    /api/projects/:id/members     → members allocated to project
GET    /api/projects/:id/payments    → payment history
```

### Payments
```
GET    /api/payments                 → ledger (filterable by member, project, date)
POST   /api/payments/manual          → manual payment entry
GET    /api/payments/export          → CSV/Excel export
```

### Sync
```
POST   /api/sftp-sync                → trigger manual SFTP sync (admin only)
GET    /api/sftp-sync/log            → sync history & status
```

### Revenue Recognition
```
GET    /api/revrec/schedule/:project_id   → recognition schedule
POST   /api/revrec/release/:project_id   → release period (admin/finance)
GET    /api/revrec/report                 → deferred vs recognised report
```

---

## 7. PAYMENT DATA NORMALISATION

All platforms return different shapes. Normalise to a common `PaymentRecord`:

```typescript
interface PaymentRecord {
  individual_id: string;      // FUNDPROJ ID (FP-XXXXX)
  project_id: string;         // Project code
  amount: number;             // In minor units (pence/cents)
  currency: string;           // ISO 4217
  payment_date: string;       // ISO 8601 date
  platform: 'changoapp' | 'stripe' | 'gocardless' | 'paypal' | 'flutterwave' | 'square' | 'manual';
  platform_ref: string;       // Platform's own transaction ID (UNIQUE key)
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  metadata?: Record<string, unknown>;
}
```

---

## 8. ERROR HANDLING & RETRIES

| Scenario | Action |
|---|---|
| SFTP file missing | Fall back to REST API; log warning |
| REST API rate limit | Exponential backoff (3 retries) |
| Duplicate `platform_ref` | Silently skip (idempotent upsert) |
| Unknown `member_ref` | Add to `unmatched_payments` table; alert admin |
| Webhook signature invalid | Return 400; log attempt |
| Payment failed on platform | Update member status; send email |
