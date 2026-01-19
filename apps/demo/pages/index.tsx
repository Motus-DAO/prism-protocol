import { motion } from 'framer-motion';
import Head from 'next/head';
import { DarkPoolDemo } from '../components/prism/DarkPoolDemo';

export default function Home() {
  return (
    <>
      <Head>
        <title>Prism Protocol - Dark Pool Demo</title>
        <meta name="description" content="Privacy infrastructure for anonymous trading on Solana" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-[#0B101A] relative overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          {/* Primary radial gradient */}
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-fuchsia-500/10" />
          
          {/* Animated orbs */}
          <motion.div
            animate={{
              x: [0, 100, -50, 0],
              y: [0, -50, 100, 0],
              scale: [1, 1.2, 0.8, 1]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          />
          
          <motion.div
            animate={{
              x: [0, -100, 50, 0],
              y: [0, 50, -100, 0],
              scale: [1, 0.8, 1.2, 1]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl"
          />

          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Scan Line Effect */}
        <motion.div
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-50"
        />

        {/* Main Content */}
        <DarkPoolDemo />

        {/* Footer */}
        <footer className="fixed bottom-4 left-0 right-0 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-white/30 text-sm font-mono"
          >
            Prism Protocol v0.1.0 | Solana Privacy Hackathon 2026
          </motion.p>
        </footer>
      </main>
    </>
  );
}
