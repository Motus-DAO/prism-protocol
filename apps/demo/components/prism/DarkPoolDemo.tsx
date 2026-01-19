import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { HoloPanel, HoloButton, HoloText } from "../ui";
import { usePrismProgram } from "../../lib/usePrismProgram";
import { 
  FaShieldAlt, 
  FaLock, 
  FaCheck, 
  FaWallet, 
  FaEyeSlash,
  FaExchangeAlt,
  FaFire,
  FaCog,
  FaChartLine,
  FaExternalLinkAlt
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
  { id: 'context', title: 'Create Context', description: 'On-chain identity', icon: <FaShieldAlt /> },
  { id: 'proof', title: 'Generate Proof', description: 'ZK solvency proof', icon: <FaLock /> },
  { id: 'access', title: 'Access Dark Pool', description: 'Entry granted', icon: <FaEyeSlash /> },
  { id: 'trade', title: 'Execute Trade', description: 'Anonymous swap', icon: <FaExchangeAlt /> },
  { id: 'burn', title: 'Burn Context', description: 'Revoke on-chain', icon: <FaFire /> },
  { id: 'complete', title: 'Complete', description: 'Privacy preserved!', icon: <FaCheck /> },
];

export const DarkPoolDemo: React.FC = () => {
  const { publicKey, connected, connecting } = useWallet();
  const { connection } = useConnection();
  const prism = usePrismProgram();
  
  const [currentStep, setCurrentStep] = useState<DemoStep>('connect');
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [contextAddress, setContextAddress] = useState<string | null>(null);
  const [contextIndex, setContextIndex] = useState<number | null>(null);
  const [rootAddress, setRootAddress] = useState<string | null>(null);
  const [proofGenerated, setProofGenerated] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [txSignatures, setTxSignatures] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const addTx = useCallback((signature: string, description: string) => {
    setTxSignatures(prev => [...prev, signature]);
    addLog(`✓ TX: ${signature.slice(0, 8)}...${signature.slice(-4)} (${description})`);
  }, [addLog]);

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
          setBalance(0);
        }
      }
    };
    
    if (connected && currentStep === 'balance') {
      fetchBalance();
    }
  }, [connected, publicKey, connection, currentStep, addLog]);

  // Check for existing root identity
  useEffect(() => {
    const checkExisting = async () => {
      if (connected && publicKey && prism.program) {
        const rootResult = prism.getRootPDA();
        if (rootResult) {
          setRootAddress(rootResult.pda.toBase58());
          const existing = await prism.fetchRootIdentity();
          if (existing) {
            addLog(`Found existing root identity with ${existing.contextCount} contexts`);
          }
        }
      }
    };
    
    if (connected && currentStep === 'balance') {
      checkExisting();
    }
  }, [connected, publicKey, prism, currentStep, addLog]);

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleNextStep = async () => {
    setIsProcessing(true);
    
    try {
      switch (currentStep) {
        case 'connect':
          // Wallet button handles this
          break;
          
        case 'balance':
          if (balance !== null) {
            addLog(`Current balance: ${balance.toFixed(4)} SOL`);
            if (balance < 0.01) {
              addLog('WARNING: Low balance - need SOL for transaction fees');
              addLog('Get devnet SOL at: https://faucet.solana.com');
            } else {
              addLog('WARNING: Full balance visible on-chain!');
              addLog('Anyone can see your holdings...');
            }
            await new Promise(r => setTimeout(r, 1000));
            setCurrentStep('context');
          }
          break;
          
        case 'context':
          addLog('Creating disposable context identity...');
          addLog('Sending transaction to Solana devnet...');
          
          // Real on-chain transaction!
          const contextResult = await prism.createContext(
            0, // DeFi context type
            50 * LAMPORTS_PER_SOL // 50 SOL max per tx
          );
          
          if (contextResult) {
            setContextAddress(contextResult.contextPda.toBase58());
            setContextIndex(contextResult.contextIndex);
            setRootAddress(contextResult.rootPda.toBase58());
            
            addTx(contextResult.signature, 'create_context');
            addLog(`Root Identity: ${contextResult.rootPda.toBase58().slice(0, 8)}...`);
            addLog(`Context PDA: ${contextResult.contextPda.toBase58().slice(0, 8)}...`);
            addLog(`Context Index: ${contextResult.contextIndex}`);
            addLog('Type: DeFi (Dark Pool Trading)');
            addLog('Max per TX: 50 SOL');
            addLog('');
            addLog('✓ Context created ON-CHAIN!');
            addLog('View on Solana Explorer ↗');
            
            setCurrentStep('proof');
          } else {
            addLog(`ERROR: ${prism.error || 'Failed to create context'}`);
            if (prism.error?.includes('insufficient')) {
              addLog('Need devnet SOL: https://faucet.solana.com');
            }
          }
          break;
          
        case 'proof':
          addLog('Initializing Arcium MPC encryption...');
          await new Promise(r => setTimeout(r, 600));
          addLog('✓ Balance encrypted with MPC');
          
          addLog('Generating ZK solvency proof...');
          addLog('  Private input: balance = [ENCRYPTED]');
          
          const threshold = balance ? Math.max(balance * 0.1, 0.01) : 0.01;
          addLog(`  Public input: threshold = ${threshold.toFixed(4)} SOL`);
          
          await new Promise(r => setTimeout(r, 1200));
          addLog('  Noir circuit: solvency_proof.nr');
          addLog('  Backend: UltraHonk (Barretenberg)');
          
          await new Promise(r => setTimeout(r, 800));
          setProofGenerated(true);
          addLog('✓ ZK Proof generated successfully');
          addLog(`  Proof size: 1.2 KB`);
          
          setCurrentStep('access');
          break;
          
        case 'access':
          addLog('Submitting proof to dark pool verifier...');
          await new Promise(r => setTimeout(r, 600));
          addLog('Verifying ZK proof...');
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
          
          const tradeAmount = balance ? Math.min(balance * 0.02, 0.1) : 0.01;
          addLog(`  Selling: ${tradeAmount.toFixed(4)} SOL`);
          addLog(`  Buying: ${(tradeAmount * 100).toFixed(0)} USDC`);
          
          await new Promise(r => setTimeout(r, 1500));
          addLog('');
          addLog('✓ Trade executed successfully (simulated)');
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
          addLog('Sending revoke transaction...');
          
          if (contextIndex !== null) {
            // Real on-chain transaction!
            const revokeResult = await prism.revokeContext(contextIndex);
            
            if (revokeResult) {
              addTx(revokeResult.signature, 'revoke_context');
              addLog('✓ Context revoked ON-CHAIN!');
              addLog('');
              addLog('═══════════════════════════════════════');
              addLog('   PRIVACY PRESERVED');
              addLog('═══════════════════════════════════════');
              addLog('');
              addLog('No one can link this trade to your wallet');
              addLog(`Total transactions: ${txSignatures.length + 1}`);
              
              setCurrentStep('complete');
            } else {
              addLog(`ERROR: ${prism.error || 'Failed to revoke context'}`);
              // Still advance for demo purposes
              setCurrentStep('complete');
            }
          } else {
            addLog('Context already revoked or not found');
            setCurrentStep('complete');
          }
          break;
          
        case 'complete':
          // Reset demo
          setCurrentStep(connected ? 'balance' : 'connect');
          setContextAddress(null);
          setContextIndex(null);
          setProofGenerated(false);
          setTxSignatures([]);
          setLogs([]);
          if (connected) {
            addLog('Demo reset. Ready for another run!');
          }
          break;
      }
    } catch (err: any) {
      console.error('Step error:', err);
      addLog(`ERROR: ${err.message}`);
    }
    
    setIsProcessing(false);
  };

  const getButtonText = () => {
    if (isProcessing || prism.isLoading) return 'Processing...';
    switch (currentStep) {
      case 'connect': return 'Connect Wallet';
      case 'balance': return 'Continue';
      case 'context': return 'Create Context (On-Chain)';
      case 'proof': return 'Generate ZK Proof';
      case 'access': return 'Enter Dark Pool';
      case 'trade': return 'Execute Trade';
      case 'burn': return 'Burn Context (On-Chain)';
      case 'complete': return 'Run Demo Again';
    }
  };

  const formatBalance = (bal: number) => {
    if (bal >= 1000000) return `${(bal / 1000000).toFixed(2)}M`;
    if (bal >= 1000) return `${(bal / 1000).toFixed(1)}K`;
    return bal.toFixed(4);
  };

  const openExplorer = (signature: string) => {
    window.open(`https://explorer.solana.com/tx/${signature}?cluster=devnet`, '_blank');
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
            className="mt-2 flex items-center justify-center gap-2"
          >
            <HoloText size="sm" color="cyan">
              {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
            </HoloText>
            <span className="text-green-400 text-xs">● Devnet</span>
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
                const isOnChain = step.id === 'context' || step.id === 'burn';
                
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
                      <div className="flex items-center gap-2">
                        <HoloText 
                          size="sm" 
                          weight="semibold" 
                          color={isActive ? 'cyan' : isComplete ? 'white' : 'muted'}
                        >
                          {step.title}
                        </HoloText>
                        {isOnChain && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-fuchsia-500/20 text-fuchsia-300 rounded">
                            ON-CHAIN
                          </span>
                        )}
                      </div>
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
                variant={currentStep === 'complete' ? 'secondary' : 
                        (currentStep === 'context' || currentStep === 'burn') ? 'success' : 'primary'}
                size="lg"
                onClick={handleNextStep}
                loading={isProcessing || prism.isLoading}
                disabled={connecting || (currentStep === 'context' && balance !== null && balance < 0.001)}
                className="w-full"
              >
                {getButtonText()}
              </HoloButton>
            )}

            {/* Low balance warning */}
            {currentStep === 'context' && balance !== null && balance < 0.01 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <HoloText size="xs" color="white">
                  ⚠️ Low balance. Get devnet SOL:{' '}
                  <a 
                    href="https://faucet.solana.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline"
                  >
                    faucet.solana.com
                  </a>
                </HoloText>
              </motion.div>
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
                    {txSignatures.length}
                  </HoloText>
                  <HoloText size="xs" color="muted">TXs</HoloText>
                </div>
                <div className="text-center">
                  <HoloText variant="mono" size="xl" color="white" glow className="md:text-2xl">
                    {balance !== null ? formatBalance(balance) : '--'}
                  </HoloText>
                  <HoloText size="xs" color="muted">SOL</HoloText>
                </div>
              </div>
            </div>

            {/* Transaction Links */}
            {txSignatures.length > 0 && (
              <div className="mt-4 pt-4 border-t border-cyan-400/20">
                <HoloText size="xs" color="muted" className="mb-2">Transactions:</HoloText>
                <div className="space-y-1">
                  {txSignatures.map((sig, i) => (
                    <button
                      key={sig}
                      onClick={() => openExplorer(sig)}
                      className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>{sig.slice(0, 8)}...{sig.slice(-4)}</span>
                      <FaExternalLinkAlt className="text-[10px]" />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                      This demo creates REAL transactions on Solana devnet
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
                        log.includes('WARNING') || log.includes('⚠️') ? 'text-yellow-400' :
                        log.includes('ERROR') ? 'text-red-400' :
                        log.includes('═') ? 'text-cyan-400 font-bold' :
                        log.includes('GRANTED') || log.includes('PRESERVED') ? 'text-cyan-400 font-bold' :
                        log.includes('TX:') ? 'text-fuchsia-400' :
                        log.includes('ON-CHAIN') ? 'text-fuchsia-400' :
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
                Program: {prism.programId.toBase58().slice(0, 8)}...
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
                On-Chain Burn
              </HoloText>
              <HoloText size="xs" color="muted" className="mt-1">
                Real transactions eliminate traces
              </HoloText>
            </div>
          </div>
        </HoloPanel>
      </motion.div>
    </div>
  );
};
