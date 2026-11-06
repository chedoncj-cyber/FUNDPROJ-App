'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Projects',    href: '/projects' },
  { label: 'Members',     href: '/members' },
  { label: 'Payments',    href: '/payments' },
  { label: 'How it works',href: '#how-it-works' },
  { label: 'Reports',     href: '/reports' },
];

export function Navbar({ bright = false }: { bright?: boolean }) {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* ── FLOATING ISLAND NAV ───────────────────────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-5"
        style={{ pointerEvents: 'none' }}
      >
        <nav
          style={{ pointerEvents: 'auto' }}
          className={`
            w-full max-w-6xl rounded-full
            transition-all duration-700
            ease-[cubic-bezier(0.32,0.72,0,1)]
            ${scrolled
              ? bright
                ? 'bg-white/90 backdrop-blur-2xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.10)]'
                : 'bg-[#07070c]/75 backdrop-blur-2xl border border-white/[0.09] shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
              : bright
                ? 'bg-white/20 backdrop-blur-xl border border-white/30'
                : 'bg-[#07070c]/40 backdrop-blur-xl  border border-white/[0.05]'}
          `}
        >
          {/* inner double-bezel shell */}
          <div className="flex items-center justify-between p-1.5">

            {/* ── LOGO PILL ── */}
            <Link
              href="/"
              className="flex items-center gap-2.5 pl-2 pr-5 py-2 rounded-full
                         bg-white/[0.04] border border-white/[0.07]
                         hover:bg-white/[0.08] hover:border-white/[0.12]
                         transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              {/* glow orb logo */}
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full bg-blue-600 blur-[8px] opacity-70" />
                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-700
                                flex items-center justify-center font-bold text-[11px] text-white
                                shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  FP
                </div>
              </div>
              <span className="font-semibold text-sm text-white/90 tracking-tight hidden sm:block"
                    style={{ fontFamily: 'var(--font-jakarta)' }}>
                FUNDPROJ
              </span>
            </Link>

            {/* ── DESKTOP LINKS ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2.5 rounded-full text-[13.5px] font-medium
                             text-white/45 hover:text-white/90
                             hover:bg-white/[0.05]
                             transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* ── RIGHT: CTA + HAMBURGER ── */}
            <div className="flex items-center gap-2">
              {/* CTA button — button-in-button pattern */}
              <Link
                href="/signup"
                className="group hidden md:flex items-center gap-2 pl-5 pr-2 py-2 rounded-full
                           bg-blue-600 hover:bg-blue-500
                           text-white text-sm font-semibold
                           transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                           active:scale-[0.97]
                           shadow-[0_0_20px_rgba(37,99,235,0.35)]
                           hover:shadow-[0_0_28px_rgba(37,99,235,0.55)]"
              >
                <span>Get started</span>
                {/* trailing icon bubble */}
                <span className="w-7 h-7 rounded-full bg-white/15
                                 flex items-center justify-center
                                 group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                 group-hover:scale-110
                                 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 8.5L8.5 1.5M8.5 1.5H3M8.5 1.5V7"
                          stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </Link>

              {/* Hamburger → X morph */}
              <button
                onClick={() => setOpen(!open)}
                aria-label={open ? 'Close menu' : 'Open menu'}
                className="md:hidden w-11 h-11 rounded-full
                           bg-white/[0.05] border border-white/[0.08]
                           flex flex-col items-center justify-center gap-[5px]
                           hover:bg-white/[0.10] hover:border-white/[0.14]
                           transition-all duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <span
                  className="block w-[18px] h-[1.5px] bg-white/80 origin-center
                             transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: open ? 'rotate(45deg) translateY(6.5px)' : 'none' }}
                />
                <span
                  className="block w-[18px] h-[1.5px] bg-white/80 origin-center
                             transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ opacity: open ? 0 : 1, transform: open ? 'scaleX(0)' : 'none' }}
                />
                <span
                  className="block w-[18px] h-[1.5px] bg-white/80 origin-center
                             transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  style={{ transform: open ? 'rotate(-45deg) translateY(-6.5px)' : 'none' }}
                />
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── FULL-SCREEN OVERLAY MENU ──────────────────────────── */}
      <div
        className="fixed inset-0 z-40"
        style={{
          opacity:        open ? 1 : 0,
          pointerEvents:  open ? 'auto' : 'none',
          transition:     'opacity 600ms cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-[#07070c]/95 backdrop-blur-3xl" />

        {/* subtle radial glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
                        rounded-full bg-blue-800/20 blur-[80px] pointer-events-none" />

        {/* content */}
        <div className="relative h-full flex flex-col items-center justify-center px-8 gap-1">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[11vw] sm:text-7xl font-bold tracking-tight
                         text-white/70 hover:text-white
                         transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                         hover:translate-x-3"
              style={{
                transform:      open ? 'translateY(0)' : 'translateY(48px)',
                opacity:        open ? 1 : 0,
                transitionDelay: open ? `${80 + i * 55}ms` : '0ms',
                fontFamily:     'var(--font-jakarta)',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* CTA in overlay */}
          <div
            className="mt-10"
            style={{
              transform:       open ? 'translateY(0)' : 'translateY(48px)',
              opacity:         open ? 1 : 0,
              transitionDelay: open ? '410ms' : '0ms',
              transition:      'all 700ms cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 pl-7 pr-3 py-3.5 rounded-full
                         bg-blue-600 hover:bg-blue-500 text-white text-lg font-semibold
                         shadow-[0_0_40px_rgba(37,99,235,0.4)]
                         hover:shadow-[0_0_60px_rgba(37,99,235,0.6)]
                         transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
            >
              <span>Get started</span>
              <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center
                               group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                               group-hover:scale-110
                               transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 11L11 2M11 2H4M11 2V9"
                        stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </div>

          {/* footer row */}
          <div
            className="absolute bottom-10 inset-x-0 flex justify-center gap-8 text-sm text-white/20"
            style={{
              opacity:         open ? 1 : 0,
              transitionDelay: open ? '500ms' : '0ms',
              transition:      'opacity 600ms ease',
            }}
          >
            <Link href="/login"  className="hover:text-white/50 transition-colors">Log in</Link>
            <span>·</span>
            <Link href="#"       className="hover:text-white/50 transition-colors">Privacy</Link>
            <span>·</span>
            <span>FUNDPROJ © 2026</span>
          </div>
        </div>
      </div>
    </>
  );
}
