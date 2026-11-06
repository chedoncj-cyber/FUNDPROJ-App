import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

const FEATURES = [
  {
    icon: '👥',
    eyebrow: 'Directory',
    title: 'Everyone in order — instantly',
    body: 'Upload a list of hundreds in seconds. Auto-assigned FP-00001 IDs. Sorted A→Z always.',
    bg: 'bg-gradient-to-br from-blue-500 to-blue-700',
    glow: '#3b82f6',
    span: 'md:col-span-2',
  },
  {
    icon: '🔄',
    eyebrow: 'Sync',
    title: 'Daily auto-pull from Changoapp',
    body: 'SFTP job fires at 02:00 UTC. Payments land overnight — no manual entry ever.',
    bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    glow: '#10b981',
    span: '',
  },
  {
    icon: '📊',
    eyebrow: 'Accounting',
    title: 'ASC 606 / IFRS 15 engine',
    body: 'Full Revenue Recognition. Deferred vs recognised. Monthly release. One-click audit report.',
    bg: 'bg-gradient-to-br from-violet-500 to-purple-700',
    glow: '#8b5cf6',
    span: '',
  },
  {
    icon: '💳',
    eyebrow: 'Integrations',
    title: 'Every payment platform in one ledger',
    body: 'Changoapp · Stripe · GoCardless · Flutterwave · PayPal · Square — all normalised.',
    bg: 'bg-gradient-to-br from-orange-400 to-pink-600',
    glow: '#f97316',
    span: 'md:col-span-3',
  },
];

const PLATFORMS = [
  { name: 'Changoapp',   color: 'bg-blue-100   text-blue-700' },
  { name: 'Stripe',      color: 'bg-purple-100 text-purple-700' },
  { name: 'GoCardless',  color: 'bg-green-100  text-green-700' },
  { name: 'Flutterwave', color: 'bg-orange-100 text-orange-700' },
  { name: 'PayPal',      color: 'bg-sky-100    text-sky-700' },
  { name: 'Square',      color: 'bg-pink-100   text-pink-700' },
];

