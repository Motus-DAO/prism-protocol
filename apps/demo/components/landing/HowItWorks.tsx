import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

const steps = [
  { title: 'Connect', desc: 'Connect your wallet (root identity stays off-screen).' },
  { title: 'Create context', desc: 'Derive a disposable context (fresh address) for this app or use case.' },
  { title: 'Generate proof', desc: 'Prove a credential (e.g. "balance ≥ threshold") without revealing the amount (Noir ZK + Arcium encryption).' },
  { title: 'Access / trade', desc: 'Use the context and proof to access the pool (or vote, gate, etc.); main wallet and full balance never exposed.' },
  { title: 'Burn (optional)', desc: 'Revoke the context after use.' },
];

export function HowItWorks() {
  return (
    <section className="relative py-20 px-6" id="how-it-works">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-prism-cyan mb-4 font-landing-display holo-heading-glow"
        >
          How It Works (Simplified)
        </motion.h2>
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <HoloPanel variant="default" size="md" className="flex items-start gap-4 border-prism-cyan/20">
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-prism-cyan/15 border border-prism-cyan/40 flex items-center justify-center text-prism-cyan font-mono font-bold text-sm shadow-[0_0_12px_rgba(0,255,204,0.2)]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-prism-cyan font-semibold mb-1">{step.title}</h3>
                  <p className="text-ghost/80 text-sm font-landing-body">{step.desc}</p>
                </div>
              </HoloPanel>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-4 text-white/60 text-sm"
        >
          Demo flow: Connect → Create context → Generate proof → Access pool → Trade → Burn.
        </motion.p>
      </div>
    </section>
  );
}
