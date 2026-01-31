'use client';

import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const contexts = [
  { label: 'DeFi', short: 'DeFi' },
  { label: 'Social', short: 'Social' },
  { label: 'Voting', short: 'Voting' },
];

export function HowItWorksFlowSection() {
  return (
    <section id="how-it-works-flow" className="relative py-20 sm:py-28 px-6">
      <div className="max-w-[1000px] mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-violet mb-4"
        >
          Developer Experience
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-landing-display font-bold text-3xl md:text-4xl mb-4 text-ghost holo-heading-glow"
        >
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-ghost/70 font-landing-body mb-12 max-w-[640px]"
        >
          One root identity. Disposable contexts. ZK proofs. MPC encryption. See the flow below.
        </motion.p>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="space-y-8"
        >
          {/* Step 1: Root → Contexts */}
          <motion.div variants={item} className="relative">
            <div className="relative holo-card-prism p-6 md:p-8 border border-prism-cyan/25 overflow-visible">
              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                <div className="flex flex-col items-center mb-6 md:mb-0 md:min-w-[200px]">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="w-16 h-16 rounded-xl border-2 border-prism-cyan/50 bg-noir flex items-center justify-center font-landing-mono text-2xl font-bold text-prism-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]"
                  >
                    One
                  </motion.div>
                  <div className="text-center mt-2 font-landing-mono text-xs uppercase tracking-wider text-prism-cyan/80">
                    Root Identity
                  </div>
                  {/* Connector line to contexts */}
                  <div className="hidden md:block w-px h-8 bg-gradient-to-b from-prism-cyan/40 to-transparent" />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3 mt-4 md:mt-2"
                  >
                    {contexts.map((ctx, i) => (
                      <span
                        key={ctx.label}
                        className="px-3 py-1.5 rounded-lg border border-prism-violet/40 bg-prism-violet/10 font-landing-mono text-xs text-prism-cyan"
                      >
                        {ctx.short}
                      </span>
                    ))}
                  </motion.div>
                </div>
                <div className="flex-1">
                  <h3 className="font-landing-display text-xl text-prism-cyan mb-2">
                    Create a root identity, then derive disposable contexts
                  </h3>
                  <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">
                    Your DeFi context is isolated from your social context. Your voting context
                    can&apos;t access your trading history.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div
            variants={item}
            className="flex justify-center text-prism-cyan/50"
            aria-hidden
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-90 md:rotate-0">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* Step 2: ZK Proof */}
          <motion.div variants={item} className="relative">
            <div className="relative holo-card-prism p-6 md:p-8 border border-prism-cyan/25">
              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                <div className="flex flex-col items-center mb-6 md:mb-0 md:min-w-[200px]">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="w-16 h-16 rounded-xl border-2 border-prism-cyan/50 bg-noir flex items-center justify-center font-landing-mono text-2xl font-bold text-prism-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]"
                  >
                    Two
                  </motion.div>
                  <div className="text-center mt-2 font-landing-mono text-xs uppercase tracking-wider text-prism-cyan/80">
                    ZK Proof
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-landing-display text-xl text-prism-cyan mb-2">
                    Generate zero-knowledge proofs with Noir circuits
                  </h3>
                  <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">
                    Prove &quot;balance ≥ threshold&quot; without revealing the amount.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div
            variants={item}
            className="flex justify-center text-prism-cyan/50"
            aria-hidden
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-90 md:rotate-0">
              <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>

          {/* Step 3: Arcium encryption */}
          <motion.div variants={item} className="relative">
            <div className="relative holo-card-prism p-6 md:p-8 border border-prism-cyan/25">
              <div className="flex flex-col md:flex-row md:items-start md:gap-8">
                <div className="flex flex-col items-center mb-6 md:mb-0 md:min-w-[200px]">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    className="w-16 h-16 rounded-xl border-2 border-prism-cyan/50 bg-noir flex items-center justify-center font-landing-mono text-2xl font-bold text-prism-cyan shadow-[0_0_20px_rgba(0,255,204,0.3)]"
                  >
                    Three
                  </motion.div>
                  <div className="text-center mt-2 font-landing-mono text-xs uppercase tracking-wider text-prism-cyan/80">
                    Arcium MPC
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-landing-display text-xl text-prism-cyan mb-2">
                    Encrypt with Arcium MPC
                  </h3>
                  <p className="text-ghost/80 font-landing-body text-sm leading-relaxed">
                    Balance commitments are cryptographically bound to contexts.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Result: All three together */}
          <motion.div
            variants={item}
            className="relative pt-4"
          >
            <div className="relative crystal-glass-prism border border-prism-cyan/30 p-8 text-center">
              <div className="crystal-corner-prism-tl" />
              <div className="crystal-corner-prism-tr" />
              <div className="crystal-corner-prism-bl" />
              <div className="crystal-corner-prism-br" />
              <p className="font-landing-display text-2xl md:text-3xl font-bold text-prism-cyan mb-2 holo-heading-glow">
                The result?
              </p>
              <p className="text-xl text-ghost font-landing-body">
                True privacy at the protocol level.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6">
                <span className="px-4 py-2 rounded-lg border border-prism-cyan/30 bg-prism-cyan/5 font-landing-mono text-sm text-prism-cyan">
                  Root → Contexts
                </span>
                <span className="px-4 py-2 rounded-lg border border-prism-cyan/30 bg-prism-cyan/5 font-landing-mono text-sm text-prism-cyan">
                  Noir ZK
                </span>
                <span className="px-4 py-2 rounded-lg border border-prism-cyan/30 bg-prism-cyan/5 font-landing-mono text-sm text-prism-cyan">
                  Arcium MPC
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
