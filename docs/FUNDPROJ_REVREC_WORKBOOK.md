# FUNDPROJ APP — Revenue Recognition Configuration Workbook
## ASC 606 / IFRS 15 — 5-Step Model Implementation

**Version:** 1.0.0  
**Date:** 2026-11-05  
**Standard:** ASC 606 (US GAAP) / IFRS 15 (aligned)

---

## THE 5-STEP MODEL — APPLIED TO FUNDPROJ

Both ASC 606 and IFRS 15 share the same framework. Below maps each step to FUNDPROJ's context.

---

### STEP 1 — IDENTIFY THE CONTRACT WITH THE CUSTOMER

| Element | FUNDPROJ Definition |
|---|---|
| Contract | A member's enrollment in a project + funding commitment |
| Parties | FUNDPROJ (facilitator/custodian) ↔ Individual member |
| Consideration | Agreed contribution amount (total pledge or recurring amount × period) |
| Commercial substance | Yes — funds are held and released to project owner on milestones |
| Contract exists when | Member is enrolled AND first payment received |

**Configuration in FUNDPROJ:**
- Contract created: `project_members.enrolled_at` + first entry in `payment_ledger`
- Contract modified: member changes contribution frequency or amount → triggers re-allocation

---

### STEP 2 — IDENTIFY THE PERFORMANCE OBLIGATIONS (POBs)

A Performance Obligation is a promise to transfer a distinct good or service.

| Project Type | POB 1 | POB 2 | POB 3 |
|---|---|---|---|
| Wedding Fund | Funds accumulation service | Fund release on wedding date | Admin/reporting service |
| School Project | Funds collection | Materials procurement | Final disbursement |
| Holiday Fund | Savings custody | Booking payment | Surplus return |
| Savings Goal | Custody service | Milestone release | Interest allocation |
| Custom | Defined per project setup | — | — |

**IFRS 15 Para 27 test (distinct POB):**
- Can the member benefit from it on its own? → Yes if each stage has standalone value
- Is it separately identifiable? → Yes if each POB has its own milestones / deliverables

**Standard FUNDPROJ POB types:**
```
pob_type values:
  'custody'       — holding funds until release date
  'milestone'     — release on specific event (wedding date, project submission)
  'recurring'     — monthly recognition as service delivered
  'immediate'     — recognise on receipt (small donations / no deferral)
```

---

### STEP 3 — DETERMINE THE TRANSACTION PRICE

| Scenario | Treatment |
|---|---|
| Fixed monthly contribution | Transaction price = amount × number of periods |
| Variable (top-ups allowed) | Estimate at contract inception; constrain variable component |
| One-off lump sum | Full amount = transaction price |
| Multi-currency | Convert to functional currency at payment date FX rate |

**Variable consideration constraint:**
- Include variable amounts only to extent it is "highly probable" no significant revenue reversal will occur (IFRS 15.56 / ASC 606-10-32-11)
- For FUNDPROJ: use committed standing-order amount as base; treat top-ups as modifications

---

### STEP 4 — ALLOCATE TRANSACTION PRICE TO POBs

Allocate based on **Standalone Selling Price (SSP)** of each POB.

**Example — Wedding Fund £12,000 total:**

| POB | Description | SSP % | Allocated Amount |
|---|---|---|---|
| POB 1 — Custody | 12 months holding | 10% | £1,200 |
| POB 2 — Milestone release | Fund disbursement on wedding date | 85% | £10,200 |
| POB 3 — Admin | Reporting & management | 5% | £600 |

**Configuration table: `revrec_pob_allocation`** *(to be built)*
```sql
-- Per project type, define SSP %
project_type | pob_type   | ssp_percentage
wedding      | custody    | 10.00
wedding      | milestone  | 85.00
wedding      | admin      | 5.00
school       | custody    | 15.00
school       | milestone  | 75.00
school       | admin      | 10.00
```

---

