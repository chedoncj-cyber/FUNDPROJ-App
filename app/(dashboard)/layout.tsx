import Link from 'next/link';
import { ReactNode } from 'react';

const navLinks = [
  { href: '/dashboard',          label: 'Dashboard',  icon: '◻' },
  { href: '/projects',           label: 'Projects',   icon: '📁' },
  { href: '/members',            label: 'Members',    icon: '👥' },
  { href: '/payments',           label: 'Payments',   icon: '💳' },
  { href: '/reports',            label: 'Reports',    icon: '📊' },
  { href: '/admin/sync-log',     label: 'Sync Log',   icon: '🔄' },
  { href: '/settings',           label: 'Settings',   icon: '⚙' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center font-bold text-sm">FP</div>
          <span className="font-semibold tracking-tight">FUNDPROJ</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70
                         hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs text-white/30">
          FUNDPROJ v0.1.0
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="text-sm text-slate-500">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">chedoncj@gmail.com</span>
            <Link href="/api/auth/signout" className="text-blue-600 hover:underline">Sign out</Link>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
