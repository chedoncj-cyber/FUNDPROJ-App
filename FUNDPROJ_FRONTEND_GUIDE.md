# FUNDPROJ APP — Frontend Component Library & UI Guide

**Version:** 1.0.0  
**Date:** 2026-11-05  
**Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui  
**Base template:** `vercel/nextjs-subscription-payments`

---

## 1. DESIGN PRINCIPLES

- **Clean & trustworthy** — financial app; white/grey palette, clear typography
- **Data-first** — tables, progress bars, numbers are the star
- **Mobile-first** — contributors check balances on phones
- **Alphabetical always** — member lists never sort by ID or date, always A→Z

---

## 2. COLOUR PALETTE

```css
/* Primary */
--color-primary:    #0F172A;   /* Slate-900 — headings, nav */
--color-accent:     #2563EB;   /* Blue-600 — buttons, links */
--color-success:    #16A34A;   /* Green-600 — funded, completed */
--color-warning:    #D97706;   /* Amber-600 — overdue, partial */
--color-danger:     #DC2626;   /* Red-600 — failed payments */

/* Backgrounds */
--color-bg:         #F8FAFC;   /* Slate-50 — page background */
--color-surface:    #FFFFFF;   /* Cards, panels */
--color-border:     #E2E8F0;   /* Slate-200 — dividers */
```

---

## 3. KEY COMPONENTS

### 3.1 MemberList — Alphabetical Display

