import { createClient } from '@/lib/supabase/server';

const statusColors: Record<string, string> = {
  success: 'bg-green-50 text-green-700 border-green-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  failed:  'bg-red-50 text-red-700 border-red-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default async function SyncLogPage() {
  const sb = await createClient();
  const { data: logs } = await sb
    .from('sftp_sync_log')
    .select('*')
    .order('sync_started_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SFTP Sync Log</h1>
          <p className="text-slate-500 text-sm mt-1">Daily Changoapp payment sync history</p>
        </div>
        <form action="/api/sftp-sync" method="POST">
          <button type="submit" className="btn-primary">Run Sync Now</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Started</th>
              <th className="table-th">Platform</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Downloaded</th>
              <th className="table-th text-right">Inserted</th>
              <th className="table-th text-right">Skipped</th>
              <th className="table-th text-right">Unmatched</th>
              <th className="table-th hidden md:table-cell">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="table-td text-sm text-slate-600 whitespace-nowrap">
                  {new Date(log.sync_started_at).toLocaleString('en-GB')}
                </td>
                <td className="table-td text-sm font-medium capitalize">{log.platform}</td>
                <td className="table-td">
                  <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusColors[log.status]}`}>
                    {log.status}
                  </span>
                </td>
                <td className="table-td text-right font-mono text-sm">{log.records_downloaded}</td>
                <td className="table-td text-right font-mono text-sm text-green-600">{log.records_inserted}</td>
                <td className="table-td text-right font-mono text-sm text-slate-400">{log.records_skipped}</td>
                <td className="table-td text-right font-mono text-sm text-amber-600">{log.records_unmatched}</td>
                <td className="table-td hidden md:table-cell text-xs text-slate-400 capitalize">{log.triggered_by}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={8} className="table-td text-center text-slate-400 py-10">
                  No sync runs yet. The job runs automatically at 02:00 UTC.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
