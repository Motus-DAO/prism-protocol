import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

export function WhyWeExist() {
  return (
    <section className="relative py-20 px-6" id="why-we-exist">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-fuchsia-400 mb-4 font-mono"
        >
          Why Prism Exists
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="floating" size="lg">
            <p className="text-white/90 mb-4">
              <strong className="text-white">The broader problem:</strong> You either use one wallet everywhere (everything linked, no privacy) or many wallets (no portable reputation). To prove you&apos;re qualified, you usually have to expose more than needed—your full balance, history, or identity.
            </p>
            <p className="text-white/90">
              <strong className="text-cyan-300">Prism&apos;s approach:</strong> One root identity, many <strong>contexts</strong> per app. You <strong>prove credentials</strong> (e.g. &quot;balance ≥ threshold,&quot; &quot;member,&quot; &quot;qualified&quot;) via ZK proofs—so you <strong>keep your reputation across apps</strong> without revealing your full activity, assets, or online identity.
            </p>
          </HoloPanel>
        </motion.div>
      </div>
    </section>
  );
}
