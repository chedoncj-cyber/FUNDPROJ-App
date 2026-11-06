import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-2xl p-10">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h1>
        <p className="text-slate-400 text-sm mb-8">Start tracking project funding in minutes</p>

        <form className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">First name</label>
              <input type="text" placeholder="Chedon" className="input" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last name</label>
              <input type="text" placeholder="CJ" className="input" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input type="email" placeholder="you@example.com" className="input" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
            <input type="password" placeholder="Min 8 characters" className="input" required />
          </div>
          <button type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600
                             text-white font-bold text-base hover:from-blue-500 hover:to-violet-500
                             transition-all duration-200 shadow-lg">
            Create account →
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
