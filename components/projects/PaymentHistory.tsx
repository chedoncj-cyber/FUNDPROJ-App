'use client';
import type { PaymentRecord, PaymentPlatform } from '@/types';
import { formatCurrency } from '@/lib/utils';

const platformLabels: Record<PaymentPlatform, string> = {
  changoapp:   'Chango',
  stripe:      'Stripe',
  gocardless:  'GoCardless',
  paypal:      'PayPal',
  flutterwave: 'Flutterwave',
  square:      'Square',
  manual:      'Manual',
};

const statusColors: Record<string, string> = {
  completed: 'bg-green-50 text-green-700 border-green-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  failed:    'bg-red-50 text-red-700 border-red-200',
  refunded:  'bg-slate-50 text-slate-500 border-slate-200',
};

interface Payment extends PaymentRecord {
  member_name?: string;
}

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return <div className="py-10 text-center text-slate-400 text-sm">No payments recorded yet.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-th">Date</th>
            <th className="table-th">Member</th>
            <th className="table-th text-right">Amount</th>
            <th className="table-th hidden sm:table-cell">Platform</th>
            <th className="table-th hidden md:table-cell text-xs">Ref</th>
            <th className="table-th">Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
              <td className="table-td text-slate-500 whitespace-nowrap">
                {new Date(p.payment_date).toLocaleDateString('en-GB')}
              </td>
              <td className="table-td font-medium text-slate-800">
                {p.member_name ?? p.individual_id}
              </td>
              <td className="table-td text-right font-mono font-medium">
                {formatCurrency(p.amount, p.currency)}
              </td>
              <td className="table-td hidden sm:table-cell text-slate-500 text-xs">
                {platformLabels[p.platform]}
              </td>
              <td className="table-td hidden md:table-cell font-mono text-xs text-slate-300">
                {p.platform_ref.slice(0, 20)}{p.platform_ref.length > 20 ? '…' : ''}
              </td>
              <td className="table-td">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusColors[p.status] ?? statusColors.pending}`}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
