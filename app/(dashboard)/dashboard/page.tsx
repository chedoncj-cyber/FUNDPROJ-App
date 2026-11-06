import { createClient, safeQuery } from '@/lib/supabase/server';
import { FundingProgress } from '@/components/projects/FundingProgress';
import { SetupBanner } from '@/components/ui/SetupBanner';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const sb = await createClient();

  const [projects, syncLog] = await Promise.all([
    safeQuery(() =>
      sb.from('projects')
        .select('*, project_funding_summary(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10)
    ),
    safeQuery(() =>
      sb.from('sftp_sync_log')
        .select('*')
        .order('sync_started_at', { ascending: false })
        .limit(1)
        .single()
    ),
  ]);

  const isConnected = projects !== null;
  const totalRaised = (projects ?? []).reduce((s: number, p: any) => {
    const summary = Array.isArray(p.project_funding_summary)
      ? p.project_funding_summary[0]
      : p.project_funding_summary;
    return s + (summary?.total_raised ?? 0);
  }, 0);

  const lastSync = (syncLog as any)?.sync_ended_at
    ? new Date((syncLog as any).sync_ended_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <a href="/projects/new" className="btn-primary">+ New Project</a>
      </div>

      {!isConnected && <SetupBanner />}

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-blue-500">
          <div className="text-sm text-slate-500 mb-1">Active Projects</div>
          <div className="text-3xl font-extrabold text-slate-900">{projects?.length ?? 0}</div>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500">
          <div className="text-sm text-slate-500 mb-1">Total Raised</div>
          <div className="text-3xl font-extrabold text-blue-600">{formatCurrency(totalRaised, 'GBP')}</div>
        </div>
        <div className="card p-5 border-l-4 border-l-violet-500">
          <div className="text-sm text-slate-500 mb-1">Last Sync (Changoapp)</div>
          <div className="text-3xl font-extrabold text-slate-900">{lastSync}</div>
          <div className="text-xs text-slate-400 mt-1">
            {(syncLog as any)?.records_inserted ?? 0} records · {(syncLog as any)?.status ?? '—'}
          </div>
        </div>
      </div>

      {/* Projects */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="font-bold text-slate-800">Active Projects</h2>
          <a href="/projects" className="text-blue-600 text-sm font-semibold hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-slate-100">
          {(projects ?? []).map((project: any) => {
            const summary = Array.isArray(project.project_funding_summary)
              ? project.project_funding_summary[0]
              : project.project_funding_summary;
            return (
              <div key={project.id} className="px-6 py-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-800">{project.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {project.project_code} · {project.project_type} · {summary?.total_members ?? 0} members
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-green-50 text-green-700">
                    {project.status}
                  </span>
                </div>
                <FundingProgress
                  raised={summary?.total_raised ?? 0}
                  target={project.target_amount}
                  currency={project.currency}
                />
              </div>
            );
          })}
          {(!projects || projects.length === 0) && (
            <div className="px-6 py-16 text-center text-slate-400 text-sm">
              {isConnected
                ? <>No active projects. <a href="/projects/new" className="text-blue-600 font-semibold hover:underline">Create one →</a></>
                : 'Connect Supabase to see your projects here.'}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/members',           label: 'Members',      desc: 'View + add',    icon: '👥', bg: 'bg-blue-50   border-blue-200'   },
          { href: '/payments',          label: 'Payments',     desc: 'Full ledger',   icon: '💳', bg: 'bg-green-50  border-green-200'  },
          { href: '/reports',           label: 'Rev Rec',      desc: 'ASC 606',       icon: '📊', bg: 'bg-violet-50 border-violet-200' },
          { href: '/admin/sync-log',    label: 'Sync Log',     desc: 'SFTP history',  icon: '🔄', bg: 'bg-orange-50 border-orange-200' },
        ].map(q => (
          <a key={q.href} href={q.href}
             className={`card p-5 hover:shadow-md transition-shadow cursor-pointer ${q.bg}`}>
            <div className="text-2xl mb-3">{q.icon}</div>
            <div className="font-bold text-slate-800 text-sm">{q.label}</div>
            <div className="text-xs text-slate-400">{q.desc}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
