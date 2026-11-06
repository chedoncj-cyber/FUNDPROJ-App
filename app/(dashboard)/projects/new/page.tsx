'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const PROJECT_TYPES = [
  { value: 'wedding',  label: '💍 Wedding',  color: 'border-pink-300   bg-pink-50   text-pink-700'   },
  { value: 'school',   label: '🎒 School',   color: 'border-green-300  bg-green-50  text-green-700'  },
  { value: 'holiday',  label: '🌴 Holiday',  color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'savings',  label: '💰 Savings',  color: 'border-blue-300   bg-blue-50   text-blue-700'   },
  { value: 'custom',   label: '✨ Custom',   color: 'border-slate-300  bg-slate-50  text-slate-700'  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('custom');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, project_type: type }),
    });
    if (res.ok) router.push('/projects');
    else setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
        <p className="text-slate-500 text-sm mt-1">Create a funding project for your group</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
        {/* Project type */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Project type</label>
          <div className="grid grid-cols-5 gap-2">
            {PROJECT_TYPES.map(t => (
              <button key={t.value} type="button"
                      onClick={() => setType(t.value)}
                      className={`py-3 px-2 rounded-xl border-2 text-xs font-semibold text-center
                                  transition-all duration-150 cursor-pointer
                                  ${type === t.value ? t.color + ' border-opacity-100' : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Project name</label>
          <input name="name" type="text" placeholder="e.g. James & Sarah's Wedding Fund"
                 className="input" required />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description (optional)</label>
          <textarea name="description" rows={3}
                    placeholder="What is this project for?"
                    className="input resize-none" />
        </div>

        {/* Target + Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Target amount</label>
            <input name="target_amount" type="number" min="1" step="0.01"
                   placeholder="12000.00" className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
            <select name="currency" className="input">
              <option value="GBP">GBP £</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GHS">GHS ¢</option>
              <option value="NGN">NGN ₦</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start date</label>
            <input name="start_date" type="date" className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">End date (optional)</label>
            <input name="end_date" type="date" className="input" />
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Visibility</label>
          <select name="visibility" className="input max-w-xs">
            <option value="private">Private — invite only</option>
            <option value="public">Public — open contribution link</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5">
            {loading ? 'Creating…' : 'Create project'}
          </button>
          <a href="/projects" className="btn-secondary px-6 py-2.5">Cancel</a>
        </div>
      </form>
    </div>
  );
}
