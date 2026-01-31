'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { HoloLink } from '../ui';

const PrismBackground = dynamic(
  () => import('../ui/Prism').then((m) => m.Prism),
  { ssr: false }
);

export function Hero() {
  return (
    <section className="relative isolate pt-32 pb-20 px-6 min-h-[90vh] flex flex-col justify-center overflow-hidden">
      {/* Black background so only the prism is visible (hides Color Bends in hero) */}
      <div className="absolute inset-0 z-0 min-h-[90vh] bg-black pointer-events-none" aria-hidden />
      {/* Prism background - only in hero */}
      <div
        className="absolute inset-0 z-0 min-h-[90vh] pointer-events-none"
        aria-hidden
      >
        <div className="absolute inset-0 w-full h-full opacity-35">
          <PrismBackground
            animationType="hover"
            transparent
            scale={3.6}
            timeScale={0.5}
            glow={1.2}
            bloom={1}
            noise={0}
            hoverStrength={1.5}
            inertia={0.08}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-block px-4 py-2 mb-6 rounded-xl font-landing-mono text-xs uppercase tracking-[0.15em] text-prism-violet holo-badge"
        >
          Solana Privacy Hackathon 2026
        </motion.div>
        {/* Noir-style: 3-word punch + one-line tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-landing-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight tracking-tight mb-4 holo-heading-glow"
        >
          Private. Provable. Isolated.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-xl sm:text-2xl text-ghost/90 font-light mb-10"
        >
          The first privacy SDK for Solana. Identity refraction/compartmentalization + selective proof toolkit.. 
        </motion.p>
        {/* Mini code snippet in hero (Noir-style: code above the fold) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="w-full max-w-[720px] rounded-xl overflow-hidden holo-terminal-prism border border-prism-cyan/25 mb-6"
        >
          <pre className="p-5 font-landing-mono text-sm sm:text-base leading-relaxed bg-noir/70 m-0 relative z-10 overflow-x-auto whitespace-pre">
            <code>
              <span className="text-prism-violet">import</span>{' '}
              <span className="text-prism-cyan">&#123; PrismProtocol &#125;</span>{' '}
              <span className="text-prism-violet">from</span>{' '}
              <span className="text-prism-amber">&apos;@prism-protocol/sdk&apos;</span>;
              {'\n'}
              <span className="text-prism-violet">const</span> context ={' '}
              <span className="text-prism-violet">await</span> prism.
              <span className="text-prism-cyan">createContext</span>(
              <span className="text-prism-cyan">ContextType</span>.DeFi);
              {'\n'}
              <span className="text-ghost/50">// You&apos;re now trading privately →</span>
            </code>
          </pre>
        </motion.div>
        {/* 2 CTAs only (Noir-style: Get Started + View Demo) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap gap-4"
        >
          <HoloLink href="/#code" variant="prism" size="lg" className="font-landing-mono text-sm uppercase tracking-wider">
            Get Started →
          </HoloLink>
          <HoloLink href="/demo" variant="prismOutline" size="lg" className="font-landing-mono text-sm uppercase tracking-wider">
            View Demo
          </HoloLink>
        </motion.div>
      </div>
    </section>
  );
}
