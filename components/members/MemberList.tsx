'use client';
import type { Individual } from '@/types';

const roleBadge: Record<string, string> = {
  contributor: 'bg-blue-50 text-blue-700 border-blue-200',
  owner:       'bg-purple-50 text-purple-700 border-purple-200',
  admin:       'bg-slate-100 text-slate-700 border-slate-300',
  vendor:      'bg-orange-50 text-orange-700 border-orange-200',
  student:     'bg-green-50 text-green-700 border-green-200',
};

const statusBadge: Record<string, string> = {
  active:    'bg-green-50 text-green-700 border-green-200',
  inactive:  'bg-slate-50 text-slate-500 border-slate-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
};

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${style}`}>
      {label}
    </span>
  );
}

export function MemberList({ members }: { members: Individual[] }) {
  if (members.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 text-sm">
        No members found. Add or upload members to get started.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="table-th w-28">ID</th>
            <th className="table-th">Name</th>
            <th className="table-th hidden md:table-cell">Email</th>
            <th className="table-th hidden sm:table-cell">Role</th>
            <th className="table-th">Status</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
              <td className="table-td font-mono text-blue-600 font-medium">
                {m.fundproj_id}
              </td>
              <td className="table-td font-medium text-slate-800">
                {m.last_name}, {m.first_name}
              </td>
              <td className="table-td hidden md:table-cell text-slate-500">
                {m.email ?? '—'}
              </td>
              <td className="table-td hidden sm:table-cell">
                <Badge label={m.role} style={roleBadge[m.role] ?? roleBadge.contributor} />
              </td>
              <td className="table-td">
                <Badge label={m.status} style={statusBadge[m.status] ?? statusBadge.inactive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
