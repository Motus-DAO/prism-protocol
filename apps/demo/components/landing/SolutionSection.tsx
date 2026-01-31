'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    step: '1',
    icon: '🎭',
    title: 'Create Context',
    body: 'Generate a disposable identity for DeFi, social, gaming, or any purpose. Each context is a fresh PDA—invisible to your main wallet.',
  },
  {
    step: '2',
    icon: '🔐',
    title: 'Generate Proof',
    body: 'Use Noir ZK circuits to prove "balance ≥ threshold" without revealing the amount. Encrypted with Arcium MPC, bound to your context.',
  },
  {
    step: '3',
    icon: '🔥',
    title: 'Burn & Repeat',
    body: "Done? Revoke the context. It disappears. Your main wallet was never exposed. Create a new one for your next interaction.",
  },
];

export function SolutionSection() {
  return (
    <section id="solution" className="relative py-20 sm:py-28 px-6">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-amber mb-4">The Solution</p>
        <h2 className="font-landing-display font-bold text-3xl md:text-4xl lg:text-5xl mb-6 text-center text-ghost holo-heading-glow">
          Context-based privacy that actually works
        </h2>
        <p className="max-w-[900px] mx-auto text-center text-lg md:text-xl text-ghost/90 font-landing-body font-medium leading-relaxed mb-10 px-4 py-6 rounded-2xl border border-prism-cyan/30 bg-prism-cyan/5 shadow-[0_0_40px_rgba(0,255,204,0.08)]">
          Prism Protocol is the first Solana SDK to combine <strong className="font-bold text-prism-cyan">disposable identities, zero-knowledge proofs, and MPC encryption</strong>.
          <span className="block mt-4"><strong className="font-bold text-prism-cyan">One wallet, infinite contexts</strong>—each isolated, provable, and revocable.</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative pt-20 pb-10 px-8 text-center holo-card-prism hover:-translate-y-1 transition-transform duration-300 min-h-[300px] flex flex-col overflow-visible"
            >
              <div className="crystal-corner-prism-tl" />
              <div className="crystal-corner-prism-br" />
              <span
                className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl border-2 border-prism-cyan/50 bg-noir flex items-center justify-center font-landing-mono text-xl font-bold text-prism-cyan shadow-[0_0_16px_rgba(0,255,204,0.4)]"
                aria-hidden
              >
                {item.step}
              </span>
              <div className="text-5xl mb-6 mt-8">{item.icon}</div>
              <h3 className="font-landing-display text-xl text-prism-cyan mb-4">{item.title}</h3>
              <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
        {/* Identity Containers callout — under the 3 steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-[900px] mx-auto mt-16 p-8 text-center crystal-glass-prism border border-prism-cyan/25"
        >
          <div className="crystal-corner-prism-tl" />
          <div className="crystal-corner-prism-tr" />
          <div className="crystal-corner-prism-bl" />
          <div className="crystal-corner-prism-br" />
          <div className="font-landing-display text-xl md:text-2xl mb-4 text-prism-cyan">
            🎭 Identity Containers with Cryptographic Context Bindings
          </div>
          <p className="text-lg text-ghost/90 font-landing-body leading-relaxed">
            Each context is a tamper-proof container where your identity, proofs, and encrypted data are cryptographically bound together. Your DeFi context can&apos;t leak into your social context. Your voting context can&apos;t access your trading history.{' '}
            <strong className="text-prism-amber">True compartmentalization at the protocol level.</strong>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
