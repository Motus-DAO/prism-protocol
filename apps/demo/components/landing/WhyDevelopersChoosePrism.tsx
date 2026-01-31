'use client';

import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

const benefits = [
  {
    icon: '⚡',
    title: '5-Line Integration',
    body: 'From npm install to private transactions in minutes, not days.',
  },
  {
    icon: '🔒',
    title: 'Zero Config Encryption',
    body: 'Arcium MPC encryption works out of the box. No keys to manage.',
  },
  {
    icon: '📦',
    title: 'Type-Safe SDK',
    body: 'Full TypeScript support with autocomplete and type inference.',
  },
  {
    icon: '🔗',
    title: 'Wallet Compatible',
    body: 'Works with Phantom, Solflare, and any Solana wallet adapter.',
  },
];

export function WhyDevelopersChoosePrism() {
  return (
    <section id="why-prism" className="relative py-20 sm:py-28 px-6">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-violet mb-4">
          Developer Experience
        </p>
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-landing-display font-bold text-3xl md:text-4xl mb-16 text-ghost holo-heading-glow"
        >
          Why Developers Choose Prism
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <HoloPanel variant="default" size="lg" className="h-full border-prism-cyan/20">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-landing-display text-lg font-bold text-prism-cyan mb-2">
                  {item.title}
                </h3>
                <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">
                  {item.body}
                </p>
              </HoloPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
