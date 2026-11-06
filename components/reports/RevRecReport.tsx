'use client';
import { useState } from 'react';
import type { RevRecScheduleEntry } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface Props {
  entries: (RevRecScheduleEntry & {
    member_name?: string;
    pob_type?: string;
  })[];
  projectId: string;
  currency?: string;
}

export function RevRecReport({ entries, projectId, currency = 'GBP' }: Props) {
  const [releasing, setReleasing] = useState<string | null>(null);

  const scheduled  = entries.filter(e => e.status === 'scheduled');
  const released   = entries.filter(e => e.status === 'released');
  const totalDeferred    = scheduled.reduce((s, e) => s + e.amount_to_recognise, 0);
  const totalRecognised  = released.reduce((s, e) => s + e.amount_recognised, 0);

  async function releasePeriod(entryId: string) {
    setReleasing(entryId);
    const res = await fetch('/api/revrec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schedule_entry_id: entryId, released_by: 'admin' }),
    });
    if (res.ok) window.location.reload();
    else setReleasing(null);
  }

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 border-amber-200">
          <div className="text-sm text-slate-500 mb-1">Deferred Balance</div>
          <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalDeferred, currency)}</div>
        </div>
        <div className="card p-5 border-green-200">
          <div className="text-sm text-slate-500 mb-1">Recognised Revenue</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecognised, currency)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-slate-500 mb-1">Schedule Entries</div>
          <div className="text-2xl font-bold text-slate-900">{entries.length}</div>
          <div className="text-xs text-slate-400 mt-1">{scheduled.length} pending · {released.length} released</div>
        </div>
      </div>

      {/* Scheduled entries — ready to release */}
      {scheduled.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-amber-50">
            <h3 className="font-semibold text-amber-800">Pending Release ({scheduled.length})</h3>
            <p className="text-xs text-amber-600 mt-0.5">Dr Deferred Revenue / Cr Revenue</p>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Period</th>
                <th className="table-th">Member</th>
                <th className="table-th hidden sm:table-cell">POB Type</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {scheduled.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="table-td text-sm text-slate-600 whitespace-nowrap">
                    {new Date(e.period_start).toLocaleDateString('en-GB')} →{' '}
                    {new Date(e.period_end).toLocaleDateString('en-GB')}
                  </td>
                  <td className="table-td font-medium">{e.member_name ?? e.individual_id}</td>
                  <td className="table-td hidden sm:table-cell text-xs text-slate-400 uppercase">{e.pob_type ?? '—'}</td>
                  <td className="table-td text-right font-mono font-semibold">
                    {formatCurrency(e.amount_to_recognise, currency)}
                  </td>
                  <td className="table-td text-right">
                    <button
                      onClick={() => releasePeriod(e.id)}
                      disabled={releasing === e.id}
                      className="text-xs px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {releasing === e.id ? 'Releasing…' : 'Release'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Released history */}
      {released.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Released History ({released.length})</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-th">Period</th>
                <th className="table-th">Member</th>
                <th className="table-th text-right">Amount</th>
                <th className="table-th hidden sm:table-cell">Released</th>
              </tr>
            </thead>
            <tbody>
              {released.map((e) => (
                <tr key={e.id} className="text-slate-500">
                  <td className="table-td text-sm whitespace-nowrap">
                    {new Date(e.period_start).toLocaleDateString('en-GB')}
                  </td>
                  <td className="table-td">{e.member_name ?? e.individual_id}</td>
                  <td className="table-td text-right font-mono">
                    {formatCurrency(e.amount_recognised, currency)}
                  </td>
                  <td className="table-td hidden sm:table-cell text-xs text-slate-400">
                    {e.released_at ? new Date(e.released_at).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
