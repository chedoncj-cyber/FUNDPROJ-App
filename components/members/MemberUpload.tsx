'use client';
import { useRef, useState } from 'react';
import type { Individual } from '@/types';

interface ParsedRow { first_name: string; last_name: string; email?: string; phone?: string; role?: string; }

export function MemberUpload() {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [status,  setStatus]  = useState<'idle' | 'preview' | 'uploading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleFile(file: File) {
    const text = await file.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) { setMessage('CSV must have a header row and at least one data row.'); return; }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows: ParsedRow[] = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
      return { first_name: obj.first_name, last_name: obj.last_name, email: obj.email, phone: obj.phone, role: obj.role };
    }).sort((a, b) => a.last_name.localeCompare(b.last_name) || a.first_name.localeCompare(b.first_name));

    setPreview(rows);
    setStatus('preview');
  }

  async function confirmUpload() {
    if (!inputRef.current?.files?.[0]) return;
    setStatus('uploading');
    const form = new FormData();
    form.append('file', inputRef.current.files[0]);

    const res = await fetch('/api/members/upload', { method: 'POST', body: form });
    if (res.ok) {
      const json = await res.json();
      setMessage(`${json.inserted} members imported successfully.`);
      setStatus('done');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      const json = await res.json();
      setMessage(json.error ?? 'Upload failed.');
      setStatus('error');
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button className="btn-secondary" onClick={() => inputRef.current?.click()}>
        Upload CSV
      </button>

      {status === 'preview' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Preview — {preview.length} members</h3>
              <button onClick={() => setStatus('idle')} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
            </div>
            <div className="overflow-auto flex-1 p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b">
                    <th className="text-left py-2 pr-4">Name (Alphabetical)</th>
                    <th className="text-left py-2 pr-4">Email</th>
                    <th className="text-left py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-2 pr-4 font-medium">{r.last_name}, {r.first_name}</td>
                      <td className="py-2 pr-4 text-slate-500">{r.email || '—'}</td>
                      <td className="py-2 text-slate-500">{r.role || 'contributor'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setStatus('idle')}>Cancel</button>
              <button className="btn-primary" onClick={confirmUpload} disabled={status === 'uploading'}>
                {status === 'uploading' ? 'Importing…' : `Import ${preview.length} members`}
              </button>
            </div>
          </div>
        </div>
      )}

      {(status === 'done' || status === 'error') && (
        <div className={`fixed bottom-4 right-4 z-50 card px-5 py-4 text-sm shadow-lg
          ${status === 'done' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
          {message}
        </div>
      )}
    </>
  );
}