const STEPS = [
  { n: '1', label: 'Create a project',       sub: 'Wedding, school, holiday, savings — any goal' },
  { n: '2', label: 'Add your members',        sub: 'Upload CSV or add individually — auto-sorted A→Z' },
  { n: '3', label: 'Connect payment apps',   sub: 'Changoapp, Stripe, GoCardless and more' },
  { n: '4', label: 'Payments sync nightly',  sub: 'SFTP job runs 02:00 UTC — zero manual work' },
  { n: '5', label: 'Recognise revenue',      sub: 'ASC 606/IFRS 15 schedules released with one click' },
];

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
      <Navbar bright />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Bright gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700" />
        {/* Mesh orbs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full
                        bg-purple-400/40 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%]  w-[400px] h-[400px] rounded-full
                        bg-blue-300/30  blur-[80px]  pointer-events-none" />
        <div className="absolute top-[30%]  left-[40%]    w-[300px] h-[300px] rounded-full
                        bg-pink-400/20  blur-[70px]  pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-40 pb-32 text-center text-white">
          {/* Eyebrow badge */}
          <div className="fp-reveal mb-7">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                             bg-white/15 border border-white/25 backdrop-blur-sm
                             text-xs font-semibold uppercase tracking-widest text-white/90">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              Multi-platform · Project funding · Revenue recognition
            </span>
          </div>

          {/* H1 */}
          <h1 className="fp-reveal fp-reveal-d1
                         text-5xl sm:text-6xl md:text-[76px] font-extrabold tracking-[-0.03em]
                         leading-[1.05] max-w-4xl mx-auto mb-7">
            One app to track
            <span className="block text-transparent bg-clip-text
                             bg-gradient-to-r from-yellow-200 via-green-200 to-cyan-200">
              every contribution
            </span>
          </h1>

          {/* Sub */}
          <p className="fp-reveal fp-reveal-d2 text-lg md:text-xl text-white/70
                        max-w-2xl mx-auto leading-relaxed mb-12">
            School projects · Weddings · Holidays · Group savings.
            Connect Changoapp and 5 other payment platforms — one clean ledger, automatic daily sync.
          </p>

          {/* CTAs */}
          <div className="fp-reveal fp-reveal-d3 flex flex-wrap gap-4 justify-center mb-16">
            <Link href="/signup"
                  className="group flex items-center gap-2.5 pl-7 pr-3 py-3.5 rounded-full
                             bg-white text-blue-700 font-bold text-base
                             shadow-[0_4px_24px_rgba(0,0,0,0.25)]
                             hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                             transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
                             active:scale-[0.97]">
              <span>Start free today</span>
              <span className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center
                               group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                               group-hover:scale-105 transition-transform duration-300">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
            <Link href="/dashboard"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-full
                             bg-white/10 hover:bg-white/20 border border-white/25
                             text-white font-semibold text-base backdrop-blur-sm
                             transition-all duration-300">
              View dashboard demo
            </Link>
          </div>

          {/* Platform tags */}
          <div className="fp-reveal fp-reveal-d4 flex flex-wrap gap-2 justify-center">
            {PLATFORMS.map(p => (
              <span key={p.name}
                    className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15
                               text-white/80 text-sm font-medium backdrop-blur-sm">
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* Wave bottom */}
        <div className="relative h-20 overflow-hidden">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg"
               className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 fp-reveal">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600
                             text-xs font-semibold uppercase tracking-widest mb-4">
              How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Set up in minutes
            </h2>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <div key={i}
                   className="fp-reveal relative flex flex-col items-center text-center p-6
                              rounded-2xl border border-slate-100 hover:border-blue-200
                              hover:bg-blue-50/50 transition-all duration-300"
                   style={{ animationDelay: `${i * 70}ms` }}>
                {/* step number circle with gradient */}
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold
                                text-white text-lg mb-4 shadow-lg"
                     style={{
                       background: `linear-gradient(135deg, hsl(${220 + i*20},85%,55%), hsl(${240 + i*20},80%,50%))`,
                     }}>
                  {s.n}
                </div>
                {/* connector line */}
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-[2.5rem] w-4 h-0.5
                                  bg-gradient-to-r from-blue-200 to-transparent translate-x-4" />
                )}
                <p className="font-bold text-slate-800 text-sm mb-1">{s.label}</p>
                <p className="text-slate-400 text-xs leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES BENTO ──────────────────────────────────── */}
      <section className="bg-slate-50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fp-reveal">
            <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700
                             text-xs font-semibold uppercase tracking-widest mb-4">
              Features
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              Everything you need
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                   className={`fp-reveal group relative overflow-hidden rounded-2xl
                               cursor-default select-none ${f.span}`}
                   style={{ animationDelay: `${i * 80}ms` }}>
                {/* coloured card */}
                <div className={`${f.bg} p-8 h-full text-white relative overflow-hidden`}>
                  {/* subtle pattern */}
                  <div className="absolute inset-0 opacity-10"
                       style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                  <div className="relative">
                    <div className="text-4xl mb-5">{f.icon}</div>
                    <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-white/60 mb-2 block">
                      {f.eyebrow}
                    </span>
                    <h3 className="text-xl font-bold mb-3 leading-snug">{f.title}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE RECOGNITION CALLOUT ─────────────────────── */}
      <section className="bg-white py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="fp-reveal rounded-3xl overflow-hidden
                          bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700
                          p-10 md:p-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <span className="inline-block mb-4 px-3 py-1.5 rounded-full
                                 bg-white/15 border border-white/25
                                 text-xs font-semibold uppercase tracking-widest text-white/90">
                  ASC 606 · IFRS 15
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-5">
                  Revenue Recognition<br/>
                  <span className="text-yellow-300">built right in</span>
                </h2>
                <p className="text-white/65 leading-relaxed mb-8 text-lg">
                  5-step model. Deferred revenue, straight-line recognition, milestone releases.
                  Full immutable audit trail.
                </p>
                <Link href="/reports"
                      className="group inline-flex items-center gap-2.5 pl-7 pr-3 py-3.5
                                 rounded-full bg-white text-violet-700 font-bold
                                 shadow-[0_4px_24px_rgba(0,0,0,0.2)]
                                 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                                 transition-all duration-300">
                  <span>See reports</span>
                  <span className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center
                                   group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                   group-hover:scale-105 transition-transform duration-300">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8"
                            stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </Link>
              </div>

              {/* Journal card */}
              <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-7 font-mono">
                <div className="text-white/40 text-[10px] uppercase tracking-widest mb-5">
                  Month-end journal entry
                </div>
                {[
                  ['Dr', 'Deferred Revenue — Custody',  '£750', 'text-red-300'],
                  ['Cr', 'Revenue — Custody Service',   '£750', 'text-green-300'],
                  ['Dr', 'Deferred Revenue — Support',  '£250', 'text-red-300'],
                  ['Cr', 'Revenue — Support',           '£250', 'text-green-300'],
                ].map(([dr, label, amt, col], i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-white/10">
                    <span className="flex gap-3">
                      <span className={`w-5 font-bold text-sm ${col}`}>{dr}</span>
                      <span className="text-white/55 text-sm">{label}</span>
                    </span>
                    <span className="text-white/70 text-sm font-semibold">{amt}</span>
                  </div>
                ))}
                <div className="mt-4 pt-3 flex justify-between text-xs text-white/35">
                  <span>Deferred Balance</span>
                  <span className="text-yellow-300 font-bold">£0.00 ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FOOTER BAND ─────────────────────────────────── */}
      <section className="bg-slate-900 py-20 px-4 text-center text-white">
        <div className="max-w-2xl mx-auto fp-reveal">
          <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Ready to get started?</h2>
          <p className="text-slate-400 mb-10 text-lg">Free to set up. No credit card required.</p>
          <Link href="/signup"
                className="group inline-flex items-center gap-2.5 pl-7 pr-3 py-4 rounded-full
                           bg-gradient-to-r from-blue-500 to-violet-600
                           text-white font-bold text-lg
                           shadow-[0_4px_30px_rgba(99,102,241,0.5)]
                           hover:shadow-[0_8px_40px_rgba(99,102,241,0.7)]
                           transition-all duration-300">
            <span>Create your account</span>
            <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center
                             group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                             group-hover:scale-105 transition-transform duration-300">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 11L11 2M11 2H4M11 2V9"
                      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="bg-slate-950 border-t border-white/5 px-6 py-8
                         flex flex-col sm:flex-row items-center justify-between gap-3
                         text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center
                          text-[9px] font-bold text-white">FP</div>
          <span className="text-slate-400 font-medium">FUNDPROJ</span>
        </div>
        <span>© 2026 · chedoncj@gmail.com</span>
        <div className="flex gap-5">
          <Link href="/login"  className="hover:text-slate-300 transition-colors">Log in</Link>
          <Link href="/signup" className="hover:text-slate-300 transition-colors">Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
