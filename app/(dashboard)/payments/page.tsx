import { createClient } from '@/lib/supabase/server';
import { PaymentHistory } from '@/components/projects/PaymentHistory';

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { page?: string; platform?: string; project_id?: string };
}) {
  const sb = await createClient();
  const page  = parseInt(searchParams.page ?? '1');
  const limit = 50;
  const from  = (page - 1) * limit;

  let query = sb
    .from('payment_ledger')
    .select(`
      *,
      individuals(fundproj_id, first_name, last_name)
    `, { count: 'exact' })
    .order('payment_date', { ascending: false })
    .range(from, from + limit - 1);

  if (searchParams.platform) query = query.eq('platform', searchParams.platform);
  if (searchParams.project_id) query = query.eq('project_id', searchParams.project_id);

  const { data: payments, count } = await query;

  const enriched = (payments ?? []).map(p => ({
    ...p,
    member_name: p.individuals
      ? `${p.individuals.last_name}, ${p.individuals.first_name}`
      : undefined,
  }));

  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 text-sm mt-1">{count ?? 0} total transactions</p>
        </div>
        <a href="/api/payments/export" className="btn-secondary text-sm">Export CSV</a>
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <form className="flex gap-3 flex-wrap">
          <select name="platform" defaultValue={searchParams.platform ?? ''} className="input w-40">
            <option value="">All platforms</option>
            <option value="changoapp">Changoapp</option>
            <option value="stripe">Stripe</option>
            <option value="gocardless">GoCardless</option>
            <option value="flutterwave">Flutterwave</option>
            <option value="paypal">PayPal</option>
            <option value="manual">Manual</option>
          </select>
          <button className="btn-secondary text-sm">Filter</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <PaymentHistory payments={enriched} />
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-between text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && <a href={`?page=${page - 1}`} className="btn-secondary text-xs py-1.5 px-3">Previous</a>}
              {page < totalPages && <a href={`?page=${page + 1}`} className="btn-secondary text-xs py-1.5 px-3">Next</a>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
