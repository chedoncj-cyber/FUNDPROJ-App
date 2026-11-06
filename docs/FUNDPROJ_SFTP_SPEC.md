# FUNDPROJ APP — SFTP Daily Sync Job Specification

**Version:** 1.0.0  
**Date:** 2026-11-05

---

## 1. PURPOSE

The SFTP sync job pulls payment data from Changoapp.com (and equivalent platforms) once per day, ingests it into the FUNDPROJ payment ledger, and updates project funding summaries. It is the primary data ingestion path for platforms that do not support real-time webhooks.

---

## 2. SCHEDULE

| Setting | Value |
|---|---|
| Trigger time | 02:00 UTC daily |
| Trigger mechanism | Vercel Cron Function (`vercel.json`) |
| Fallback trigger | Manual: `POST /api/sftp-sync` (admin only, `CRON_SECRET` header) |
| Timeout | 60 seconds max (Vercel Hobby limit) |
| Alternative runner | GitHub Actions cron (if Vercel limit hit) |

**vercel.json:**
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

---

## 3. SFTP FILE FORMAT (Changoapp.com)

**Expected file name pattern:** `fundproj_payments_YYYYMMDD.csv`  
**Remote path:** `/exports/fundproj/`

**CSV structure:**
```csv
member_ref,project_code,amount,currency,payment_date,platform_ref,status,notes
FP-00001,PROJ-WEDDING-001,50.00,USD,2026-11-04,CHNG-TXN-9981234,completed,
FP-00002,PROJ-SCHOOL-002,25.00,USD,2026-11-04,CHNG-TXN-9981235,completed,
FP-00003,PROJ-WEDDING-001,0.00,USD,2026-11-04,CHNG-TXN-9981236,failed,Insufficient funds
```

**Field definitions:**
| Field | Type | Notes |
|---|---|---|
| `member_ref` | String | FUNDPROJ ID (FP-XXXXX) |
| `project_code` | String | Project code (PROJ-XXX-NNN) |
| `amount` | Decimal | In major currency units |
| `currency` | String | ISO 4217 |
| `payment_date` | Date | YYYY-MM-DD |
| `platform_ref` | String | Changoapp transaction ID — UNIQUE key |
| `status` | String | completed / pending / failed |
| `notes` | String | Optional |

---

## 4. SYNC JOB LOGIC

```
START sync job
│
├── 1. Create sftp_sync_log record (status=running)
│
├── 2. Connect to Changoapp SFTP
│      - Host: CHANGOAPP_SFTP_HOST
│      - Port: CHANGOAPP_SFTP_PORT (default 22)
│      - Auth: username + password (or key)
│      ↓
│      IF connection fails → log error → try REST API fallback (Step 2b)
│
├── 3. Download today's CSV file
│      - Look for: fundproj_payments_{TODAY}.csv
│      ↓
│      IF file not found → log warning → try REST API fallback
│      IF file found → parse CSV rows
│
├── 4. For each row:
│      a. Look up individual by fundproj_id → IF not found → insert into unmatched_payments
│      b. Look up project by project_code  → IF not found → insert into unmatched_payments
│      c. UPSERT into payment_ledger (conflict on platform_ref = skip duplicate)
│      d. If status = 'completed' → update project_funding_summary
│      e. Increment counters: inserted / skipped / unmatched
│
├── 5. Update project_funding_summary totals for affected projects
│
├── 6. Trigger revenue recognition schedule generation for new payments
│
├── 7. Update sftp_sync_log (status=success|partial|failed, counts, ended_at)
│
└── 8. Send summary notification email (admin)
        - Records downloaded
        - Records inserted
        - Records skipped (duplicates)
        - Unmatched records (action needed)
```

---

## 5. REST API FALLBACK

If SFTP is unavailable, fall back to Changoapp REST API:

```
GET https://api.changoapp.com/v1/transactions
  ?from=2026-11-04T00:00:00Z
  &to=2026-11-04T23:59:59Z
  &project_ref=ALL
Authorization: Bearer {CHANGOAPP_API_KEY}
```

Expected response shape:
```json
{
  "transactions": [
    {
      "member_ref": "FP-00001",
      "project_code": "PROJ-WEDDING-001",
      "amount": 50.00,
      "currency": "USD",
      "payment_date": "2026-11-04",
      "transaction_id": "CHNG-TXN-9981234",
      "status": "completed"
    }
  ],
  "total": 2,
  "page": 1
}
```

---

## 6. ALTERNATIVE SYNC APPROACHES

