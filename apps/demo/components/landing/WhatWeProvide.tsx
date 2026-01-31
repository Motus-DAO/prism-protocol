import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

const bullets = [
  { title: 'Portable reputation', text: 'Same credentials (e.g. solvency proof) work across apps; each app sees only what you prove, not your full identity or activity.' },
  { title: 'Identity & contexts', text: 'Root identity plus disposable context identities (DeFi, Social, Gaming, etc.) with spending limits and revocation.' },
  { title: 'ZK solvency proofs', text: 'Prove "balance ≥ threshold" without revealing the amount (Noir).' },
  { title: 'Arcium MPC encryption', text: 'Encrypt balances and data; combine with proofs for maximum privacy.' },
];

export function WhatWeProvide() {
  return (
    <section className="relative py-20 px-6" id="what-we-provide">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-cyan-400 mb-4 font-mono"
        >
          What Prism Provides
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white/90 text-lg mb-10"
        >
          Prism Protocol is infrastructure – identity, contexts, ZK proofs, and encryption so developers can build privacy into their apps.
        </motion.p>
        <div className="grid gap-4 md:grid-cols-2">
          {bullets.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <HoloPanel variant="elevated" size="md" className="h-full">
                <h3 className="text-cyan-300 font-semibold mb-2">{item.title}</h3>
                <p className="text-white/80 text-sm">{item.text}</p>
              </HoloPanel>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 text-white/70 text-sm"
        >
          <strong className="text-white/90">Use it for:</strong> portable reputation across apps, anonymous DAO voting, anti-drain wallet protection, token gating, private DeFi/dark pools, social privacy, and custom privacy-preserving flows.
        </motion.p>
      </div>
    </section>
  );
}
