import Head from 'next/head';
import {
  LandingBackground,
  LandingNav,
  Hero,
  WhyDevelopersChoosePrism,
  HowItWorksFlowSection,
  ProblemSection,
  SolutionSection,
  UseCasesSection,
  CodeSection,
  TechStackSection,
  HackathonSection,
  OpenSourceSection,
  LandingFooter,
} from '../components/landing';

/** Page order per Noir-style analysis: Hero+code → Why Prism → Problem → Solution → Use Cases → Code → Tech → Hackathon → Open Source → Footer */
export default function Home() {
  return (
    <>
      <Head>
        <title>Prism Protocol - Privacy Infrastructure for Solana</title>
        <meta
          name="description"
          content="Private. Provable. Isolated. The first privacy SDK for Solana. Disposable identities, ZK proofs, and encrypted contexts—trade, vote, and transact without revealing who you are or what you hold."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-noir text-ghost font-landing-body overflow-x-hidden">
        <LandingBackground />
        <LandingNav />
        <main>
          <Hero />
          <WhyDevelopersChoosePrism />
          <HowItWorksFlowSection />
          <ProblemSection />
          <SolutionSection />
          <UseCasesSection />
          <CodeSection />
          <TechStackSection />
          <HackathonSection />
          <OpenSourceSection />
          <LandingFooter />
        </main>
      </div>
    </>
  );
}
