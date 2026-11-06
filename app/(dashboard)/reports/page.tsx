import { createClient } from '@/lib/supabase/server';
import { RevRecReport } from '@/components/reports/RevRecReport';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { project_id?: string };
}) {
  const sb = await createClient();
  const { data: projects } = await sb.from('projects').select('id, name, currency').order('name');

  const selectedProjectId = searchParams.project_id ?? projects?.[0]?.id;
  const selectedProject   = projects?.find(p => p.id === selectedProjectId);

  const { data: entries } = selectedProjectId
    ? await sb
        .from('revrec_schedule')
        .select(`*, individuals(fundproj_id, first_name, last_name), deferred_revenue(pob_type)`)
        .eq('project_id', selectedProjectId)
        .order('period_start', { ascending: true })
    : { data: [] };

  const enriched = (entries ?? []).map(e => ({
    ...e,
    member_name: e.individuals
      ? `${e.individuals.last_name}, ${e.individuals.first_name}`
      : undefined,
    pob_type: e.deferred_revenue?.pob_type,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Revenue Recognition</h1>
        <p className="text-slate-500 text-sm mt-1">ASC 606 / IFRS 15 — deferred vs recognised per project</p>
      </div>

      {/* Project selector */}
      <div className="card p-4 flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">Project:</label>
        <form>
          <select name="project_id" defaultValue={selectedProjectId} className="input max-w-xs"
            onChange={e => window.location.href = `?project_id=${e.target.value}`}>
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </form>
      </div>

      {selectedProjectId && (
        <RevRecReport
          entries={enriched}
          projectId={selectedProjectId}
          currency={selectedProject?.currency ?? 'GBP'}
        />
      )}
    </div>
  );
}
