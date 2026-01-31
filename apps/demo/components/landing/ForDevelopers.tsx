import { motion } from 'framer-motion';
import Link from 'next/link';
import { HoloPanel, HoloButton } from '../ui';

const bullets = [
  'Portable reputation – Same credentials work across apps; each app sees only what you prove',
  'One SDK, many use cases – Voting, gating, dark pools, wallet protection, and more',
  'Simple API – Identity, contexts, proofs, encryption',
  'Open source – MIT license',
  'Composable – Works with existing Solana apps',
];

export function ForDevelopers() {
  return (
    <section className="relative py-20 px-6" id="for-developers">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-cyan-400 mb-4 font-mono"
        >
          For Developers
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-white/80 mb-6"
        >
          Install from npm: <code className="text-cyan-400 font-mono text-sm">@prism-protocol/sdk</code>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="elevated" size="lg" className="mb-6">
            <pre className="bg-black/50 rounded-lg p-4 text-cyan-200/90 text-xs md:text-sm font-mono overflow-x-auto border border-cyan-400/20">
{`npm install @prism-protocol/sdk

import { PrismProtocol, ContextType } from '@prism-protocol/sdk';

const prism = new PrismProtocol({ rpcUrl: '...', wallet });
await prism.initialize();
const context = await prism.createContext({ type: ContextType.DeFi, maxPerTransaction: 1_000_000_000n });
const proof = await prism.generateSolvencyProof({ actualBalance: 500_000_000n, threshold: 100_000_000n });
// Use proof for voting, gating, dark pool access, etc.`}
            </pre>
          </HoloPanel>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <HoloPanel variant="floating" size="md">
            <h3 className="text-fuchsia-300 font-semibold mb-3">Why use Prism</h3>
            <ul className="space-y-2 text-sm text-white/80">
              {bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  {b}
                </li>
              ))}
            </ul>
          </HoloPanel>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-6 flex flex-wrap gap-4"
        >
          <Link href="https://github.com/yourusername/prism-protocol" target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
            <a>
              <HoloButton variant="primary" size="md">
                GitHub
              </HoloButton>
            </a>
          </Link>
          <Link href="/demo" passHref legacyBehavior>
            <a>
              <HoloButton variant="ghost" size="md">
                Try the Demo
              </HoloButton>
            </a>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
