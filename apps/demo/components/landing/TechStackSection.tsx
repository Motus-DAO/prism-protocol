'use client';

import { motion } from 'framer-motion';

const techs = [
  {
    label: 'Zero-Knowledge',
    title: 'Noir Circuits',
    body: 'Production-grade ZK solvency proofs. Prove balance thresholds without revealing amounts. Verifiable on-chain, private off-chain.',
  },
  {
    label: 'Confidential Computing',
    title: 'Arcium MPC',
    body: 'Multi-party computation for encrypting sensitive data. Balance commitments bound cryptographically to context identities.',
  },
  {
    label: 'Smart Contracts',
    title: 'Anchor Programs',
    body: 'Solana-native context management. Create, fund, limit, and revoke identities with enforceable on-chain rules.',
  },
  {
    label: 'Developer SDK',
    title: 'TypeScript API',
    body: "Five lines of code to go private. npm install @prism-protocol/sdk and you're building privacy-preserving apps.",
  },
];

export function TechStackSection() {
  return (
    <section id="tech" className="relative py-20 sm:py-28 px-6 bg-concrete">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-amber mb-4">Technology</p>
        <h2 className="font-landing-display font-bold text-3xl md:text-4xl mb-4 text-ghost">
          Built on the bleeding edge
        </h2>
        <p className="max-w-[700px] text-ghost/70 mb-12 font-landing-body">
          First protocol to combine Noir ZK proofs, Arcium confidential computing, and Solana smart contracts in one developer-friendly SDK.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {techs.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative p-8 bg-steel border border-transparent overflow-hidden transition-all hover:border-prism-cyan group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-prism-cyan to-prism-violet scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <span className="inline-block px-3 py-1 mb-4 bg-prism-cyan/10 border border-prism-cyan font-landing-mono text-xs uppercase tracking-wider text-prism-cyan">
                {item.label}
              </span>
              <h4 className="font-landing-display text-xl mb-4 text-ghost">{item.title}</h4>
              <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
