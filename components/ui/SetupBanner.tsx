export function SetupBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <span className="text-xl">⚠️</span>
      <div>
        <p className="font-semibold text-amber-800 text-sm">Supabase not connected</p>
        <p className="text-amber-700 text-sm mt-0.5">
          Copy <code className="bg-amber-100 px-1 rounded">.env.example</code> →{' '}
          <code className="bg-amber-100 px-1 rounded">.env.local</code> and fill in your{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
             className="underline hover:text-amber-900">Supabase project keys</a>,
          then restart the dev server.
        </p>
      </div>
    </div>
  );
}
