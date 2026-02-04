'use client';

import Link from 'next/link';

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 py-8 px-6 border-b border-prism-cyan/20 crystal-glass-prism bg-noir/80 backdrop-blur-xl">
      <div className="max-w-[1400px] mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-landing-display text-xl font-bold tracking-tight uppercase bg-gradient-to-r from-prism-cyan to-prism-violet bg-clip-text text-transparent"
        >
          <span>PRISM_PROTOCOL</span>
          <span className="text-xs font-normal normal-case text-ghost/70 tracking-normal">by MotusDAO</span>
        </Link>
        <nav>
          <ul className="flex flex-wrap items-center gap-8 list-none">
            <li>
              <Link href="/#problem" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full">
                Problem
              </Link>
            </li>
            <li>
              <Link href="/#solution" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full">
                Solution
              </Link>
            </li>
            <li>
              <Link href="/#tech" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full hidden sm:inline">
                Tech
              </Link>
            </li>
            <li>
              <Link href="/#code" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full">
                Docs
              </Link>
            </li>
            <li>
              <Link href="/demo" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full">
                Demo
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full">
                Dashboard
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/Motus-DAO/prism-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ghost font-landing-mono text-sm uppercase tracking-wider hover:text-prism-cyan transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-0.5 after:bg-prism-cyan after:transition-[width] hover:after:w-full"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
