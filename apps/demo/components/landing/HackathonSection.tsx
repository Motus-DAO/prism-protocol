'use client';

import { motion } from 'framer-motion';

const bounties = [
  { amount: '$15,000', title: 'Privacy Infra', body: 'Privacy infrastructure & SDK track' },
  { amount: '$10,000', title: 'Arcium', body: 'End-to-end encrypted DeFi with MPC' },
  { amount: '$10,000', title: 'ZK Noir / Aztec', body: 'First Noir-based identity SDK on Solana' },
  { amount: '$5,000', title: 'Helius', body: 'RPC & infra for private Solana apps' },
];

const checks = [
  'Fully functional on devnet',
  'Novel context-based architecture',
  'Production-grade SDK published to npm',
  'Solves real problems (front-running, wallet exposure, voting privacy)',
];

export function HackathonSection() {
  return (
    <section className="relative py-20 sm:py-28 px-6 bg-gradient-to-br from-prism-violet to-prism-cyan text-noir">
      <div className="max-w-[1400px] mx-auto text-center">
        <h2 className="font-landing-display font-bold text-3xl md:text-4xl lg:text-5xl mb-6">
          Built for Solana Privacy Hackathon 2026
        </h2>
        <p className="text-xl md:text-2xl mb-12 max-w-[800px] mx-auto opacity-90">
          Targeting $40K in bounties across four tracks. Novel architecture. Real code. Actual privacy.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {bounties.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-8 bg-noir/80 text-ghost border-2 border-noir rounded transition-all hover:scale-105 hover:border-prism-amber"
            >
              <span className="font-landing-display text-3xl text-prism-amber block mb-2">{item.amount}</span>
              <h4 className="font-landing-display text-lg mb-2 text-ghost">{item.title}</h4>
              <p className="text-ghost/80 font-landing-body text-sm">{item.body}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-landing-display text-lg space-y-2"
        >
          {checks.map((c, i) => (
            <p key={i}>✅ {c}</p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
