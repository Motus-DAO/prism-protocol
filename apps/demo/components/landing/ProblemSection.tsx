'use client';

import { motion } from 'framer-motion';

const problems = [
  {
    stat: '$50M+',
    title: 'Lost to MEV Daily',
    body: "Whales can't trade without revealing their holdings. Front-runners feast on visible order flow, extracting millions in value from large traders who have no privacy.",
  },
  {
    stat: '100%',
    title: 'Wallet Exposure',
    body: "Connect to any dApp and it sees your complete balance history, NFT collection, and transaction patterns. Privacy? Non-existent. Every interaction is a full financial disclosure.",
  },
  {
    stat: '0',
    title: 'Anonymous Voting',
    body: "DAOs can't implement anonymous voting without revealing token holdings or reputation. Either you expose your wallet or you can't participate. There's been no middle ground—until now.",
  },
];

export function ProblemSection() {
  return (
    <section id="problem" className="relative py-20 sm:py-28 px-6 bg-gradient-to-b from-transparent via-concrete/50 to-transparent">
      <div className="max-w-[1400px] mx-auto">
        <p className="font-landing-mono text-sm uppercase tracking-[0.2em] text-prism-amber mb-4">The Problem</p>
        <h2 className="font-landing-display font-bold text-3xl md:text-4xl mb-12 text-ghost holo-heading-glow">
          Every Solana transaction exposes your entire financial life
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative p-8 holo-card-prism overflow-visible"
            >
              <div className="crystal-corner-prism-tl" />
              <div className="crystal-corner-prism-br" />
              <span className="font-landing-display text-4xl text-prism-cyan block mb-2" style={{ textShadow: '0 0 20px rgba(0,255,204,0.3)' }}>{item.stat}</span>
              <h3 className="font-landing-display text-xl text-warning-red mb-4">{item.title}</h3>
              <p className="text-ghost/80 font-landing-body text-base leading-relaxed">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
