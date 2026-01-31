import { motion } from 'framer-motion';
import Link from 'next/link';
import { HoloPanel, HoloButton } from '../ui';

export function DarkPoolSection() {
  return (
    <section className="relative py-20 px-6" id="dark-pool">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-cyan-400 mb-4 font-mono"
        >
          Why the Dark Pool Use Case Matters on Solana
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="elevated" size="lg">
            <p className="text-white/90 mb-4">
              <strong className="text-white">The dark pool dilemma:</strong> Large traders need to prove solvency to access private venues—but revealing holdings invites front-running and worse execution. In TradFi, dark pools hide orders before execution. <strong className="text-cyan-300">On Solana, everything is public:</strong> even after a trade, balances and history are visible. True dark-pool-style privacy doesn&apos;t exist on-chain yet.
            </p>
            <p className="text-white/90 mb-6">
              <strong className="text-fuchsia-300">What Prism does:</strong> We bridge that gap. Create a disposable context, generate a ZK solvency proof (&quot;balance ≥ $10K&quot;), access the pool without exposing your real balance, then burn the context. Same primitives work for voting, gating, and other use cases.
            </p>
            <Link href="/demo" passHref legacyBehavior>
              <a>
                <HoloButton variant="primary" size="md">
                  Try the Dark Pool Demo
                </HoloButton>
              </a>
            </Link>
          </HoloPanel>
        </motion.div>
      </div>
    </section>
  );
}
