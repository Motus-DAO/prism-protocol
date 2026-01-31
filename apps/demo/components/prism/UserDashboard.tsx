'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { HoloPanel, HoloButton } from '../ui';
import { usePrismProgram, type RootIdentity, type ContextIdentity } from '../../lib/usePrismProgram';
import { FaWallet, FaShieldAlt, FaFire, FaPlus, FaSlidersH, FaCoins, FaChartLine, FaHistory, FaIdCard } from 'react-icons/fa';

const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const LAMPORTS_PER_SOL = 1_000_000_000;

const CONTEXT_TYPE_LABELS: Record<number, string> = {
  0: 'DeFi',
  1: 'Social',
  2: 'Gaming',
  3: 'Professional',
  4: 'Temporary',
  5: 'Public',
};

const CONTEXT_TYPE_DESCRIPTIONS: Record<number, string> = {
  0: 'Dark pool, swaps',
  1: 'Social / reputation',
  2: 'In-game identity',
  3: 'Work credentials',
  4: 'One-time, auto-burn',
  5: 'Flex / show-all',
};

/** App label for display (per-app contexts) */
const APP_LABELS: Record<number, string> = {
  0: 'Dark Pool',
  1: 'DAO Voting',
  2: 'Gaming',
  3: 'Professional',
  4: 'Temporary',
  5: 'Public',
};

export type MockContext = {
  id: string;
  app: string;
  appSlug: string;
  contextType: number;
  contextTypeLabel: string;
  maxSol: number;
  totalSpentSol: number;
  revoked: boolean;
  isMock: true;
  usedByApps?: number;
};

const INITIAL_MOCK_CONTEXTS: MockContext[] = [
  { id: 'mock-1', app: 'Dark Pool', appSlug: 'dark-pool', contextType: 0, contextTypeLabel: 'DeFi', maxSol: 50, totalSpentSol: 0, revoked: false, isMock: true, usedByApps: 1 },
  { id: 'mock-2', app: 'DAO Voting', appSlug: 'dao-voting', contextType: 1, contextTypeLabel: 'Social', maxSol: 1, totalSpentSol: 0, revoked: false, isMock: true, usedByApps: 2 },
  { id: 'mock-3', app: 'Gaming', appSlug: 'gaming', contextType: 2, contextTypeLabel: 'Gaming', maxSol: 10, totalSpentSol: 2.5, revoked: false, isMock: true, usedByApps: 1 },
  { id: 'mock-4', app: 'Dark Pool', appSlug: 'dark-pool', contextType: 0, contextTypeLabel: 'DeFi', maxSol: 25, totalSpentSol: 12, revoked: true, isMock: true, usedByApps: 0 },
];

/** From ideation: Privacy Dashboard (idea.md, PRD) — mock privacy score & recommendations */
const MOCK_PRIVACY_SCORE = 87;
const MOCK_PRIVACY_RECOMMENDATIONS = [
  'Wallet linking risk (Solana ID) — use contexts to isolate',
  'Use Prism RPC for timing protection',
  'Contexts isolate activity — good',
];

/** From ideation: Activity log (idea.md "transaction history", MASTER_CHECKLIST) */
const MOCK_ACTIVITY = [
  { id: 'a1', label: 'Context created for Dark Pool', time: '2h ago' },
  { id: 'a2', label: 'Solvency proof generated', time: '5h ago' },
  { id: 'a3', label: 'Context revoked (DAO Voting)', time: '1d ago' },
  { id: 'a4', label: 'Context created for Gaming', time: '2d ago' },
  { id: 'a5', label: 'Root identity created', time: '3d ago' },
];

/** From ideation: Credentials (idea.md "Credentials: Age, KYC - Disclosed to X apps") */
const MOCK_CREDENTIALS = [
  { name: 'Solvency (Prism)', disclosed: '1 app' },
  { name: 'Age (Civic)', disclosed: '2 apps' },
  { name: 'KYC (zkMe)', disclosed: '1 app' },
];

function shortAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/** Anchor may return snake_case and/or BN; read context count safely */
function getContextCount(root: RootIdentity | null): number {
  if (!root) return 0;
  const raw = (root as any).context_count ?? (root as any).contextCount;
  if (raw == null) return 0;
  if (typeof raw === 'number') return Math.max(0, raw);
  const n = (raw as { toNumber?: () => number }).toNumber?.() ?? Number(raw);
  return Math.max(0, Number.isNaN(n) ? 0 : n);
}

