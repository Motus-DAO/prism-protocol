import type { AppProps } from 'next/app';
import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function App({ Component, pageProps }: AppProps) {
  // Configure Solana network
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);
  
  // Configure wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect
        onError={(error) => {
          // Silently handle user rejection errors (normal when user cancels)
          if (error.name === 'WalletConnectionError' && 
              error.message?.includes('User rejected')) {
            // User cancelled - this is expected behavior, don't log as error
            return;
          }
          // Log other wallet errors
          console.error('Wallet error:', error);
        }}
      >
        <WalletModalProvider>
          <Component {...pageProps} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
