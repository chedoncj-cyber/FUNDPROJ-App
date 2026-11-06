'use client';
import { formatCurrency } from '@/lib/utils';

interface Props {
  raised: number;
  target: number;
  currency: string;
}

export function FundingProgress({ raised, target, currency }: Props) {
  const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
  const barColor =
    pct >= 100 ? 'bg-green-500' :
    pct >= 50  ? 'bg-blue-500'  :
    pct >= 25  ? 'bg-amber-500' : 'bg-slate-300';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-slate-800">{formatCurrency(raised, currency)}</span>
        <span className="text-slate-400">
          {pct}% of {formatCurrency(target, currency)}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-slate-400">
        {formatCurrency(target - raised, currency)} remaining
      </div>
    </div>
  );
}