/** Anchor may return snake_case or BN; normalize context fields for display */
function ctxNum(ctx: ContextIdentity, camel: keyof ContextIdentity, snake: string): number {
  const c = ctx as any;
  const v = c[camel] ?? c[snake];
  if (v == null) return 0;
  if (typeof (v as { toNumber?: () => number }).toNumber === 'function') return (v as { toNumber: () => number }).toNumber();
  return Number(v) || 0;
}
function ctxBool(ctx: ContextIdentity, camel: keyof ContextIdentity, snake: string): boolean {
  const c = ctx as any;
  const v = c[camel] ?? c[snake];
  return Boolean(v);
}

export function UserDashboard() {
  const wallet = useWallet();
  const {
    fetchRootIdentity,
    fetchContextIdentity,
    getRootPDA,
    getContextPDA,
    createContext,
    revokeContext,
    isLoading,
    error,
  } = usePrismProgram();

  const [rootIdentity, setRootIdentity] = useState<RootIdentity | null>(null);
  const [contexts, setContexts] = useState<ContextIdentity[]>([]);
  const [mockContexts, setMockContexts] = useState<MockContext[]>(INITIAL_MOCK_CONTEXTS);
  const [revokingIndex, setRevokingIndex] = useState<number | null>(null);
  const [revokingMockId, setRevokingMockId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Create form
  const [newContextType, setNewContextType] = useState<number>(0);
  const [newContextMaxSol, setNewContextMaxSol] = useState<string>('10');
  const [newContextApp, setNewContextApp] = useState<string>('Dark Pool');
  const [createError, setCreateError] = useState<string | null>(null);

  const APP_OPTIONS = ['Dark Pool', 'DAO Voting', 'Gaming', 'Other'];

  const loadIdentityAndContexts = useCallback(async () => {
    if (!wallet.publicKey) {
      setRootIdentity(null);
      setContexts([]);
      return;
    }
    setRefreshing(true);
    setCreateError(null);
    if (typeof setError === 'function') setError(null);
    try {
      const root = await fetchRootIdentity();
      setRootIdentity(root ?? null);
      if (!root) {
        setContexts([]);
        return;
      }
      const rootPDA = getRootPDA();
      if (!rootPDA) {
        setContexts([]);
        return;
      }
      const count = getContextCount(root);
      const list: ContextIdentity[] = [];
      for (let i = 0; i < count; i++) {
        const { pda } = getContextPDA(rootPDA.pda, i);
        const ctx = await fetchContextIdentity(pda);
        if (ctx) list.push(ctx);
      }
      setContexts(list);
    } finally {
      setRefreshing(false);
    }
  }, [wallet.publicKey, fetchRootIdentity, fetchContextIdentity, getRootPDA, getContextPDA]);

  useEffect(() => {
    loadIdentityAndContexts();
  }, [loadIdentityAndContexts]);

  const handleRevoke = useCallback(
    async (contextIndex: number) => {
      setRevokingIndex(contextIndex);
      setCreateError(null);
      try {
        await revokeContext(contextIndex);
        await loadIdentityAndContexts();
      } finally {
        setRevokingIndex(null);
      }
    },
    [revokeContext, loadIdentityAndContexts]
  );

  const handleRevokeMock = useCallback((id: string) => {
    setRevokingMockId(id);
    setMockContexts((prev) =>
      prev.map((m) => (m.id === id ? { ...m, revoked: true } : m))
    );
    setTimeout(() => setRevokingMockId(null), 400);
  }, []);

  const handleAddMockContext = useCallback(() => {
    const app = APP_OPTIONS[mockContexts.length % APP_OPTIONS.length] ?? 'Other';
    const slug = app.toLowerCase().replace(/\s+/g, '-');
    const type = mockContexts.length % 3;
    const typeLabel = ['DeFi', 'Social', 'Gaming'][type];
    setMockContexts((prev) => [
      ...prev,
      {
        id: `mock-${Date.now()}`,
        app,
        appSlug: slug,
        contextType: type,
        contextTypeLabel: typeLabel,
        maxSol: 10,
        totalSpentSol: 0,
        revoked: false,
        isMock: true,
        usedByApps: 1,
      },
    ]);
  }, [mockContexts.length]);

  const handleCreateContext = useCallback(async () => {
    if (!wallet.connected) return;
    const maxSol = parseFloat(newContextMaxSol);
    if (Number.isNaN(maxSol) || maxSol <= 0) {
      setCreateError('Enter a valid max SOL (e.g. 10)');
      return;
    }
    const maxLamports = Math.floor(maxSol * LAMPORTS_PER_SOL);
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createContext(newContextType, maxLamports);
      if (result) {
        setNewContextMaxSol('10');
        await loadIdentityAndContexts();
      } else {
        setCreateError(error || 'Failed to create context');
      }
    } catch (e: any) {
      setCreateError(e?.message || 'Failed to create context');
    } finally {
      setCreating(false);
    }
  }, [wallet.connected, newContextType, newContextMaxSol, createContext, loadIdentityAndContexts, error]);

  if (!wallet.connected) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-6">
          <h1 className="text-2xl font-heading font-bold text-ghost flex items-center gap-2">
            <FaShieldAlt className="text-prism-cyan" />
            My identity
          </h1>
          <p className="text-ghost/70 text-sm font-landing-mono text-center max-w-md">
            Control your identity in one place. Create personas, set permissions and amounts, revoke when done.
          </p>
          <WalletMultiButton className="!bg-steel !rounded-lg !font-landing-mono !text-ghost hover:!bg-prism-cyan/20 !transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero: user flow in one place */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ghost flex items-center justify-center gap-2 flex-wrap">
          <FaShieldAlt className="text-prism-cyan" />
          My identity
        </h1>
        <p className="text-ghost/70 text-sm sm:text-base mt-2 font-landing-mono">
          Control your Prism identity in one place: create context-bound personas, set permissions and spending amounts, revoke when done.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
        <HoloButton size="sm" onClick={loadIdentityAndContexts} disabled={refreshing}>
          {refreshing ? 'Loading…' : 'Refresh'}
        </HoloButton>
        <WalletMultiButton className="!bg-steel !rounded-lg !font-landing-mono !text-ghost hover:!bg-prism-cyan/20 !transition-colors" />
      </div>

      {error && (
        <div className="rounded-lg bg-warning-red/10 border border-warning-red/30 text-ghost text-sm font-mono px-4 py-2">
          {error}
        </div>
      )}

      {/* Root identity */}
      <HoloPanel variant="elevated" size="lg" className="border-cyan-400/20">
        <div className="flex items-center gap-2 text-prism-cyan font-heading text-sm mb-3">
          <FaWallet /> Root identity
        </div>
        {rootIdentity ? (
          <dl className="space-y-2 text-sm font-mono">
            <div className="flex justify-between gap-2">
              <dt className="text-ghost/70">Root PDA</dt>
              <dd className="text-ghost truncate" title={getRootPDA()?.pda.toBase58()}>
                {getRootPDA() ? shortAddress(getRootPDA()!.pda.toBase58()) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-ghost/70">Contexts (on-chain)</dt>
              <dd className="text-ghost">{getContextCount(rootIdentity)}</dd>
            </div>
            {mockContexts.length > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-ghost/70">Demo (mocked)</dt>
                <dd className="text-ghost">{mockContexts.filter((m) => !m.revoked).length} active</dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="text-ghost/60 text-sm font-mono">
            No root identity yet. Create your first context below — root is created automatically.
          </p>
        )}
      </HoloPanel>

      {/* Privacy score (mock — from ideation idea.md, PRD) */}
      <HoloPanel variant="elevated" size="lg" className="border-prism-cyan/20">
        <div className="flex items-center gap-2 text-prism-cyan font-heading text-sm mb-3">
          <FaChartLine /> Privacy score
        </div>
        <p className="text-ghost/50 text-xs font-mono mb-3">
          Mock: how the user dashboard would show privacy scoring (ideation: Privacy Leakage Score, recommendations).
        </p>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-heading font-bold text-prism-cyan">{MOCK_PRIVACY_SCORE}</span>
          <span className="text-ghost/60 text-sm font-mono">/ 100</span>
        </div>
        <ul className="text-ghost/70 text-xs font-mono space-y-1">
          {MOCK_PRIVACY_RECOMMENDATIONS.map((rec, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="text-ghost/50">•</span> {rec}
            </li>
          ))}
        </ul>
      </HoloPanel>

      {/* Create new context: permissions + amount */}
      <HoloPanel variant="elevated" size="lg" className="border-prism-violet/20">
        <div className="flex items-center gap-2 text-prism-violet font-heading text-sm mb-3">
          <FaPlus /> Create new context
        </div>
        <p className="text-ghost/60 text-xs font-mono mb-4">
          Choose permission type and max amount per transaction. Each context is a separate persona.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-ghost/70 text-xs font-mono mb-1 flex items-center gap-1">
              For app
            </label>
            <select
              value={newContextApp}
              onChange={(e) => setNewContextApp(e.target.value)}
              className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
            >
              {APP_OPTIONS.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-ghost/70 text-xs font-mono mb-1 flex items-center gap-1">
              <FaSlidersH /> Permission (type)
            </label>
            <select
              value={newContextType}
              onChange={(e) => setNewContextType(Number(e.target.value))}
              className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
            >
              {Object.entries(CONTEXT_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label} — {CONTEXT_TYPE_DESCRIPTIONS[Number(val)]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-ghost/70 text-xs font-mono mb-1 flex items-center gap-1">
              <FaCoins /> Max per transaction (SOL)
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={newContextMaxSol}
              onChange={(e) => setNewContextMaxSol(e.target.value)}
              className="w-full rounded-lg bg-noir/80 border border-steel text-ghost font-mono text-sm px-3 py-2 focus:border-prism-cyan outline-none"
              placeholder="10"
            />
          </div>
          <div className="flex items-end gap-2">
            <HoloButton
              size="md"
              onClick={handleCreateContext}
              disabled={creating || isLoading}
              className="flex-1"
            >
              {creating ? 'Creating…' : 'Create (on-chain)'}
            </HoloButton>
            <HoloButton
              size="md"
              onClick={handleAddMockContext}
              variant="prismOutline"
              className="text-ghost/80"
            >
              Add demo
            </HoloButton>
          </div>
        </div>
        {createError && (
          <p className="text-warning-red/90 text-xs font-mono mt-2">{createError}</p>
        )}
      </HoloPanel>

      {/* My contexts: per-app, real + mock */}
      <div>
        <h2 className="text-lg font-heading font-bold text-ghost mb-3 flex items-center gap-2">
          <FaShieldAlt className="text-prism-violet" /> My contexts per app
        </h2>
        <p className="text-ghost/60 text-xs font-mono mb-3">
          Context-bound personas per app. Create or revoke access per app. Demo rows are mocked for UI; use &quot;Create (on-chain)&quot; for real contexts.
        </p>
        {contexts.length === 0 && mockContexts.length === 0 ? (
          <HoloPanel variant="default" size="md" className="border-steel">
            <p className="text-ghost/60 text-sm font-mono">
              No contexts yet. Create one above or <button type="button" onClick={handleAddMockContext} className="text-prism-cyan hover:underline">add a demo context</button> to see the UI.
            </p>
          </HoloPanel>
        ) : (
          <div className="space-y-3">
            {/* On-chain contexts */}
            {contexts.map((ctx) => {
              const contextType = ctxNum(ctx, 'contextType', 'context_type');
              const contextIndex = ctxNum(ctx, 'contextIndex', 'context_index');
              const revoked = ctxBool(ctx, 'revoked', 'revoked');
              const maxPerTx = ctxNum(ctx, 'maxPerTransaction', 'max_per_transaction');
              const totalSpent = ctxNum(ctx, 'totalSpent', 'total_spent');
              const typeLabel = CONTEXT_TYPE_LABELS[contextType] ?? `Type ${contextType}`;
              const typeDesc = CONTEXT_TYPE_DESCRIPTIONS[contextType] ?? '';
              const appLabel = APP_LABELS[contextType] ?? 'App';
              const maxSol = maxPerTx ? maxPerTx / LAMPORTS_PER_SOL : 0;
              const totalSol = totalSpent / LAMPORTS_PER_SOL;
              return (
                <HoloPanel
                  key={`onchain-${contextIndex}`}
                  variant="elevated"
                  size="md"
                  className={`border ${revoked ? 'border-steel opacity-70' : 'border-prism-violet/20'}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono text-sm space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-prism-cyan/20 text-prism-cyan px-2 py-0.5 rounded font-medium">
                          {appLabel}
                        </span>
                        <span className="text-ghost/70">#{contextIndex}</span>
                        <span className="text-ghost font-medium">{typeLabel}</span>
                        {typeDesc && (
                          <span className="text-ghost/50 text-xs">— {typeDesc}</span>
                        )}
                        <span className="text-ghost/40 text-xs">on-chain</span>
                        {revoked && (
                          <span className="text-xs text-ghost/50 bg-steel px-2 py-0.5 rounded">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-ghost/60 text-xs flex items-center gap-3">
                        <span>Max {maxSol} SOL/tx</span>
                        {totalSol > 0 && <span>Spent: {totalSol} SOL</span>}
                        <span>1 app</span>
                      </div>
                    </div>
                    {!revoked && (
                      <HoloButton
                        size="sm"
                        onClick={() => handleRevoke(contextIndex)}
                        disabled={revokingIndex !== null}
                        className="flex items-center gap-2 text-warning-red/90 hover:text-warning-red"
                      >
                        <FaFire />
                        {revokingIndex === contextIndex ? 'Revoking…' : 'Revoke'}
                      </HoloButton>
                    )}
                  </div>
                </HoloPanel>
              );
            })}
            {/* Mock (demo) contexts */}
            {mockContexts.map((m) => (
              <HoloPanel
                key={m.id}
                variant="elevated"
                size="md"
                className={`border ${m.revoked ? 'border-steel opacity-70' : 'border-prism-violet/20'}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono text-sm space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-prism-violet/20 text-prism-violet px-2 py-0.5 rounded font-medium">
                        {m.app}
                      </span>
                      <span className="text-ghost font-medium">{m.contextTypeLabel}</span>
                      <span className="text-ghost/50 text-xs">— {CONTEXT_TYPE_DESCRIPTIONS[m.contextType] ?? ''}</span>
                      <span className="text-ghost/40 text-xs">demo</span>
                      {m.revoked && (
                        <span className="text-xs text-ghost/50 bg-steel px-2 py-0.5 rounded">
                          Revoked
                        </span>
                      )}
                    </div>
                    <div className="text-ghost/60 text-xs flex items-center gap-3">
                      <span>Max {m.maxSol} SOL/tx</span>
                      {m.totalSpentSol > 0 && <span>Spent: {m.totalSpentSol} SOL</span>}
                      {(m.usedByApps ?? 0) > 0 && <span>{m.usedByApps} app{(m.usedByApps ?? 0) !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  {!m.revoked && (
                    <HoloButton
                      size="sm"
                      onClick={() => handleRevokeMock(m.id)}
                      disabled={revokingMockId !== null}
                      className="flex items-center gap-2 text-warning-red/90 hover:text-warning-red"
                    >
                      <FaFire />
                      {revokingMockId === m.id ? 'Revoking…' : 'Revoke'}
                    </HoloButton>
                  )}
                </div>
              </HoloPanel>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity (mock — from ideation idea.md "transaction history", MASTER_CHECKLIST) */}
      <div>
        <h2 className="text-lg font-heading font-bold text-ghost mb-3 flex items-center gap-2">
          <FaHistory className="text-prism-violet" /> Recent activity
        </h2>
        <p className="text-ghost/50 text-xs font-mono mb-3">
          Mock: activity log (ideation: transaction history without details).
        </p>
        <HoloPanel variant="elevated" size="md" className="border-prism-violet/20">
          <ul className="space-y-2 text-sm font-mono">
            {MOCK_ACTIVITY.map((a) => (
              <li key={a.id} className="flex justify-between gap-2 text-ghost/80">
                <span>{a.label}</span>
                <span className="text-ghost/50 shrink-0">{a.time}</span>
              </li>
            ))}
          </ul>
        </HoloPanel>
      </div>

      {/* Credentials (mock — from ideation idea.md "Credentials: Age, KYC - Disclosed to X apps") */}
      <div>
        <h2 className="text-lg font-heading font-bold text-ghost mb-3 flex items-center gap-2">
          <FaIdCard className="text-prism-cyan" /> Credentials
        </h2>
        <p className="text-ghost/50 text-xs font-mono mb-3">
          Mock: credentials disclosed per app (ideation: revoke credentials per context).
        </p>
        <HoloPanel variant="elevated" size="md" className="border-cyan-400/20">
          <ul className="space-y-2 text-sm font-mono">
            {MOCK_CREDENTIALS.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-ghost/80">
                <span className="text-prism-cyan">✓</span>
                <span>{c.name}</span>
                <span className="text-ghost/50">— Disclosed to {c.disclosed}</span>
              </li>
            ))}
          </ul>
        </HoloPanel>
      </div>
    </div>
  );
}
