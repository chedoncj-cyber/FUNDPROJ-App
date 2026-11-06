export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your FUNDPROJ account</p>
      </div>

      {/* Supabase */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Database Connection</h2>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          <p className="font-semibold mb-1">Connect Supabase</p>
          <ol className="list-decimal pl-5 space-y-1 text-amber-700">
            <li>Create a project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-medium">supabase.com</a></li>
            <li>Copy your URL and anon key from Project Settings → API</li>
            <li>Paste into <code className="bg-amber-100 px-1 rounded">.env.local</code></li>
            <li>Run <code className="bg-amber-100 px-1 rounded">supabase db push</code> to apply the schema</li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>

      {/* Stripe */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Stripe Payments</h2>
        <div className="rounded-lg bg-purple-50 border border-purple-200 p-4 text-sm text-purple-800">
          <p className="font-semibold mb-1">Connect Stripe</p>
          <ol className="list-decimal pl-5 space-y-1 text-purple-700">
            <li>Get API keys from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer" className="underline font-medium">dashboard.stripe.com/apikeys</a></li>
            <li>Add to <code className="bg-purple-100 px-1 rounded">.env.local</code></li>
            <li>Register webhook: <code className="bg-purple-100 px-1 rounded">/api/payments/stripe</code></li>
          </ol>
        </div>
      </div>

      {/* Changoapp */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Changoapp SFTP</h2>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Enable Changoapp sync</p>
          <ol className="list-decimal pl-5 space-y-1 text-blue-700">
            <li>Contact <a href="https://changoapp.com" target="_blank" rel="noreferrer" className="underline font-medium">Changoapp support</a> to request SFTP access</li>
            <li>Add host, user, password to <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
            <li>Confirm file format: <code className="bg-blue-100 px-1 rounded">fundproj_payments_YYYYMMDD.csv</code></li>
            <li>Test: POST <code className="bg-blue-100 px-1 rounded">/api/sftp-sync</code> with your CRON_SECRET</li>
          </ol>
        </div>
      </div>

      {/* Vercel */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-slate-800">Deploy to Vercel</h2>
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700">
          <ol className="list-decimal pl-5 space-y-1">
            <li>Push to GitHub: <code className="bg-slate-100 px-1 rounded">git push -u origin main</code></li>
            <li>Import repo at <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="underline text-blue-600">vercel.com/new</a></li>
            <li>Add all env vars in Vercel Dashboard → Settings → Environment Variables</li>
            <li>Cron job auto-registers from <code className="bg-slate-100 px-1 rounded">vercel.json</code> (02:00 UTC daily)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
