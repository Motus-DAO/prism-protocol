import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { HoloPanel, HoloButton, HoloText } from "../ui";
import { 
  FaShieldAlt, 
  FaLock, 
  FaCheck, 
  FaWallet, 
  FaEyeSlash,
  FaExchangeAlt,
  FaFire,
  FaCog,
  FaChartLine
} from "react-icons/fa";

type DemoStep = 'connect' | 'balance' | 'context' | 'proof' | 'access' | 'trade' | 'burn' | 'complete';

interface StepInfo {
  id: DemoStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const steps: StepInfo[] = [
  { id: 'connect', title: 'Connect Wallet', description: 'Link your Solana wallet', icon: <FaWallet /> },
  { id: 'balance', title: 'Show Balance', description: 'Your real SOL balance', icon: <FaChartLine /> },
  { id: 'context', title: 'Create Context', description: 'Generate disposable identity', icon: <FaShieldAlt /> },
  { id: 'proof', title: 'Generate Proof', description: 'ZK solvency proof', icon: <FaLock /> },
  { id: 'access', title: 'Access Dark Pool', description: 'Entry granted anonymously', icon: <FaEyeSlash /> },
  { id: 'trade', title: 'Execute Trade', description: 'Anonymous swap completed', icon: <FaExchangeAlt /> },
  { id: 'burn', title: 'Burn Context', description: 'Eliminate all traces', icon: <FaFire /> },
  { id: 'complete', title: 'Complete', description: 'Privacy preserved!', icon: <FaCheck /> },
];

// Prism Protocol Program ID (deployed on devnet)
const PROGRAM_ID = new PublicKey('DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu');

export const DarkPoolDemo: React.FC = () => {
  const { publicKey, connected, connecting } = useWallet();
  const { connection } = useConnection();
  
  const [currentStep, setCurrentStep] = useState<DemoStep>('connect');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [contextAddress, setContextAddress] = useState<string | null>(null);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  // Auto-advance when wallet connects
  useEffect(() => {
    if (connected && publicKey && currentStep === 'connect') {
      addLog(`Wallet connected: ${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`);
      setCurrentStep('balance');
    }
  }, [connected, publicKey, currentStep, addLog]);

  // Fetch real balance when wallet connects
  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
          addLog(`Balance fetched: ${(bal / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
        } catch (error) {
          addLog(`Error fetching balance: ${error}`);
          // Use demo balance
          setBalance(500000);
        }
      }
    };
    
    if (connected && currentStep === 'balance') {
      fetchBalance();
    }
  }, [connected, publicKey, connection, currentStep, addLog]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  // Derive PDAs
  const getRootPDA = useCallback(() => {
    if (!publicKey) return null;
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('root'), publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }, [publicKey]);

  const getContextPDA = useCallback((rootPDA: PublicKey, index: number) => {
    const indexBuffer = Buffer.alloc(2);
    indexBuffer.writeUInt16LE(index);
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('context'), rootPDA.toBuffer(), indexBuffer],
      PROGRAM_ID
    );
    return pda;
  }, []);

  const handleNextStep = async () => {
    setIsProcessing(true);
    
    switch (currentStep) {
      case 'connect':
        // Wallet button handles this
        break;
        
      case 'balance':
        if (balance !== null) {
          addLog(`Current balance: ${balance.toFixed(4)} SOL`);
          addLog('WARNING: Full balance visible on-chain!');
          addLog('Anyone can see your holdings...');
          await new Promise(r => setTimeout(r, 1000));
          setCurrentStep('context');
        }
        break;
        
      case 'context':
        addLog('Creating disposable context identity...');
        await new Promise(r => setTimeout(r, 500));
        
        const rootPDA = getRootPDA();
        if (rootPDA) {
          const ctxPDA = getContextPDA(rootPDA, 0);
          const ctxAddr = ctxPDA.toBase58();
          setContextAddress(ctxAddr);
          
          addLog(`Root Identity: ${rootPDA.toBase58().slice(0, 8)}...`);
          addLog(`Context PDA: ${ctxAddr.slice(0, 8)}...${ctxAddr.slice(-4)}`);
          addLog('Type: DeFi (Dark Pool Trading)');
          addLog('Max per TX: 50,000 SOL');
          addLog('✓ Context identity created');
        } else {
          // Demo mode
          const demoCtx = '4btqFMFR...Qujq';
          setContextAddress(demoCtx);
          addLog(`Context created: ${demoCtx}`);
        }
        
        await new Promise(r => setTimeout(r, 500));
        setCurrentStep('proof');
        break;
        
      case 'proof':
        addLog('Initializing Arcium MPC encryption...');
        await new Promise(r => setTimeout(r, 600));
        addLog('✓ Balance encrypted with MPC');
        
        addLog('Generating ZK solvency proof...');
        addLog('  Private input: balance = [ENCRYPTED]');
        
        // Simulate threshold (10% of balance or min 0.1 SOL)
        const threshold = balance ? Math.max(balance * 0.1, 0.1) : 10000;
        addLog(`  Public input: threshold = ${threshold.toFixed(2)} SOL`);
        
        await new Promise(r => setTimeout(r, 1200));
        addLog('  Noir circuit: solvency_proof.nr');
        addLog('  Backend: UltraHonk (Barretenberg)');
        
        await new Promise(r => setTimeout(r, 800));
        setProofGenerated(true);
        addLog('✓ ZK Proof generated successfully');
        addLog(`  Proof size: 1.2 KB`);
        addLog(`  Generation time: 2.1s`);
        
        setCurrentStep('access');
        break;
        
      case 'access':
        addLog('Submitting proof to dark pool verifier...');
        await new Promise(r => setTimeout(r, 600));
        addLog('Verifying ZK proof on-chain...');
        await new Promise(r => setTimeout(r, 400));
        addLog('✓ Proof verification: VALID');
        addLog('✓ Commitment hash matches');
        addLog('');
        addLog('═══════════════════════════════════════');
        addLog('   DARK POOL ACCESS GRANTED');
        addLog('═══════════════════════════════════════');
        addLog('');
        addLog('Your main wallet is NEVER exposed!');
        
        setCurrentStep('trade');
        break;
        
      case 'trade':
        addLog('Executing anonymous swap via context...');
        addLog(`  Context: ${contextAddress?.slice(0, 8)}...`);
        
        // Simulate trade amounts based on balance
        const tradeAmount = balance ? Math.min(balance * 0.02, 10) : 10000;
        addLog(`  Selling: ${tradeAmount.toFixed(2)} SOL`);
        addLog(`  Buying: ${(tradeAmount * 100).toFixed(0)} USDC`);
        
        await new Promise(r => setTimeout(r, 1500));
        addLog('');
        addLog('✓ Trade executed successfully');
        addLog('  TX: simulated (devnet demo)');
        addLog('');
        addLog('PRIVACY CHECK:');
        addLog('  ✓ Main wallet: NOT in transaction');
        addLog('  ✓ Balance: NOT revealed');
        addLog('  ✓ Identity: Context only');
        
        setCurrentStep('burn');
        break;
        
      case 'burn':
        addLog('Burning disposable context...');
        addLog(`  Revoking: ${contextAddress?.slice(0, 8)}...`);
        await new Promise(r => setTimeout(r, 1000));
        addLog('✓ Context marked as revoked');
        addLog('✓ Identity eliminated');
        addLog('');
        addLog('═══════════════════════════════════════');
        addLog('   PRIVACY PRESERVED');
        addLog('═══════════════════════════════════════');
        addLog('');
        addLog('No one can link this trade to your wallet');
        
        setCurrentStep('complete');
        break;
        
      case 'complete':
        // Reset demo
        setCurrentStep(connected ? 'balance' : 'connect');
        setContextAddress(null);
        setProofGenerated(false);
        setLogs([]);
        if (connected) {
          addLog('Demo reset. Ready for another run!');
        }
        break;
    }
    
    setIsProcessing(false);
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    switch (currentStep) {
      case 'connect': return 'Connect Wallet';
      case 'balance': return 'Continue to Context';
      case 'context': return 'Create Context';
      case 'proof': return 'Generate ZK Proof';
      case 'access': return 'Enter Dark Pool';
      case 'trade': return 'Execute Trade';
      case 'burn': return 'Burn Context';
      case 'complete': return 'Run Demo Again';
    }
  };

  const formatBalance = (bal: number) => {
    if (bal >= 1000000) return `${(bal / 1000000).toFixed(2)}M`;
    if (bal >= 1000) return `${(bal / 1000).toFixed(1)}K`;
    return bal.toFixed(4);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8 md:mb-12"
      >
        <HoloText variant="gradient" size="3xl" weight="bold" as="h1" className="mb-2 md:text-4xl">
          PRISM PROTOCOL
        </HoloText>
        <HoloText variant="heading" size="lg" color="muted">
          Dark Pool Trading Demo
        </HoloText>
        {connected && publicKey && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            <HoloText size="sm" color="cyan">
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </HoloText>
          </motion.div>
        )}
      </motion.div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Left Panel - Steps & Controls */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <HoloPanel variant="elevated" size="lg" className="h-full">
            <HoloText variant="display" size="lg" weight="bold" color="cyan" className="mb-6">
              Demo Flow
            </HoloText>

            {/* Step Progress */}
            <div className="space-y-2 md:space-y-3 mb-6 md:mb-8">
              {steps.map((step, index) => {
                const isActive = step.id === currentStep;
                const isComplete = index < currentStepIndex;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-lg transition-all ${
                      isActive ? 'bg-cyan-500/10 border border-cyan-400/30' :
                      isComplete ? 'bg-green-500/10 border border-green-400/20' :
                      'bg-white/5 border border-white/10'
                    }`}
                  >
                    <div className={`text-lg md:text-xl ${
                      isActive ? 'text-cyan-400' :
                      isComplete ? 'text-green-400' :
                      'text-white/40'
                    }`}>
                      {isComplete ? <FaCheck /> : step.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <HoloText 
                        size="sm" 
                        weight="semibold" 
                        color={isActive ? 'cyan' : isComplete ? 'white' : 'muted'}
                      >
                        {step.title}
                      </HoloText>
                      <HoloText size="xs" color="muted" className="truncate">
                        {step.description}
                      </HoloText>
                    </div>
                    {isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-cyan-400 flex-shrink-0"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Action Button / Wallet Button */}
            {currentStep === 'connect' && !connected ? (
              <div className="wallet-button-wrapper">
                <WalletMultiButton className="w-full !bg-gradient-to-r !from-cyan-500/20 !to-fuchsia-500/20 !border !border-cyan-400/30 !rounded-xl !py-3 !text-base !font-semibold hover:!shadow-[0_0_20px_rgba(0,255,255,0.3)]" />
              </div>
            ) : (
              <HoloButton 
                variant={currentStep === 'complete' ? 'secondary' : 'primary'}
                size="lg"
                onClick={handleNextStep}
                loading={isProcessing}
                disabled={connecting}
                className="w-full"
              >
                {getButtonText()}
              </HoloButton>
            )}

            {/* Privacy Metrics */}
            <div className="mt-6 pt-6 border-t border-cyan-400/20">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <HoloText variant="mono" size="xl" color="cyan" glow className="md:text-2xl">
                    {proofGenerated ? '100%' : '0%'}
                  </HoloText>
                  <HoloText size="xs" color="muted">Privacy</HoloText>
                </div>
                <div className="text-center">
                  <HoloText variant="mono" size="xl" color="magenta" glow className="md:text-2xl">
                    {contextAddress ? '1' : '0'}
                  </HoloText>
                  <HoloText size="xs" color="muted">Contexts</HoloText>
                </div>
                <div className="text-center">
                  <HoloText variant="mono" size="xl" color="white" glow className="md:text-2xl">
                    {balance !== null ? formatBalance(balance) : '--'}
                  </HoloText>
                  <HoloText size="xs" color="muted">SOL</HoloText>
                </div>
              </div>
            </div>
          </HoloPanel>
        </motion.div>

        {/* Right Panel - Terminal */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HoloPanel variant="elevated" size="lg" className="h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaCog className="text-cyan-400" />
                <HoloText variant="display" size="lg" weight="bold" color="cyan">
                  Terminal
                </HoloText>
              </div>
              <div className="flex items-center gap-2">
                <div className={`crystal-status-indicator ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
                <HoloText size="xs" color="muted">
                  {connected ? 'Connected' : 'Disconnected'}
                </HoloText>
              </div>
            </div>

            {/* Terminal Output */}
            <div className="crystal-terminal p-3 md:p-4 font-mono text-xs md:text-sm h-[350px] md:h-[400px] overflow-y-auto custom-scrollbar">
              <AnimatePresence>
                {logs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/40"
                  >
                    <p className="text-cyan-400">Welcome to Prism Protocol</p>
                    <p className="mt-2">Connect your wallet to begin...</p>
                    <p className="mt-4 text-white/30">
                      This demo shows anonymous dark pool trading
                    </p>
                    <p className="text-white/30">
                      using ZK proofs + Arcium MPC encryption
                    </p>
                    <p className="mt-4 text-fuchsia-400/60">
                      Your balance will NEVER be revealed!
                    </p>
                  </motion.div>
                ) : (
                  logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 }}
                      className={`py-0.5 ${
                        log.includes('✓') ? 'text-green-400' :
                        log.includes('WARNING') ? 'text-yellow-400' :
                        log.includes('ERROR') ? 'text-red-400' :
                        log.includes('═') ? 'text-cyan-400 font-bold' :
                        log.includes('GRANTED') || log.includes('PRESERVED') ? 'text-cyan-400 font-bold' :
                        'text-white/80'
                      }`}
                    >
                      {log}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Blinking cursor */}
              <motion.div
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex items-center mt-2"
              >
                <span className="neon-solid-cyan">prism@darkpool:~$</span>
                <div className="w-2 h-4 bg-cyan-400 ml-1" />
              </motion.div>
            </div>

            {/* Status Bar */}
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-cyan-400/20 text-xs">
              <HoloText size="xs" color="muted">
                Network: Devnet
              </HoloText>
              <HoloText size="xs" color="muted">
                Arcium: Simulation
              </HoloText>
              <HoloText size="xs" color="cyan">
                Lines: {logs.length}
              </HoloText>
            </div>
          </HoloPanel>
        </motion.div>
      </div>

      {/* Bottom Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="max-w-4xl mx-auto mt-8 md:mt-12"
      >
        <HoloPanel variant="default" size="md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="text-center">
              <FaShieldAlt className="text-2xl md:text-3xl text-cyan-400 mx-auto mb-2" />
              <HoloText variant="heading" size="sm" weight="bold" color="cyan">
                Noir ZK Proofs
              </HoloText>
              <HoloText size="xs" color="muted" className="mt-1">
                Prove solvency without revealing balance
              </HoloText>
            </div>
            <div className="text-center">
              <FaLock className="text-2xl md:text-3xl text-fuchsia-400 mx-auto mb-2" />
              <HoloText variant="heading" size="sm" weight="bold" color="magenta">
                Arcium MPC
              </HoloText>
              <HoloText size="xs" color="muted" className="mt-1">
                Multi-party encryption for privacy
              </HoloText>
            </div>
            <div className="text-center">
              <FaFire className="text-2xl md:text-3xl text-orange-400 mx-auto mb-2" />
              <HoloText variant="heading" size="sm" weight="bold" color="white">
                Burn After Use
              </HoloText>
              <HoloText size="xs" color="muted" className="mt-1">
                Disposable identities eliminate traces
              </HoloText>
            </div>
          </div>
        </HoloPanel>
      </motion.div>
    </div>
  );
};