| Approach | Pros | Cons |
|---|---|---|
| **SFTP daily CSV (recommended)** | Simple, standard, offline-safe | 24hr delay |
| **Changoapp Webhook (real-time)** | Instant updates | Requires Changoapp webhook support |
| **REST API polling (hourly)** | Near real-time | Rate limits, complexity |
| **Manual CSV upload** | No integration needed | Manual work, error-prone |
| **Email parsing** | Works if platform emails receipts | Fragile, regex-dependent |

---

## 7. TYPESCRIPT IMPLEMENTATION

```typescript
// jobs/sftp-sync.ts
import Client from 'ssh2-sftp-client';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

export async function runSFTPSync(platform = 'changoapp') {
  const sftp = new Client();
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create sync log entry
  const { data: logEntry } = await supabase
    .from('sftp_sync_log')
    .insert({ platform, triggered_by: 'cron' })
    .select().single();

  const stats = { downloaded: 0, inserted: 0, skipped: 0, unmatched: 0 };

  try {
    await sftp.connect({
      host: process.env.CHANGOAPP_SFTP_HOST,
      port: parseInt(process.env.CHANGOAPP_SFTP_PORT || '22'),
      username: process.env.CHANGOAPP_SFTP_USER,
      password: process.env.CHANGOAPP_SFTP_PASSWORD,
    });

    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `fundproj_payments_${today}.csv`;
    const remotePath = `${process.env.CHANGOAPP_SFTP_PATH}${fileName}`;

    const csvBuffer = await sftp.get(remotePath);
    const rows = parse(csvBuffer.toString(), {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    stats.downloaded = rows.length;

    for (const row of rows) {
      // Resolve individual
      const { data: individual } = await supabase
        .from('individuals')
        .select('id')
        .eq('fundproj_id', row.member_ref)
        .single();

      // Resolve project
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('project_code', row.project_code)
        .single();

      if (!individual || !project) {
        await supabase.from('unmatched_payments').insert({
          platform,
          platform_ref: row.platform_ref,
          member_ref_raw: row.member_ref,
          amount: parseFloat(row.amount),
          currency: row.currency,
          payment_date: row.payment_date,
          raw_payload: row
        });
        stats.unmatched++;
        continue;
      }

      const { error } = await supabase.from('payment_ledger').upsert({
        individual_id: individual.id,
        project_id: project.id,
        amount: parseFloat(row.amount),
        currency: row.currency,
        payment_date: row.payment_date,
        platform,
        platform_ref: row.platform_ref,
        status: row.status,
        sync_batch_id: logEntry.id,
        raw_payload: row
      }, { onConflict: 'platform_ref', ignoreDuplicates: true });

      if (error?.code === '23505') {
        stats.skipped++;   // duplicate
      } else if (!error) {
        stats.inserted++;
      }
    }

    await sftp.end();

    // Update sync log
    await supabase.from('sftp_sync_log').update({
      status: stats.unmatched > 0 ? 'partial' : 'success',
      records_downloaded: stats.downloaded,
      records_inserted: stats.inserted,
      records_skipped: stats.skipped,
      records_unmatched: stats.unmatched,
      file_name: fileName,
      sync_ended_at: new Date().toISOString()
    }).eq('id', logEntry.id);

  } catch (err: any) {
    await supabase.from('sftp_sync_log').update({
      status: 'failed',
      error_message: err.message,
      sync_ended_at: new Date().toISOString()
    }).eq('id', logEntry.id);
    throw err;
  }

  return stats;
}
```

---

## 8. ERROR SCENARIOS & HANDLING

| Scenario | Handling |
|---|---|
| SFTP connection refused | Log error, try REST API fallback, alert admin |
| File not found (no payments today) | Log as 'success' with 0 records (normal) |
| CSV parse error | Log error, skip malformed row, continue |
| Unknown `member_ref` | Insert to `unmatched_payments`, alert admin |
| Duplicate `platform_ref` | Silently skip (idempotent) |
| Supabase connection error | Retry 3×, then fail and alert |
| Job timeout (>60s) | Vercel terminates; partial run logged; next cron picks up missing date |

---

## 9. MONITORING

- **Dashboard:** `/admin/sync-log` — shows last 30 sync runs with status, counts, errors
- **Alert email:** Sent to `chedoncj@gmail.com` after each run with summary
- **Unmatched payments:** `/admin/unmatched` — admin resolves by mapping `member_ref_raw` → `fundproj_id`