```tsx
// components/members/MemberList.tsx
// Always sorted by last_name, then first_name
// ID column shows FP-00001 format

interface Member {
  id: string;
  fundproj_id: string;        // FP-00001
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
}

export function MemberList({ members }: { members: Member[] }) {
  // Members arrive pre-sorted from API (last_name ASC, first_name ASC)
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500 uppercase text-xs">
          <th className="text-left py-3 px-4">ID</th>
          <th className="text-left py-3 px-4">Name</th>
          <th className="text-left py-3 px-4">Email</th>
          <th className="text-left py-3 px-4">Role</th>
          <th className="text-left py-3 px-4">Status</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-3 px-4 font-mono text-blue-600">{m.fundproj_id}</td>
            <td className="py-3 px-4 font-medium">
              {m.last_name}, {m.first_name}
            </td>
            <td className="py-3 px-4 text-slate-500">{m.email}</td>
            <td className="py-3 px-4">
              <RoleBadge role={m.role} />
            </td>
            <td className="py-3 px-4">
              <StatusBadge status={m.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3.2 FundingProgress — Project Bar

```tsx
// components/projects/FundingProgress.tsx
export function FundingProgress({
  raised, target, currency
}: { raised: number; target: number; currency: string }) {
  const pct = Math.min(100, Math.round((raised / target) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-semibold">
          {new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(raised)}
        </span>
        <span className="text-slate-500">{pct}% of {
          new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(target)
        }</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
```

### 3.3 MemberUpload — CSV Bulk Import

```tsx
// components/members/MemberUpload.tsx
// Accepts CSV with: first_name, last_name, email, phone, role
// Displays preview sorted alphabetically before confirming upload

export function MemberUpload({ projectId }: { projectId: string }) {
  const [preview, setPreview] = useState<ParsedMember[]>([]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const rows = parseCSV(text); // local parser
    const sorted = rows.sort((a, b) =>
      a.last_name.localeCompare(b.last_name) ||
      a.first_name.localeCompare(b.first_name)
    );
    setPreview(sorted);
  };

  return (
    <div className="space-y-4">
      <input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files![0])} />
      {preview.length > 0 && (
        <>
          <p className="text-sm text-slate-500">
            {preview.length} members found — displayed alphabetically
          </p>
          <MemberList members={preview as any} />
          <button onClick={() => uploadMembers(preview, projectId)}
            className="btn-primary">
            Confirm Upload ({preview.length} members)
          </button>
        </>
      )}
    </div>
  );
}
```

### 3.4 PaymentHistory Table

```tsx
// components/projects/PaymentHistory.tsx
// Shows per-member payments, sortable by date
// Platform logos: Changoapp, Stripe, GoCardless, Flutterwave icons

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs uppercase text-slate-500 border-b">
          <th className="text-left py-2 px-3">Date</th>
          <th className="text-left py-2 px-3">Member</th>
          <th className="text-right py-2 px-3">Amount</th>
          <th className="text-left py-2 px-3">Platform</th>
          <th className="text-left py-2 px-3">Ref</th>
          <th className="text-left py-2 px-3">Status</th>
        </tr>
      </thead>
      <tbody>
        {payments.map((p) => (
          <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
            <td className="py-2 px-3 text-slate-500">{formatDate(p.payment_date)}</td>
            <td className="py-2 px-3 font-medium">{p.member_name}</td>
            <td className="py-2 px-3 text-right font-mono">
              {formatCurrency(p.amount, p.currency)}
            </td>
            <td className="py-2 px-3"><PlatformBadge platform={p.platform} /></td>
            <td className="py-2 px-3 font-mono text-xs text-slate-400">{p.platform_ref}</td>
            <td className="py-2 px-3"><StatusBadge status={p.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 3.5 RevRecReport — Revenue Recognition Panel

```tsx
// components/reports/RevRecReport.tsx
// Shows deferred vs recognised per project
// Finance Admin can trigger month-end release

export function RevRecReport({ projectId }: { projectId: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <h3 className="font-semibold text-slate-800">Revenue Recognition — {period}</h3>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Raised"      value={totalRaised}    color="blue" />
        <MetricCard label="Recognised"        value={recognised}     color="green" />
        <MetricCard label="Deferred Balance"  value={deferred}       color="amber" />
      </div>

      <table>... schedule entries ...</table>

      <button onClick={releaseMonth} className="btn-primary">
        Release {currentPeriod} Recognition
      </button>
    </div>
  );
}
```

---

## 4. PAGE LAYOUTS

### Dashboard (/)
```
┌─────────────────────────────────────────────────┐
│  FUNDPROJ         [Projects] [Members] [Reports] │
├─────────────────────────────────────────────────┤
│  Welcome back — Today: 05 Nov 2026              │
│                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐│
│  │ 3 Active │ │ £8,420   │ │ Last sync: 02:14 ││
│  │ Projects │ │ Total    │ │ 42 payments      ││
│  └──────────┘ └──────────┘ └──────────────────┘│
│                                                 │
│  My Projects                                    │
│  ┌─────────────────────────────────────────────┐│
│  │ 💍 Wedding Fund     ████████░░ 78% £9,360   ││
│  │ 🎒 School Project   ████░░░░░░ 40% £2,000   ││
│  │ 🌴 Holiday 2027     ██░░░░░░░░ 20% £600     ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Members Page (/members)
```
┌─────────────────────────────────────────────────┐
│  Members                 [+ Add] [Upload CSV]   │
│  Search: [__________]                           │
│                                                 │
│  ID        Name               Email    Status   │
│  FP-00001  Adams, James       j@...    Active   │
│  FP-00002  Boateng, Kwame     k@...    Active   │
│  FP-00003  Clarke, Sarah      s@...    Active   │
│  FP-00004  Davies, Michael    m@...    Paused   │
│  ...                                            │
│                                                 │
│  Showing 1–25 of 142 members  [< 1 2 3 4 5 >]  │
└─────────────────────────────────────────────────┘
```

---

## 5. BADGES & STATUS INDICATORS

```tsx
function StatusBadge({ status }: { status: string }) {
  const styles = {
    active:    'bg-green-50 text-green-700 border-green-200',
    inactive:  'bg-slate-50 text-slate-500 border-slate-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    overdue:   'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const labels = {
    changoapp:   '🔵 Chango',
    stripe:      '🟣 Stripe',
    gocardless:  '🟢 GoCardless',
    flutterwave: '🟠 Flutterwave',
    paypal:      '🔵 PayPal',
    manual:      '⚪ Manual',
  };
  return <span className="text-xs text-slate-600">{labels[platform] || platform}</span>;
}
```

---

## 6. CSV UPLOAD TEMPLATE

Members CSV header (provide as download link):
```csv
first_name,last_name,email,phone,role
James,Adams,james@email.com,+44700000001,contributor
Kwame,Boateng,kwame@email.com,+44700000002,contributor
```

Accepted roles: `contributor`, `owner`, `admin`, `vendor`, `student`
