import { motion } from 'framer-motion';
import Link from 'next/link';
import { HoloPanel, HoloButton } from '../ui';

const useCases = [
  { title: 'Anonymous DAO voting', desc: 'Vote without revealing token holdings' },
  { title: 'Wallet drain protection', desc: 'Disposable contexts with low limits for unknown sites' },
  { title: 'Token gating', desc: 'Prove "hold ≥ N tokens" without revealing amount' },
  { title: 'Private DeFi', desc: 'Trade without linking to main wallet' },
  { title: 'Social / professional', desc: 'Contexts for different identities and limits' },
];

export function UseCases() {
  return (
    <section className="relative py-20 px-6" id="use-cases">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-cyan-400 mb-4 font-mono"
        >
          Use Cases (SDK-Powered)
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white/80 mb-6"
        >
          The Prism SDK supports many use cases; the demo app showcases dark pool trading.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="floating" size="lg" className="mb-6">
            <h3 className="text-fuchsia-300 font-semibold mb-2">Demo: Dark Pool Trading</h3>
            <p className="text-white/80 text-sm mb-4">
              Connect wallet → Create context → Generate ZK solvency proof → Access pool → Execute trade → Burn context. Main wallet never exposed.
            </p>
            <Link href="/demo" passHref legacyBehavior>
              <a>
                <HoloButton variant="secondary" size="md">
                  Try the Demo
                </HoloButton>
              </a>
            </Link>
          </HoloPanel>
        </motion.div>
        <div className="grid gap-3 md:grid-cols-2">
          {useCases.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <HoloPanel variant="default" size="md" className="h-full">
                <h3 className="text-cyan-300 font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-white/70 text-xs">{item.desc}</p>
              </HoloPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
