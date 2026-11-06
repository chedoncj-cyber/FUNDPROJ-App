import { createClient } from '@/lib/supabase/server';
import { MemberList } from '@/components/members/MemberList';
import { MemberUpload } from '@/components/members/MemberUpload';

export default async function MembersPage({
  searchParams,
}: {
  searchParams: { page?: string; q?: string };
}) {
  const sb = await createClient();
  const page  = parseInt(searchParams.page ?? '1');
  const q     = searchParams.q ?? '';
  const limit = 25;
  const from  = (page - 1) * limit;

  let query = sb
    .from('individuals')
    .select('*', { count: 'exact' })
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true })
    .range(from, from + limit - 1);

  if (q) {
    query = query.or(
      `last_name.ilike.%${q}%,first_name.ilike.%${q}%,fundproj_id.ilike.%${q}%`
    );
  }

  const { data: members, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members</h1>
          <p className="text-slate-500 text-sm mt-1">
            {count ?? 0} total members — displayed alphabetically
          </p>
        </div>
        <div className="flex gap-2">
          <MemberUpload />
          <a href="/members/new" className="btn-primary">+ Add Member</a>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <form>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or ID (FP-00001)…"
            className="input max-w-md"
          />
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <MemberList members={members ?? []} />
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}&q=${q}`} className="btn-secondary text-xs py-1.5 px-3">Previous</a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}&q=${q}`} className="btn-secondary text-xs py-1.5 px-3">Next</a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
