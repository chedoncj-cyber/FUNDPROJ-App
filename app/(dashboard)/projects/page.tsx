import { createClient, safeQuery } from '@/lib/supabase/server';
import { FundingProgress } from '@/components/projects/FundingProgress';
import { SetupBanner } from '@/components/ui/SetupBanner';

export default async function ProjectsPage() {
  const sb = await createClient();
  const projects = await safeQuery(() =>
    sb.from('projects')
      .select('*, project_funding_summary(*)')
      .order('created_at', { ascending: false })
  );

  const isConnected = projects !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isConnected ? `${projects?.length ?? 0} projects` : 'Connect Supabase to see projects'}
          </p>
        </div>
        <a href="/projects/new" className="btn-primary">+ New Project</a>
      </div>

      {!isConnected && <SetupBanner />}

      {/* Grid of project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects?.map((project) => {
          const summary = Array.isArray(project.project_funding_summary)
            ? project.project_funding_summary[0]
            : project.project_funding_summary;
          return (
            <div key={project.id} className="card p-6 hover:shadow-md transition-shadow">
              {/* type badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold
                  ${project.project_type === 'wedding'  ? 'bg-pink-50   text-pink-700'  :
                    project.project_type === 'school'   ? 'bg-green-50  text-green-700' :
                    project.project_type === 'holiday'  ? 'bg-orange-50 text-orange-700':
                    project.project_type === 'savings'  ? 'bg-blue-50   text-blue-700'  :
                                                          'bg-slate-100 text-slate-600'}`}>
                  {project.project_type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium
                  ${project.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                    project.status === 'funded' ? 'bg-blue-50  text-blue-700  border-blue-200'  :
                                                  'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 mb-1 text-lg">{project.name}</h3>
              <p className="text-xs text-slate-400 mb-5">{project.project_code}</p>
              <FundingProgress
                raised={summary?.total_raised ?? 0}
                target={project.target_amount}
                currency={project.currency}
              />
              <div className="mt-4 flex justify-between text-xs text-slate-400">
                <span>{summary?.total_members ?? 0} members</span>
                <a href={`/projects/${project.id}`} className="text-blue-600 font-semibold hover:underline">
                  View →
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {isConnected && (!projects || projects.length === 0) && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">📁</div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-6">Create your first funding project to get started</p>
          <a href="/projects/new" className="btn-primary">Create project</a>
        </div>
      )}
    </div>
  );
}
