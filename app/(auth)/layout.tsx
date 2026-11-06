import type { ReactNode } from 'react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700
                    flex flex-col items-center justify-center px-4 py-12"
         style={{ fontFamily: 'var(--font-jakarta)' }}>
      <Link href="/" className="flex items-center gap-2 mb-10 group">
        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30
                        flex items-center justify-center font-bold text-sm text-white">
          FP
        </div>
        <span className="font-bold text-white text-lg tracking-tight">FUNDPROJ</span>
      </Link>
      {children}
    </div>
  );
}
