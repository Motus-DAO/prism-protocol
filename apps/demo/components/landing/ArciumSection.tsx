import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

export function ArciumSection() {
  return (
    <section className="relative py-20 px-6" id="arcium">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-fuchsia-400 mb-4 font-mono"
        >
          Arcium MPC Integration
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="floating" size="lg">
            <p className="text-white/90 mb-4">
              <strong className="text-cyan-300">Prism Protocol is the first stack</strong> to combine Arcium MPC encryption with Noir ZK proofs and Solana contexts.
            </p>
            <p className="text-white/90 mb-4">
              Each encrypted balance is <strong className="text-white">cryptographically bound</strong> to a disposable context identity. The dark pool sees only:
            </p>
            <ul className="list-disc list-inside text-white/80 space-y-2 mb-4">
              <li>A commitment hash (from Arcium)</li>
              <li>A ZK proof (from Noir)</li>
              <li>A context address (from Solana)</li>
            </ul>
            <p className="text-cyan-300 font-semibold">
              The actual balance and root wallet remain completely hidden.
            </p>
          </HoloPanel>
        </motion.div>
      </div>
    </section>
  );
}
