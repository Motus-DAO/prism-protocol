import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const UserDashboard = dynamic(
  () => import('../components/prism/UserDashboard').then(mod => ({ default: mod.UserDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-cyan-400 font-mono">Loading...</div>
      </div>
    )
  }
);

export default function UserPage() {
  useEffect(() => {
    document.body.classList.add('user-page');
    return () => document.body.classList.remove('user-page');
  }, []);

  return (
    <>
      <Head>
        <title>My Identity – Prism Protocol</title>
        <meta name="description" content="Your root identity and contexts. View and revoke context-bound personas." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-transparent relative">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-fuchsia-500/10" />
          <motion.div
            animate={{ x: [0, 100, -50, 0], y: [0, -50, 100, 0], scale: [1, 1.2, 0.8, 1] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -100, 50, 0], y: [0, 50, -100, 0], scale: [1, 0.8, 1.2, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-3xl"
          />
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

        <motion.div
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="fixed inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none z-50"
        />

        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 bg-noir/90 backdrop-blur-md border-b border-steel">
          <Link href="/" className="font-landing-display text-lg font-bold tracking-tight uppercase bg-gradient-to-r from-prism-cyan to-prism-violet bg-clip-text text-transparent">
            PRISM_PROTOCOL
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-ghost/80 hover:text-prism-cyan transition-colors font-landing-mono uppercase tracking-wider">
              Home
            </Link>
            <Link href="/demo" className="text-sm text-ghost/80 hover:text-prism-cyan transition-colors font-landing-mono uppercase tracking-wider">
              Demo
            </Link>
            <Link href="/dashboard" className="text-sm text-ghost/80 hover:text-prism-cyan transition-colors font-landing-mono uppercase tracking-wider">
              Dashboard
            </Link>
            <span className="text-prism-cyan font-landing-mono text-sm uppercase tracking-wider">My identity</span>
          </div>
        </nav>

        <div className="pt-16 pb-24">
          <UserDashboard />
        </div>

        <footer className="fixed bottom-4 left-0 right-0 text-center z-30">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-white/30 text-sm font-mono"
          >
            Prism Protocol v0.1.0 | My identity
          </motion.p>
        </footer>
      </main>
    </>
  );
}
