'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import { HoloPanel, HoloButton } from '../ui';
import { PrismProtocol, ContextType, PrivacyLevel } from '@prism-protocol/sdk';
import {
  FaCopy,
  FaCheck,
  FaCog,
  FaServer,
  FaKey,
  FaShieldAlt,
  FaCode,
  FaSlidersH,
  FaBars,
  FaTimes,
  FaHome,
  FaLock,
  FaList,
  FaUser,
  FaIdBadge,
  FaPlus,
  FaQuestionCircle,
} from 'react-icons/fa';

const LAMPORTS_PER_SOL = 1_000_000_000n;

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const PROGRAM_ID = 'DkD3vtS6K8dJFnGmm9X9CphNDU5LYTYyP8Ve5EEVENdu';

const DASHBOARD_APPS_KEY = 'prism_dashboard_apps';
const DASHBOARD_CURRENT_APP_KEY = 'prism_dashboard_current_app';

function genId(): string {
  return `app_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
function genAppId(): string {
  return `prism_${Math.random().toString(36).slice(2, 14)}`;
}
function genApiKey(): string {
  return `sk_${Math.random().toString(36).slice(2, 18)}${Math.random().toString(36).slice(2, 18)}`;
}

export type AppEnv = 'devnet' | 'mainnet';

export type DashboardApp = {
  id: string;
  name: string;
  env: AppEnv;
  appId: string;
  apiKey: string;
};

let cachedDefaultApps: DashboardApp[] | null = null;

function loadApps(): DashboardApp[] {
  if (typeof window === 'undefined') return [defaultApp()];
  try {
    const raw = localStorage.getItem(DASHBOARD_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardApp[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : cachedDefaultApps ?? [defaultApp()];
    }
    cachedDefaultApps = cachedDefaultApps ?? [defaultApp()];
    return cachedDefaultApps;
  } catch {
    cachedDefaultApps = cachedDefaultApps ?? [defaultApp()];
    return cachedDefaultApps;
  }
}

function defaultApp(): DashboardApp {
  return {
    id: genId(),
    name: 'Demo App',
    env: 'devnet',
    appId: genAppId(),
    apiKey: genApiKey(),
  };
}

function maskValue(val: string | undefined): string {
  if (!val || val.length < 12) return val ? '***' : '—';
  return `${val.slice(0, 6)}...${val.slice(-4)}`;
}

const CONTEXT_TYPE_LABELS: Record<number, string> = {
  [ContextType.DeFi]: 'DeFi',
  [ContextType.Social]: 'Social',
  [ContextType.Gaming]: 'Gaming',
  [ContextType.Professional]: 'Professional',
  [ContextType.Temporary]: 'Temporary',
  [ContextType.Public]: 'Public',
};

const PRIVACY_LEVEL_OPTIONS: { value: number; label: string }[] = [
  { value: PrivacyLevel.Maximum, label: 'Maximum (0)' },
  { value: PrivacyLevel.High, label: 'High (1)' },
  { value: PrivacyLevel.Medium, label: 'Medium (2)' },
  { value: PrivacyLevel.Low, label: 'Low (3)' },
  { value: PrivacyLevel.Public, label: 'Public (4)' },
];

const CONFIG_SNIPPET = `// .env.local (or your env)
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_ARCIUM_MXE_ADDRESS=...    // from Arcium dashboard
NEXT_PUBLIC_ARCIUM_CLUSTER_ID=...     // from Arcium dashboard

// App init (e.g. _app or provider)
const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl('devnet');
<ConnectionProvider endpoint={endpoint}>
  <WalletProvider wallets={wallets}>
    {/* Your app */}
  </WalletProvider>
</ConnectionProvider>

// Create Prism + context (in your component)
const prism = new PrismProtocol({ rpcUrl: endpoint, wallet });
await prism.initialize();
const ctx = await prism.createContext({
  type: ContextType.DeFi,
  maxPerTransaction: 50_000_000_000n, // 50 SOL
});`;

type SectionId = 'overview' | 'api-keys' | 'rpc' | 'program' | 'arcium' | 'context-types' | 'parameters' | 'config';

const SIDEBAR_ITEMS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <FaHome /> },
  { id: 'api-keys', label: 'API Keys', icon: <FaIdBadge /> },
  { id: 'rpc', label: 'RPC & Network', icon: <FaServer /> },
  { id: 'program', label: 'Program', icon: <FaKey /> },
  { id: 'arcium', label: 'Arcium MPC', icon: <FaLock /> },
  { id: 'context-types', label: 'Context Types', icon: <FaList /> },
  { id: 'parameters', label: 'Parameters', icon: <FaSlidersH /> },
  { id: 'config', label: 'Config Snippet', icon: <FaCode /> },
];

export function DevSettingsDashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apps, setApps] = useState<DashboardApp[]>(() => loadApps());
  const [currentAppId, setCurrentAppId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(DASHBOARD_CURRENT_APP_KEY) || loadApps()[0]?.id || '';
  });
  const [prismProtocol, setPrismProtocol] = useState<PrismProtocol | null>(null);
  const [arciumStatus, setArciumStatus] = useState<{
    initialized: boolean;
    mode: 'simulation' | 'live';
    network: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedParams, setCopiedParams] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [paramMaxPerTxSol, setParamMaxPerTxSol] = useState<string>('50');
  const [paramContextType, setParamContextType] = useState<ContextType>(ContextType.DeFi);
  const [paramThresholdSol, setParamThresholdSol] = useState<string>('10');
  const [paramCommitment, setParamCommitment] = useState<'processed' | 'confirmed' | 'finalized'>('confirmed');
  const [paramPrivacyLevel, setParamPrivacyLevel] = useState<string>('1');

  const currentApp = apps.find((a) => a.id === currentAppId) ?? apps[0];
  const effectiveAppId = currentApp?.id ?? currentAppId;

  useEffect(() => {
    if (typeof window === 'undefined' || !effectiveAppId) return;
    localStorage.setItem(DASHBOARD_CURRENT_APP_KEY, effectiveAppId);
  }, [effectiveAppId]);

  useEffect(() => {
    if (typeof window === 'undefined' || apps.length === 0) return;
    try {
      localStorage.setItem(DASHBOARD_APPS_KEY, JSON.stringify(apps));
    } catch {}
  }, [apps]);

  useEffect(() => {
    if (apps.length > 0 && !apps.some((a) => a.id === currentAppId)) {
      setCurrentAppId(apps[0].id);
    }
  }, [apps, currentAppId]);

  const addApp = useCallback(() => {
    const name = `App ${apps.length + 1}`;
    const newApp: DashboardApp = {
      id: genId(),
      name,
      env: 'devnet',
      appId: genAppId(),
      apiKey: genApiKey(),
    };
    setApps((prev) => [...prev, newApp]);
    setCurrentAppId(newApp.id);
  }, [apps.length]);

  const setAppEnv = useCallback((env: AppEnv) => {
    if (!currentApp) return;
    setApps((prev) => prev.map((a) => (a.id === currentApp.id ? { ...a, env } : a)));
  }, [currentApp]);

  const regenerateApiKey = useCallback(() => {
    if (!currentApp) return;
    setApps((prev) => prev.map((a) => (a.id === currentApp.id ? { ...a, apiKey: genApiKey() } : a)));
  }, [currentApp]);

  const rpcUrl =
    typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SOLANA_RPC_URL || '' : '';
  const displayRpc = rpcUrl ? maskValue(rpcUrl) : 'default (clusterApiUrl(devnet))';
  const mxeEnv = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ARCIUM_MXE_ADDRESS : undefined;
  const clusterEnv = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_ARCIUM_CLUSTER_ID : undefined;

  useEffect(() => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setPrismProtocol(null);
      setArciumStatus(null);
      return;
    }
    const init = async () => {
      try {
        const { PrismProtocol: Prism } = await import('@prism-protocol/sdk');
        const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const protocol = new Prism({
          rpcUrl: endpoint,
          wallet: wallet as any,
        });
        await protocol.initialize();
        setPrismProtocol(protocol);
        setArciumStatus(protocol.getArciumStatus());
      } catch (e) {
        setPrismProtocol(null);
        setArciumStatus(null);
      }
    };
    init();
  }, [wallet.publicKey, connection]);

  const copySnippet = useCallback(() => {
    navigator.clipboard.writeText(CONFIG_SNIPPET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const maxPerTxLamports = (() => {
    const n = parseFloat(paramMaxPerTxSol);
    if (Number.isNaN(n) || n < 0) return 50_000_000_000n;
    return BigInt(Math.floor(n * Number(LAMPORTS_PER_SOL)));
  })();
  const thresholdLamports = (() => {
    const n = parseFloat(paramThresholdSol);
    if (Number.isNaN(n) || n < 0) return 10_000_000_000n;
    return BigInt(Math.floor(n * Number(LAMPORTS_PER_SOL)));
  })();
  const contextTypeName = CONTEXT_TYPE_LABELS[paramContextType] ?? 'DeFi';
  const privacyLabel = PRIVACY_LEVEL_OPTIONS.find((o) => String(o.value) === paramPrivacyLevel)?.label?.split(' ')[0] ?? 'High';

  const paramsSnippet = `// Context: type + max per transaction (lamports)
await prism.createContext({
  type: ContextType.${contextTypeName},
  maxPerTransaction: ${maxPerTxLamports}n, // ${paramMaxPerTxSol} SOL
});

await prism.createRootIdentity({
  privacyLevel: PrivacyLevel.${privacyLabel},
});

const proof = await prism.generateSolvencyProof({
  actualBalance: userBalanceLamports,
  threshold: ${thresholdLamports}n,
});

const result = await prism.generateEncryptedSolvencyProof({
  actualBalance: userBalanceLamports,
  threshold: ${thresholdLamports}n,
  contextPubkey: contextAddress,
});

const prism = new PrismProtocol({
  rpcUrl: endpoint,
  wallet,
  commitment: '${paramCommitment}',
});`;

  const copyParamsSnippet = useCallback(() => {
    navigator.clipboard.writeText(paramsSnippet);
    setCopiedParams(true);
    setTimeout(() => setCopiedParams(false), 2000);
  }, [paramsSnippet]);

  const copyAppId = useCallback(() => {
    if (currentApp?.appId) {
      navigator.clipboard.writeText(currentApp.appId);
      setCopiedAppId(true);
      setTimeout(() => setCopiedAppId(false), 2000);
    }
  }, [currentApp?.appId]);

  const copyApiKey = useCallback(() => {
    if (currentApp?.apiKey) {
      navigator.clipboard.writeText(currentApp.apiKey);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  }, [currentApp?.apiKey]);

  const networkLabel = currentApp?.env === 'mainnet' ? 'Mainnet' : 'Devnet';

  const SidebarNav = () => (
    <nav className="flex flex-col gap-0.5">
      {SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            setActiveSection(item.id);
            setSidebarOpen(false);
          }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left font-mono text-sm transition-colors ${
            activeSection === item.id
              ? 'bg-prism-cyan/15 text-prism-cyan border border-prism-cyan/30'
              : 'text-ghost/80 hover:bg-white/5 hover:text-ghost border border-transparent'
          }`}
        >
          <span className="text-base opacity-90">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)] relative">
      {/* Mobile: menu button + overlay sidebar */}
      <div className="lg:hidden flex items-center justify-between gap-4 px-4 py-3 border-b border-steel bg-noir/80">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="flex items-center gap-2 text-ghost font-mono text-sm px-3 py-2 rounded-lg border border-steel hover:border-prism-cyan/50"
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
          {sidebarOpen ? 'Close' : 'Sections'}
        </button>
        <WalletMultiButton className="!bg-steel !rounded-lg !font-landing-mono !text-ghost hover:!bg-prism-cyan/20 !transition-colors !text-sm" />
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-noir/90 backdrop-blur-sm pt-14 px-4 pb-6 overflow-y-auto"
          onClick={() => setSidebarOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-xs mx-auto pt-4">
            <div className="rounded-xl border border-steel bg-noir/95 p-4">
              <p className="text-ghost/60 text-xs font-mono mb-3 uppercase tracking-wider">Settings</p>
              <div className="mb-3 space-y-2">
                <label className="text-ghost/60 text-xs font-mono block">App</label>
                <select
                  value={currentAppId}
                  onChange={(e) => setCurrentAppId(e.target.value)}
                  className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2"
                >
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <button type="button" onClick={addApp} className="flex items-center gap-2 w-full rounded-lg border border-steel text-ghost/80 font-mono text-xs px-3 py-2">
                  <FaPlus /> New app
                </button>
              </div>
              <SidebarNav />
              <div className="pt-4 mt-4 border-t border-steel space-y-3">
                <p className="text-ghost/50 text-xs font-mono leading-relaxed">
                  Developer dashboard (this page) vs <strong className="text-ghost/70">User dashboard</strong> (identity, contexts per app).
                </p>
                <Link
                  href="/user"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm text-prism-violet hover:bg-prism-violet/15 border border-prism-violet/20"
                >
                  <FaUser className="opacity-90" />
                  User Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop: fixed sidebar (scrolls inside so all sections visible) — lg so it shows on 1024px+ */}
      <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:w-64 lg:z-[35] lg:flex-col lg:border-r lg:border-steel lg:bg-noir/95 lg:shadow-[2px_0_24px_rgba(0,0,0,0.3)]">
        <div className="p-4 space-y-4 h-full flex flex-col min-h-0 overflow-y-auto">
          <div className="flex items-center gap-2 text-ghost/60 text-xs font-mono uppercase tracking-wider">
            <FaCog className="opacity-80" />
            Dev settings
          </div>
          {/* App switcher (mock — no backend) */}
          <div className="space-y-2">
            <label className="text-ghost/60 text-xs font-mono uppercase tracking-wider block">App</label>
            <select
              value={currentAppId}
              onChange={(e) => setCurrentAppId(e.target.value)}
              className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
            >
              {apps.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addApp}
              className="flex items-center gap-2 w-full rounded-lg border border-steel text-ghost/80 font-mono text-xs px-3 py-2 hover:bg-white/5 hover:text-prism-cyan hover:border-prism-cyan/30 transition-colors"
            >
              <FaPlus className="opacity-80" /> New app
            </button>
          </div>
          <SidebarNav />
          <div className="pt-4 mt-auto border-t border-steel space-y-3">
            <p className="text-ghost/50 text-xs font-mono leading-relaxed">
              This is the <strong className="text-ghost/70">developer</strong> dashboard (config, RPC, params). The <strong className="text-ghost/70">user</strong> dashboard is where your end-users see their identity and contexts per app.
            </p>
            <Link
              href="/user"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-mono text-sm text-ghost/80 hover:bg-prism-violet/15 hover:text-prism-violet border border-transparent hover:border-prism-violet/30 transition-colors"
            >
              <span className="text-base opacity-90"><FaUser /></span>
              User Dashboard
            </Link>
          </div>
          <div className="pt-2 border-t border-steel">
            <WalletMultiButton className="!w-full !justify-center !bg-steel !rounded-lg !font-landing-mono !text-ghost hover:!bg-prism-cyan/20 !transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main content (scrolls; offset by sidebar width on desktop) */}
      <main className="relative flex-1 min-w-0 px-4 py-6 lg:py-8 lg:pl-8 lg:pr-8 lg:ml-64 overflow-auto">

        {activeSection === 'overview' && (
          <div className="space-y-8 max-w-4xl">
            <div>
              <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
                <FaHome className="text-prism-cyan" />
                Overview
              </h2>
              <p className="text-ghost/70 text-sm font-landing-mono mt-1">
                All dashboard settings in one place. Use the sidebar to jump to a section.
              </p>
            </div>

            {/* App & Environment (mock) */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                App &amp; Environment
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
                <dl className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between gap-2 items-center">
                    <dt className="text-ghost/70">App</dt>
                    <dd className="text-ghost">{currentApp?.name ?? '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-2 items-center">
                    <dt className="text-ghost/70">Environment</dt>
                    <dd>
                      <select
                        value={currentApp?.env ?? 'devnet'}
                        onChange={(e) => setAppEnv(e.target.value as AppEnv)}
                        className="rounded bg-noir/80 border border-steel text-ghost font-mono text-sm px-2 py-1 focus:border-prism-cyan outline-none"
                      >
                        <option value="devnet">Devnet</option>
                        <option value="mainnet">Mainnet</option>
                      </select>
                    </dd>
                  </div>
                </dl>
              </HoloPanel>
            </div>

            {/* API Keys (mock) */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                <FaIdBadge /> API Keys
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
                <p className="text-ghost/50 text-xs font-mono mb-3">Mock keys for this app. Copy or regenerate (no backend).</p>
                <dl className="space-y-3 text-sm font-mono">
                  <div className="flex justify-between gap-2 items-center flex-wrap">
                    <dt className="text-ghost/70">App ID (public)</dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-ghost truncate max-w-[160px]" title={currentApp?.appId}>{currentApp?.appId ?? '—'}</span>
                      <HoloButton size="sm" onClick={copyAppId} className="shrink-0">
                        {copiedAppId ? <FaCheck /> : <FaCopy />}
                        {copiedAppId ? 'Copied' : 'Copy'}
                      </HoloButton>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2 items-center flex-wrap">
                    <dt className="text-ghost/70">API Key (secret)</dt>
                    <dd className="flex items-center gap-2">
                      <span className="text-ghost">{currentApp?.apiKey ? maskValue(currentApp.apiKey) : '—'}</span>
                      <HoloButton size="sm" onClick={copyApiKey} className="shrink-0">
                        {copiedApiKey ? <FaCheck /> : <FaCopy />}
                        {copiedApiKey ? 'Copied' : 'Copy'}
                      </HoloButton>
                      <HoloButton size="sm" onClick={regenerateApiKey} variant="prismOutline" className="shrink-0 text-ghost/80">
                        Regenerate
                      </HoloButton>
                    </dd>
                  </div>
                </dl>
              </HoloPanel>
            </div>

            {/* RPC & Network */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                <FaServer /> RPC &amp; Network
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
                <dl className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">RPC URL</dt>
                    <dd className="text-ghost truncate max-w-[220px]" title={displayRpc}>
                      {displayRpc.startsWith('http') ? maskValue(displayRpc) : displayRpc}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">Source</dt>
                    <dd className="text-ghost/80">
                      {rpcUrl ? 'NEXT_PUBLIC_SOLANA_RPC_URL' : `clusterApiUrl('${currentApp?.env ?? 'devnet'}')`}
                    </dd>
                  </div>
                </dl>
              </HoloPanel>
            </div>

            {/* Program */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                <FaKey /> Program
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
                <dl className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">Program ID</dt>
                    <dd className="text-ghost truncate max-w-[200px]" title={PROGRAM_ID}>
                      {PROGRAM_ID.slice(0, 8)}...{PROGRAM_ID.slice(-8)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">Network</dt>
                    <dd className="text-ghost/80">{networkLabel}</dd>
                  </div>
                </dl>
              </HoloPanel>
            </div>

            {/* Arcium MPC */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-violet mb-2 flex items-center gap-2">
                <FaShieldAlt /> Arcium MPC
                <a href="#" title="See repository docs" className="text-prism-violet/70 hover:text-prism-violet text-xs font-mono flex items-center gap-0.5" aria-label="Learn more">
                  <FaQuestionCircle /> Learn
                </a>
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-fuchsia-400/20">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">MXE (env)</dt>
                    <dd className="text-ghost">{mxeEnv ? maskValue(mxeEnv) : '— not set'}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ghost/70">Cluster ID (env)</dt>
                    <dd className="text-ghost">{clusterEnv ? clusterEnv : '— not set'}</dd>
                  </div>
                  {arciumStatus && (
                    <>
                      <div className="flex justify-between gap-2">
                        <dt className="text-ghost/70">Mode</dt>
                        <dd className="text-ghost">{arciumStatus.mode}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-ghost/70">Initialized</dt>
                        <dd className="text-ghost">{arciumStatus.initialized ? 'Yes' : 'No'}</dd>
                      </div>
                    </>
                  )}
                </dl>
                {!wallet.connected && (
                  <p className="text-ghost/50 text-xs mt-2 font-landing-mono">Connect wallet to see live status.</p>
                )}
              </HoloPanel>
            </div>

            {/* Context Types */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                <FaList /> Context Types
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="text-ghost/70 border-b border-steel">
                        <th className="text-left py-2">Type</th>
                        <th className="text-left py-2">Value</th>
                        <th className="text-left py-2">Example use</th>
                      </tr>
                    </thead>
                    <tbody className="text-ghost/90">
                      {Object.entries(CONTEXT_TYPE_LABELS).map(([val, label]) => (
                        <tr key={val} className="border-b border-steel/50">
                          <td className="py-2">{label}</td>
                          <td className="py-2 text-ghost/60">ContextType.{label}</td>
                          <td className="py-2 text-ghost/60">
                            {label === 'DeFi' && 'Dark pool, swaps'}
                            {label === 'Social' && 'Social / reputation'}
                            {label === 'Gaming' && 'In-game identity'}
                            {label === 'Professional' && 'Work credentials'}
                            {label === 'Temporary' && 'One-time, auto-burn'}
                            {label === 'Public' && 'Flex / show-all'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </HoloPanel>
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-violet mb-2 flex items-center gap-2">
                <FaSlidersH /> Parameters
                <a href="#" title="See repository docs" className="text-prism-violet/70 hover:text-prism-violet text-xs font-mono flex items-center gap-0.5" aria-label="Learn more">
                  <FaQuestionCircle /> Learn
                </a>
              </h3>
              <p className="text-ghost/60 text-xs font-mono mb-3">
                Adjust values; the snippet below updates. ZK: solvency (balance ≥ threshold).
              </p>
              <p className="text-ghost/50 text-xs font-mono mb-3 rounded bg-noir/40 px-2 py-1 border border-steel/50">
                Current: {CONTEXT_TYPE_LABELS[paramContextType] ?? 'DeFi'} · {paramMaxPerTxSol} SOL max · {paramThresholdSol} SOL threshold · {paramCommitment} · {PRIVACY_LEVEL_OPTIONS.find((o) => String(o.value) === paramPrivacyLevel)?.label?.split(' ')[0] ?? 'High'}
              </p>
              <HoloPanel variant="elevated" size="lg" className="border-prism-violet/20">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                  <div>
                    <label className="block text-ghost/70 text-xs font-mono mb-1">Context type</label>
                    <select
                      value={String(paramContextType)}
                      onChange={(e) => setParamContextType(Number(e.target.value) as ContextType)}
                      className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                    >
                      {Object.entries(CONTEXT_TYPE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-ghost/70 text-xs font-mono mb-1">Max per transaction (SOL)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={paramMaxPerTxSol}
                      onChange={(e) => setParamMaxPerTxSol(e.target.value)}
                      className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                    />
                    <p className="text-ghost/50 text-xs mt-0.5">{maxPerTxLamports.toLocaleString()} lamports</p>
                  </div>
                  <div>
                    <label className="block text-ghost/70 text-xs font-mono mb-1">ZK threshold (SOL, public)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={paramThresholdSol}
                      onChange={(e) => setParamThresholdSol(e.target.value)}
                      className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-ghost/70 text-xs font-mono mb-1">Commitment (PrismConfig)</label>
                    <select
                      value={paramCommitment}
                      onChange={(e) => setParamCommitment(e.target.value as 'processed' | 'confirmed' | 'finalized')}
                      className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                    >
                      <option value="processed">processed</option>
                      <option value="confirmed">confirmed</option>
                      <option value="finalized">finalized</option>
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-ghost/70 text-xs font-mono mb-1">Root privacy level (createRootIdentity)</label>
                  <select
                    value={paramPrivacyLevel}
                    onChange={(e) => setParamPrivacyLevel(e.target.value)}
                    className="w-full max-w-xs rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                  >
                    {PRIVACY_LEVEL_OPTIONS.map((o) => (
                      <option key={o.value} value={String(o.value)}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-ghost/70 text-xs font-mono">Generated snippet</span>
                  <HoloButton size="sm" onClick={copyParamsSnippet} className="flex items-center gap-2">
                    {copiedParams ? <FaCheck /> : <FaCopy />}
                    {copiedParams ? 'Copied' : 'Copy'}
                  </HoloButton>
                </div>
                <pre className="text-xs font-mono text-ghost/80 bg-noir/60 rounded-lg p-3 overflow-x-auto max-h-48 overflow-y-auto border border-steel">
                  <code>{paramsSnippet}</code>
                </pre>
              </HoloPanel>
            </div>

            {/* Config Snippet */}
            <div>
              <h3 className="text-sm font-heading font-semibold text-prism-cyan mb-2 flex items-center gap-2">
                <FaCode /> Config Snippet
                <a href="#" title="See repository docs" className="text-prism-cyan/70 hover:text-prism-cyan text-xs font-mono flex items-center gap-0.5" aria-label="Learn more">
                  <FaQuestionCircle /> Learn
                </a>
              </h3>
              <HoloPanel variant="elevated" size="md" className="border-prism-cyan/20">
                <div className="flex justify-end mb-2">
                  <HoloButton size="sm" onClick={copySnippet} className="flex items-center gap-2">
                    {copied ? <FaCheck /> : <FaCopy />}
                    {copied ? 'Copied' : 'Copy'}
                  </HoloButton>
                </div>
                <pre className="text-xs font-mono text-ghost/80 bg-noir/60 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto border border-steel">
                  <code>{CONFIG_SNIPPET}</code>
                </pre>
              </HoloPanel>
            </div>
          </div>
        )}

        {activeSection === 'api-keys' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaIdBadge className="text-prism-cyan" />
              API Keys
            </h2>
            <p className="text-ghost/60 text-sm font-landing-mono">
              Mock API keys for <strong className="text-ghost/80">{currentApp?.name ?? 'this app'}</strong>. Stored in browser only; no backend.
            </p>
            <HoloPanel variant="elevated" size="lg" className="border-cyan-400/20">
              <dl className="space-y-4 text-sm font-mono">
                <div className="flex flex-wrap justify-between gap-3 items-center">
                  <dt className="text-ghost/70">App ID (public)</dt>
                  <dd className="flex items-center gap-2">
                    <span className="text-ghost truncate max-w-[200px]" title={currentApp?.appId}>{currentApp?.appId ?? '—'}</span>
                    <HoloButton size="sm" onClick={copyAppId}>
                      {copiedAppId ? <FaCheck /> : <FaCopy />}
                      {copiedAppId ? 'Copied' : 'Copy'}
                    </HoloButton>
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-3 items-center">
                  <dt className="text-ghost/70">API Key (secret)</dt>
                  <dd className="flex items-center gap-2 flex-wrap">
                    <span className="text-ghost">{currentApp?.apiKey ? maskValue(currentApp.apiKey) : '—'}</span>
                    <HoloButton size="sm" onClick={copyApiKey}>
                      {copiedApiKey ? <FaCheck /> : <FaCopy />}
                      {copiedApiKey ? 'Copied' : 'Copy'}
                    </HoloButton>
                    <HoloButton size="sm" onClick={regenerateApiKey} variant="prismOutline" className="text-ghost/80">
                      Regenerate
                    </HoloButton>
                  </dd>
                </div>
              </dl>
              <p className="text-ghost/50 text-xs font-mono mt-4 pt-4 border-t border-steel">
                Use App ID in client-side code; keep API Key server-side only. Regenerating invalidates the previous key (mock).
              </p>
            </HoloPanel>
          </div>
        )}

        {activeSection === 'rpc' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaServer className="text-prism-cyan" />
              RPC &amp; Network
            </h2>
            <HoloPanel variant="elevated" size="lg" className="border-cyan-400/20">
              <dl className="space-y-2 text-sm font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">RPC URL</dt>
                  <dd className="text-ghost truncate max-w-[220px]" title={displayRpc}>
                    {displayRpc.startsWith('http') ? maskValue(displayRpc) : displayRpc}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">Source</dt>
                  <dd className="text-ghost/80">
                    {rpcUrl ? 'NEXT_PUBLIC_SOLANA_RPC_URL' : `clusterApiUrl('${currentApp?.env ?? 'devnet'}')`}
                  </dd>
                </div>
              </dl>
            </HoloPanel>
          </div>
        )}

        {activeSection === 'program' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaKey className="text-prism-cyan" />
              Program
            </h2>
            <HoloPanel variant="elevated" size="lg" className="border-cyan-400/20">
              <dl className="space-y-2 text-sm font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">Program ID</dt>
                  <dd className="text-ghost truncate max-w-[200px]" title={PROGRAM_ID}>
                    {PROGRAM_ID.slice(0, 8)}...{PROGRAM_ID.slice(-8)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">Network</dt>
                  <dd className="text-ghost/80">{networkLabel}</dd>
                </div>
              </dl>
            </HoloPanel>
          </div>
        )}

        {activeSection === 'arcium' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaShieldAlt className="text-prism-violet" />
              Arcium MPC
            </h2>
            <HoloPanel variant="elevated" size="lg" className="border-fuchsia-400/20">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-mono">
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">MXE (env)</dt>
                  <dd className="text-ghost">{mxeEnv ? maskValue(mxeEnv) : '— not set'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ghost/70">Cluster ID (env)</dt>
                  <dd className="text-ghost">{clusterEnv ? clusterEnv : '— not set'}</dd>
                </div>
                {arciumStatus && (
                  <>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ghost/70">Mode</dt>
                      <dd className="text-ghost">{arciumStatus.mode}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ghost/70">Network</dt>
                      <dd className="text-ghost">{arciumStatus.network}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ghost/70">Initialized</dt>
                      <dd className="text-ghost">{arciumStatus.initialized ? 'Yes' : 'No'}</dd>
                    </div>
                  </>
                )}
              </dl>
              {!wallet.connected && (
                <p className="text-ghost/50 text-xs mt-2 font-landing-mono">
                  Connect wallet to see live Arcium status from SDK.
                </p>
              )}
            </HoloPanel>
          </div>
        )}

        {activeSection === 'context-types' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaList className="text-prism-cyan" />
              Context Types
            </h2>
            <HoloPanel variant="elevated" size="lg" className="border-cyan-400/20">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="text-ghost/70 border-b border-steel">
                      <th className="text-left py-2">Type</th>
                      <th className="text-left py-2">Value</th>
                      <th className="text-left py-2">Example use</th>
                    </tr>
                  </thead>
                  <tbody className="text-ghost/90">
                    {Object.entries(CONTEXT_TYPE_LABELS).map(([val, label]) => (
                      <tr key={val} className="border-b border-steel/50">
                        <td className="py-2">{label}</td>
                        <td className="py-2 text-ghost/60">ContextType.{label}</td>
                        <td className="py-2 text-ghost/60">
                          {label === 'DeFi' && 'Dark pool, swaps'}
                          {label === 'Social' && 'Social / reputation'}
                          {label === 'Gaming' && 'In-game identity'}
                          {label === 'Professional' && 'Work credentials'}
                          {label === 'Temporary' && 'One-time, auto-burn'}
                          {label === 'Public' && 'Flex / show-all'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </HoloPanel>
          </div>
        )}

        {activeSection === 'parameters' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaSlidersH className="text-prism-violet" />
              Parameters
            </h2>
            <p className="text-ghost/70 text-sm font-landing-mono">
              Adjust values; the code snippet updates. Copy to use in your app.
            </p>
            <p className="text-ghost/60 text-xs font-mono rounded-lg bg-noir/40 border border-steel/50 px-3 py-2">
              ZK circuit: <strong className="text-ghost/80">solvency</strong> (balance ≥ threshold). Private: <code>actualBalance</code>; public: <code>threshold</code>.
            </p>
            <HoloPanel variant="elevated" size="lg" className="border-prism-violet/20">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                <div>
                  <label className="block text-ghost/70 text-xs font-mono mb-1">Context type</label>
                  <select
                    value={String(paramContextType)}
                    onChange={(e) => setParamContextType(Number(e.target.value) as ContextType)}
                    className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                  >
                    {Object.entries(CONTEXT_TYPE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-ghost/70 text-xs font-mono mb-1">Max per transaction (SOL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={paramMaxPerTxSol}
                    onChange={(e) => setParamMaxPerTxSol(e.target.value)}
                    className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                  />
                  <p className="text-ghost/50 text-xs mt-0.5">{maxPerTxLamports.toLocaleString()} lamports</p>
                </div>
                <div>
                  <label className="block text-ghost/70 text-xs font-mono mb-1">ZK threshold (SOL)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={paramThresholdSol}
                    onChange={(e) => setParamThresholdSol(e.target.value)}
                    className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                  />
                </div>
                <div>
                  <label className="block text-ghost/70 text-xs font-mono mb-1">Commitment</label>
                  <select
                    value={paramCommitment}
                    onChange={(e) => setParamCommitment(e.target.value as 'processed' | 'confirmed' | 'finalized')}
                    className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                  >
                    <option value="processed">processed</option>
                    <option value="confirmed">confirmed</option>
                    <option value="finalized">finalized</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-ghost/70 text-xs font-mono mb-1">Root privacy level</label>
                <select
                  value={paramPrivacyLevel}
                  onChange={(e) => setParamPrivacyLevel(e.target.value)}
                  className="w-full max-w-xs rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
                >
                  {PRIVACY_LEVEL_OPTIONS.map((o) => (
                    <option key={o.value} value={String(o.value)}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between gap-2 text-prism-violet font-heading text-sm mb-2">
                <span>Generated snippet</span>
                <HoloButton size="sm" onClick={copyParamsSnippet} className="flex items-center gap-2">
                  {copiedParams ? <FaCheck /> : <FaCopy />}
                  {copiedParams ? 'Copied' : 'Copy'}
                </HoloButton>
              </div>
              <pre className="text-xs font-mono text-ghost/80 bg-noir/60 rounded-lg p-4 overflow-x-auto max-h-72 overflow-y-auto border border-steel">
                <code>{paramsSnippet}</code>
              </pre>
            </HoloPanel>
          </div>
        )}

        {activeSection === 'config' && (
          <div className="space-y-6 max-w-3xl">
            <h2 className="text-xl font-heading font-bold text-ghost flex items-center gap-2">
              <FaCode className="text-prism-cyan" />
              Config Snippet
            </h2>
            <HoloPanel variant="elevated" size="lg" className="border-prism-cyan/20">
              <div className="flex justify-end mb-2">
                <HoloButton size="sm" onClick={copySnippet} className="flex items-center gap-2">
                  {copied ? <FaCheck /> : <FaCopy />}
                  {copied ? 'Copied' : 'Copy'}
                </HoloButton>
              </div>
              <pre className="text-xs font-mono text-ghost/80 bg-noir/60 rounded-lg p-4 overflow-x-auto max-h-[28rem] overflow-y-auto border border-steel">
                <code>{CONFIG_SNIPPET}</code>
              </pre>
            </HoloPanel>
          </div>
        )}
      </main>
    </div>
  );
}
