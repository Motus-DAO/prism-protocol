'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HoloLink } from '../ui';

const NPM_CMD = 'npm install @prism-protocol/sdk';

export function CodeSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(NPM_CMD).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="code" className="relative py-20 sm:py-28 px-6 bg-noir">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-amber mb-4">Developer Experience</p>
        <h2 className="font-landing-display font-bold text-3xl md:text-4xl mb-4 text-ghost holo-heading-glow">
          Five lines to privacy
        </h2>
        <p className="max-w-[700px] text-ghost/70 mb-8 font-landing-body">
          Install from npm. Import the SDK. Create a context. Generate a proof. You&apos;re building privacy-preserving apps.
        </p>
        {/* Bash: npm install - copyable */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-[600px] mx-auto mt-8 mb-6 rounded-xl overflow-hidden holo-terminal-prism"
        >
          <div className="bg-concrete/80 px-6 py-3 border-b border-prism-cyan/30 flex justify-between items-center font-landing-mono text-sm">
            <span>📦 Install via npm</span>
            <button
              type="button"
              onClick={handleCopy}
              className={`px-3 py-1.5 text-xs font-landing-mono uppercase tracking-wider border rounded-lg transition-all ${
                copied
                  ? 'border-prism-amber text-prism-amber bg-prism-amber/10'
                  : 'border-prism-cyan/50 text-prism-cyan hover:bg-prism-cyan/10 hover:shadow-[0_0_12px_rgba(0,255,204,0.2)]'
              }`}
              aria-label="Copy npm install command"
            >
              {copied ? 'COPIED!' : 'COPY'}
            </button>
          </div>
          <pre className="p-4 md:p-6 overflow-x-auto font-landing-mono text-sm md:text-base leading-relaxed bg-noir/60 m-0 relative z-10">
            <code className="text-prism-cyan" title={NPM_CMD}>
              {NPM_CMD}
            </code>
          </pre>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-xl overflow-hidden mt-8 holo-terminal-prism"
        >
          <div className="bg-concrete/80 px-6 py-4 border-b border-prism-cyan/30 flex justify-between items-center font-landing-mono text-sm">
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-warning-red" />
              <span className="w-3 h-3 rounded-full bg-prism-amber" />
              <span className="w-3 h-3 rounded-full bg-prism-cyan" />
            </div>
            <span>dark-pool-trading.ts</span>
          </div>
          <pre className="p-6 md:p-8 overflow-x-auto font-landing-mono text-sm md:text-base leading-loose bg-noir/60 relative z-10">
            <code>
              <span className="text-prism-violet">import</span>{' '}
              <span className="text-prism-cyan">&#123; PrismProtocol, ContextType &#125;</span>{' '}
              <span className="text-prism-violet">from</span>{' '}
              <span className="text-prism-amber">&apos;@prism-protocol/sdk&apos;</span>;
              {'\n\n'}
              <span className="text-ghost/50 italic">// Initialize with your wallet</span>
              {'\n'}
              <span className="text-prism-violet">const</span> prism ={' '}
              <span className="text-prism-violet">new</span>{' '}
              <span className="text-prism-cyan">PrismProtocol</span>(&#123;{' '}
              {'\n  '}rpcUrl: <span className="text-prism-amber">&apos;https://api.devnet.solana.com&apos;</span>,{' '}
              {'\n  '}wallet{' \n'}&#125;);
              {'\n'}
              <span className="text-prism-violet">await</span> prism.
              <span className="text-prism-cyan">initialize</span>();
              {'\n\n'}
              <span className="text-ghost/50 italic">// Create a disposable DeFi context</span>
              {'\n'}
              <span className="text-prism-violet">const</span> context ={' '}
              <span className="text-prism-violet">await</span> prism.
              <span className="text-prism-cyan">createContext</span>(&#123;{' '}
              {'\n  '}type: <span className="text-prism-cyan">ContextType</span>.DeFi,{' '}
              {'\n  '}maxPerTransaction: <span className="text-prism-amber">1_000_000_000n</span>{' '}
              <span className="text-ghost/50 italic">// 1 SOL limit</span>
              {'\n'}&#125;);
              {'\n\n'}
              <span className="text-ghost/50 italic">// Generate ZK solvency proof (balance stays encrypted)</span>
              {'\n'}
              <span className="text-prism-violet">const</span> proof ={' '}
              <span className="text-prism-violet">await</span> prism.
              <span className="text-prism-cyan">generateSolvencyProof</span>(&#123;{' '}
              {'\n  '}actualBalance: <span className="text-prism-amber">500_000_000n</span>,{' '}
              <span className="text-ghost/50 italic">// Your real balance (private)</span>
              {'\n  '}threshold: <span className="text-prism-amber">100_000_000n</span>{' '}
              <span className="text-ghost/50 italic">// Pool minimum (public)</span>
              {'\n'}&#125;);
              {'\n\n'}
              <span className="text-ghost/50 italic">// Access dark pool with proof (balance never revealed)</span>
              {'\n'}
              <span className="text-prism-violet">await</span> darkPool.
              <span className="text-prism-cyan">verifyAndGrant</span>(proof);
              {'\n\n'}
              <span className="text-ghost/50 italic">// Trade complete? Burn the context</span>
              {'\n'}
              <span className="text-prism-violet">await</span> prism.
              <span className="text-prism-cyan">revokeContext</span>(context.pubkey);
              {'\n'}
              <span className="text-ghost/50 italic">// Your main wallet was never exposed</span>
            </code>
          </pre>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-wrap gap-4 justify-center mt-12"
        >
          <HoloLink
            href="https://www.npmjs.com/package/@prism-protocol/sdk"
            variant="prism"
            size="lg"
            external
            className="font-landing-mono text-sm uppercase tracking-wider"
          >
            View on NPM →
          </HoloLink>
          <HoloLink
            href="https://github.com/Motus-DAO/prism-protocol/tree/main/packages/sdk"
            variant="prismOutline"
            size="lg"
            external
            className="font-landing-mono text-sm uppercase tracking-wider"
          >
            Read the Docs
          </HoloLink>
          <HoloLink
            href="/demo"
            variant="prismOutline"
            size="lg"
            className="font-landing-mono text-sm uppercase tracking-wider"
          >
            Try the Demo
          </HoloLink>
        </motion.div>
      </div>
    </section>
  );
}
