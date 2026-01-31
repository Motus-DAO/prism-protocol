'use client';

import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';

interface HoloLinkProps {
  children: React.ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'prism' | 'prismOutline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  external?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-cyan-500/20 to-fuchsia-500/20 border border-cyan-400/30 text-cyan-300 hover:from-cyan-500/30 hover:to-fuchsia-500/30 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
  secondary:
    'bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-400/30 text-fuchsia-300 hover:from-fuchsia-500/30 hover:to-cyan-500/30 hover:border-fuchsia-400/50 hover:shadow-[0_0_20px_rgba(255,0,255,0.3)]',
  ghost:
    'bg-transparent border border-white/20 text-white/80 hover:bg-white/5 hover:border-white/40 hover:text-white',
  prism:
    'bg-gradient-to-r from-prism-cyan/20 to-prism-violet/20 border border-prism-cyan/30 text-prism-cyan hover:from-prism-cyan/30 hover:to-prism-violet/30 hover:border-prism-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,204,0.35)]',
  prismOutline:
    'bg-transparent border-2 border-prism-cyan/40 text-prism-cyan hover:bg-prism-cyan/10 hover:border-prism-cyan/60 hover:shadow-[0_0_20px_rgba(0,255,204,0.25)]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const HoloLink: React.FC<HoloLinkProps> = ({
  children,
  href,
  variant = 'prism',
  size = 'md',
  className,
  external = false,
}) => {
  const baseClasses =
    'relative overflow-hidden rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-prism-cyan/50 inline-flex items-center justify-center backdrop-blur-sm';

  const content = (
    <>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <span
        className={clsx(
          'absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300',
          variant === 'prism' || variant === 'prismOutline'
            ? 'bg-gradient-to-r from-prism-cyan/10 to-prism-violet/10'
            : 'bg-gradient-to-r from-cyan-400/10 to-fuchsia-500/10'
        )}
      />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {content}
    </Link>
  );
};
