'use client';

import { motion } from 'framer-motion';
import { HoloLink } from '../ui';

/** Noir-style: Social proof / Open Source section (analysis PRIORITY 4) */
const stats = [
  { number: '⭐ Open Source', label: 'MIT licensed on GitHub' },
  { number: '🔧 Hackathon', label: 'Built during Solana Privacy 2026' },
  { number: '🎯 $40K', label: 'Targeting 4 bounty tracks' },
  { number: '📦 v1.0', label: 'Published to npm' },
];

export function OpenSourceSection() {
  return (
    <section id="open-source" className="relative py-20 sm:py-28 px-6 border-t border-prism-cyan/15">
      <div className="max-w-[1400px] mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-landing-display font-bold text-3xl md:text-4xl mb-4 text-ghost holo-heading-glow"
        >
          Open Source & Growing
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-ghost/70 font-landing-body mb-12 max-w-[560px] mx-auto"
        >
          Fully MIT licensed. Built with Noir, Arcium, and Solana.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
        >
          {stats.map((item, i) => (
            <div key={item.label} className="relative p-6 holo-card-prism">
              <div className="crystal-corner-prism-tl" />
              <div className="crystal-corner-prism-br" />
              <div className="font-landing-display text-lg font-bold text-prism-cyan mb-1">
                {item.number}
              </div>
              <div className="font-landing-mono text-xs uppercase tracking-wider text-ghost/70">
                {item.label}
              </div>
            </div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <HoloLink
            href="https://github.com/Motus-DAO/prism-protocol"
            variant="prism"
            size="lg"
            external
            className="font-landing-mono text-sm uppercase tracking-wider"
          >
            View on GitHub →
          </HoloLink>
        </motion.div>
      </div>
    </section>
  );
}