### STEP 5 — RECOGNISE REVENUE WHEN (OR AS) EACH POB IS SATISFIED

| POB Type | Recognition Trigger | Method |
|---|---|---|
| Custody / recurring | As each month of service is delivered | Straight-line |
| Milestone | When specific event occurs (wedding date, submission date) | Point-in-time |
| Immediate | On payment receipt | Immediate |
| Percentage-based | As % of project completion | Percentage |

---

## SUBSCRIPTION BILLING INTEGRATION

**Annual contribution billed upfront — Example:**

```
Member commits: £600/year for Wedding Fund (12 months)
Platform: Stripe Subscription
Frequency: Monthly £50 × 12

INVOICE DATE (Day 1):
  Dr  Accounts Receivable (member pledge)   £600
  Cr  Deferred Revenue — Custody POB1       £60    (10%)
  Cr  Deferred Revenue — Milestone POB2     £510   (85%)
  Cr  Deferred Revenue — Admin POB3         £30    (5%)

EACH MONTH (Custody POB — straight-line recognition):
  Dr  Deferred Revenue — Custody POB1       £5     (£60 ÷ 12)
  Cr  Revenue — Custody Service             £5

ON WEDDING DATE (Milestone POB — point in time):
  Dr  Deferred Revenue — Milestone POB2     £510
  Cr  Revenue — Milestone Release           £510

EACH MONTH (Admin POB — straight-line):
  Dr  Deferred Revenue — Admin POB3         £2.50  (£30 ÷ 12)
  Cr  Revenue — Admin Service               £2.50

END OF YEAR — Balance Sheet:
  Deferred Revenue = £0   |   Revenue Recognised = £600

AUDIT CONTROL:
  revrec_schedule table ↔ deferred_revenue.remaining_amount = £0
```

---

## MONTHLY RECOGNITION RELEASE PROCESS

1. Finance Admin → Reports → Revenue Recognition
2. System shows: `revrec_schedule` entries with `status = 'scheduled'` and `period_end <= today`
3. Admin reviews amounts → clicks "Release Period"
4. System updates:
   - `revrec_schedule.status` → `'released'`
   - `revrec_schedule.released_at` → NOW()
   - `deferred_revenue.recognised_amount` += released amount
   - `audit_log` entry created
5. Export: Revenue Recognition Schedule Report (CSV / PDF)
6. Reconcile: `SUM(deferred_revenue.remaining_amount)` = Deferred Revenue on Balance Sheet

---

## KEY REPORTS

| Report | Purpose | Frequency |
|---|---|---|
| Revenue Recognition Schedule | Shows all scheduled releases | Monthly |
| Deferred Revenue Balance | Total unrecognised amounts by project | Monthly |
| Revenue Not Yet Recognised | Management control — unexpired obligations | Monthly |
| Subscription Revenue Waterfall | Periods × amounts recognised over time | Quarterly |
| Audit Trail Export | Full immutable log of all recognition events | On request |

---

## D365 PARALLEL (for enterprise clients using D365 Finance)

| FUNDPROJ Component | D365 Equivalent |
|---|---|
| `revrec_schedule` table | Revenue Recognition Schedule |
| `deferred_revenue` table | Deferred Revenue posting profile |
| POB allocation % | SSP price list |
| Release process | Revenue Recognition schedule run |
| Audit trail | Revenue Recognition journal entries |
| 'Revenue not yet recognised' report | D365 Revenue Recognition → Reports |

**D365 Navigation:**  
Revenue Recognition → Setup → Revenue schedules  
Revenue Recognition → Setup → Standalone selling price

---

## CONTRACT MODIFICATION RULES

When a member changes their contribution:

| Modification Type | Treatment |
|---|---|
| Increase contribution | Prospective adjustment — add new deferred amount |
| Decrease contribution | Cumulative catch-up or prospective (choose policy) |
| Add new POB (new project) | Treat as new contract or modification — re-allocate SSP |
| Cancel before project end | Release remaining deferred per cancellation terms |
