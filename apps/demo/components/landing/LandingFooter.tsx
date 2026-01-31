'use client';

import Link from 'next/link';

/** Noir-style: 3 columns - Product, Resources, Connect (analysis PRIORITY 5) */
const product = [
  { label: 'Demo', href: '/demo' },
  { label: 'SDK Install', href: '/#code' },
  { label: 'Use Cases', href: '/#use-cases' },
];

const resources = [
  { label: 'Documentation', href: 'https://github.com/Motus-DAO/prism-protocol/tree/main/packages/sdk' },
  { label: 'API Reference', href: 'https://github.com/Motus-DAO/prism-protocol/tree/main/packages/sdk#readme' },
  { label: 'Examples', href: 'https://github.com/Motus-DAO/prism-protocol/tree/main/apps/demo' },
  { label: 'Hackathon Docs', href: 'https://github.com/Motus-DAO/prism-protocol/blob/main/WINNING_STRATEGY.md' },
];

const connect = [
  { label: 'GitHub', href: 'https://github.com/Motus-DAO/prism-protocol' },
  { label: 'NPM', href: 'https://www.npmjs.com/package/@prism-protocol/sdk' },
  { label: 'Contact', href: 'mailto:team@prismprotocol.dev' },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="font-landing-display font-bold text-prism-cyan mb-4">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('http') || link.href.startsWith('mailto') ? (
              <a
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-ghost/80 text-sm hover:text-prism-cyan transition-colors block"
              >
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="text-ghost/80 text-sm hover:text-prism-cyan transition-colors block">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative py-16 px-6 border-t border-prism-cyan/20 crystal-glass-prism bg-noir/40">
      <div className="max-w-[1400px] mx-auto relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 mb-12">
          <FooterColumn title="Product" links={product} />
          <FooterColumn title="Resources" links={resources} />
          <FooterColumn title="Connect" links={connect} />
        </div>
        <div className="text-center pt-8 border-t border-prism-cyan/15 font-landing-mono text-sm text-ghost/50">
          <p>© 2026 Prism Protocol. MIT License. Built with Anchor, Noir, Arcium, Helius and Solana.</p>
          <p className="mt-2">Privacy infrastructure by MotusDAO.</p>
        </div>
      </div>
    </footer>
  );
}
