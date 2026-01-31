'use client';

import { motion } from 'framer-motion';

/** Noir-style: 4 use cases, one sentence each, no tags (analysis: PRIORITY 3) */
const useCases = [
  {
    icon: '🌊',
    title: 'Dark Pool Trading',
    body: 'Trade large positions without revealing your holdings or getting front-run.',
  },
  {
    icon: '🗳️',
    title: 'Anonymous Voting',
    body: 'Vote in DAOs without exposing your token balance to other members.',
  },
  {
    icon: '🛡️',
    title: 'Wallet Protection',
    body: 'Disposable contexts with spending limits protect you from malicious dApps.',
  },
  {
    icon: '⭐',
    title: 'Private Reputation',
    body: 'Build trust across multiple apps without linking your activities.',
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="relative py-20 sm:py-28 px-6">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-violet mb-4">
          Use Cases
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-landing-display font-bold text-3xl md:text-4xl mb-12 text-ghost holo-heading-glow"
        >
          One SDK, infinite applications
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative p-8 holo-card-prism"
            >
              <div className="crystal-corner-prism-tl" />
              <div className="crystal-corner-prism-br" />
              <span className="text-4xl block mb-4">{item.icon}</span>
              <h3 className="font-landing-display text-xl font-bold text-ghost mb-2">{item.title}</h3>
              <p className="text-ghost/80 font-landing-body leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
