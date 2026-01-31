import { motion } from 'framer-motion';
import { HoloPanel } from '../ui';

const innovations = [
  {
    title: 'Context-Based Identities',
    code: `Root Identity (Hidden)
└── Context (DeFi, Social, Gaming, etc.)
    ├── Fresh wallet address (PDA)
    ├── Spending limits enforced
    └── Burns after use`,
    why: 'Main wallet never exposed to apps, pools, or other parties.',
  },
  {
    title: 'Noir ZK Solvency Proofs',
    code: `fn verify_solvency(
  actual_balance: Field,  // Private: $500K
  threshold: pub Field    // Public: $10K
) -> pub bool {
  actual_balance >= threshold
}`,
    why: 'Selective disclosure - prove what\'s needed, hide what\'s not.',
  },
  {
    title: 'Arcium MPC Encryption',
    code: `const encrypted = await arcium.encrypt({
  balance: wallet.balance,
  context: contextPubkey
});
const proof = await noir.prove(encrypted, threshold);`,
    why: 'End-to-end encryption ensures even proof generation is private.',
  },
];

export function KeyInnovations() {
  return (
    <section className="relative py-20 px-6" id="key-innovations">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-prism-violet mb-10 font-landing-display holo-heading-glow"
        >
          Key Innovations (MVP Scope)
        </motion.h2>
        <div className="space-y-8">
          {innovations.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <HoloPanel variant="elevated" size="lg" className="border-prism-cyan/20">
                <h3 className="text-prism-cyan font-semibold text-lg mb-3">{item.title}</h3>
                <div className="holo-terminal-prism rounded-lg mb-3 overflow-hidden">
                  <pre className="bg-noir/50 p-4 text-prism-cyan/90 text-xs md:text-sm font-landing-mono overflow-x-auto m-0 relative z-10">
                    {item.code}
                  </pre>
                </div>
                <p className="text-ghost/80 text-sm font-landing-body">
                  <strong className="text-prism-cyan">Why it matters:</strong> {item.why}
                </p>
              </HoloPanel>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
