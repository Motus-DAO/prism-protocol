# Product Requirements Document (PRD)
## Prism Protocol - Privacy Infrastructure for Solana

**Version**: 1.0 (Hackathon MVP)  
**Date**: January 2026  
**Status**: In Development  

---

## Executive Summary

Prism Protocol is privacy infrastructure that enables context-based identities with zero-knowledge proofs on Solana. Users create multiple privacy-preserving personas for different use cases while maintaining cryptographic links to a root identity.

### Problem Statement
1. Wallet linking deanonymizes users (Solana ID exposes all activity)
2. RPC timing attacks achieve 95%+ deanonymization success
3. Wallet draining epidemic ($1B+ lost in 2025)
4. All-or-nothing credential disclosure
5. Cross-chain identity requires exposing metadata
6. No composable privacy primitives for developers

### Solution
Multi-layer privacy infrastructure with:
- Context-based identities (separate wallets per use case)
- Adaptive ZK proofs (selective disclosure)
- Anti-timing RPC proxy (defeats timing attacks)
- Disposable contexts (wallet drain protection)
- Cross-chain private attestations (via Wormhole)
- Developer SDK (5-line integration)

---

## Success Metrics

### Hackathon MVP Goals
- ✅ Create root identity in <3 seconds
- ✅ Generate ZK proof in <2 seconds
- ✅ Privacy score calculation functional
- ✅ Anti-drain catches 90%+ malicious transactions
- ✅ Cross-chain attestation works on testnet
- ✅ 3 working demo applications
- ✅ SDK with 5+ composable modules
- ✅ Documentation complete

### Post-Hackathon Metrics
- 1,000+ developers integrated SDK
- 10,000+ users created identities
- $10M+ protected from wallet draining
- 100,000+ ZK proofs generated
- 5+ chains supported

---

## MVP Features (Hackathon Scope)

### P0 Features (Must Have)

#### 1. Root Identity System
**User Story**: As a user, I want to create a soulbound root identity that controls all my contexts.

**Requirements**:
- Create root identity (one per wallet)
- Store privacy settings on-chain
- Soulbound (non-transferable)
- Persistent across all contexts

**Acceptance Criteria**:
- [ ] User can create root identity via SDK
- [ ] Root identity is soulbound (transfer fails)
- [ ] Privacy settings stored and retrievable
- [ ] Transaction completes in <3 seconds

**Technical Spec**:
```typescript
await prism.createRootIdentity({
  privacyLevel: PrivacyLevel.High,
  autoBurnThreshold: 80
});
```

---

#### 2. Context Derivation
**User Story**: As a user, I want to create separate contexts for DeFi, social, and gaming with different privacy levels.

**Requirements**:
- Create unlimited contexts per root
- Each context has unique wallet address
- Configure privacy level per context
- Set spending limits per context

**Context Types**:
- DeFi
- Social
- Gaming
- Professional
- Temporary (auto-burn)
- Public (flex mode)

**Acceptance Criteria**:
- [ ] User can create multiple contexts
- [ ] Each context derives unique address
- [ ] Privacy levels enforced
- [ ] Spending limits prevent overdraft
- [ ] Contexts can be revoked

**Technical Spec**:
```typescript
const defiContext = await prism.createContext({
  type: ContextType.DeFi,
  privacyLevel: PrivacyLevel.High,
  limits: {
    maxPerTransaction: lamports(1),
    maxPerDay: lamports(10)
  }
});
```

---

#### 3. ZK Proof Generation (2 Circuits)
**User Story**: As a user, I want to prove I'm over 21 without revealing my birthdate.

**Proofs to Implement**:
1. **Age Threshold Proof**
   - Private input: birthdate
   - Public output: boolean (is_over_threshold)
   - Disclosure modes: boolean, range, exact

2. **Balance Solvency Proof**
   - Private input: wallet balance
   - Public output: boolean (meets_threshold)
   - Disclosure modes: boolean, range, exact

**Requirements**:
- Light Protocol integration
- Groth16 proving system
- Proof generation <2 seconds
- On-chain verification <100ms

**Acceptance Criteria**:
- [ ] Age proof generates in <2s
- [ ] Balance proof generates in <2s
- [ ] Proofs verify on-chain successfully
- [ ] False proofs rejected
- [ ] Disclosure modes work correctly

**Technical Spec**:
```typescript
// Age proof
const ageProof = await prism.generateProof({
  type: ProofType.AGE_THRESHOLD,
  privateInputs: { birthdate: '1990-01-01' },
  publicInputs: { threshold: 21 },
  disclosure: 'boolean'  // Just yes/no
});

// Balance proof
const balanceProof = await prism.generateProof({
  type: ProofType.BALANCE_SOLVENCY,
  privateInputs: { balance: lamports(100) },
  publicInputs: { threshold: lamports(10) },
  disclosure: 'range'  // 10-100 range
});
```

---

#### 4. Anti-Timing RPC Proxy
**User Story**: As a user, I want my RPC requests protected from timing analysis attacks.

**Requirements**:
- Timing jitter (random delays 50-500ms)
- Request batching with decoys
- Multi-RPC routing
- Transparent to user

**Acceptance Criteria**:
- [ ] Requests have variable timing
- [ ] Decoy requests generated
- [ ] Multiple RPC endpoints used
- [ ] No noticeable latency impact (<500ms)
- [ ] Timing correlation attack defeated

**Technical Spec**:
```typescript
const prismRPC = new PrismRPC({
  endpoints: ['triton', 'helius', 'quicknode'],
  privacy: {
    timingJitter: true,
    decoyCount: 3,
    multiRPC: true
  }
});

const balance = await prismRPC.getBalance(wallet);
```

---

#### 5. Basic SDK (TypeScript)
**User Story**: As a developer, I want to integrate Prism in 5 lines of code.

**Core Functions**:
```typescript
// Identity management
prism.createRootIdentity()
prism.createContext()
prism.revokeContext()

// Proof generation
prism.generateProof()
prism.verifyProof()

// Security
prism.setSpendingLimits()
prism.emergencyBurn()

// Privacy
prism.calculatePrivacyScore()
```

**Acceptance Criteria**:
- [ ] NPM package published
- [ ] TypeScript types included
- [ ] Documentation complete
- [ ] 5-line integration works
- [ ] Error handling robust

---

#### 6. User Dashboard (Basic)
**User Story**: As a user, I want to see all my contexts and manage privacy settings.

**Features**:
- View all contexts
- Privacy score display
- Create new contexts
- Revoke contexts
- Update privacy settings

**UI Requirements**:
- Responsive (mobile + desktop)
- Privacy score visualization
- Context cards with stats
- One-click revoke
- Warning for risky actions

**Acceptance Criteria**:
- [ ] Dashboard renders contexts
- [ ] Privacy score calculates correctly
- [ ] Can create/revoke contexts
- [ ] Mobile-responsive
- [ ] Loading states work

---

#### 7. Demo Applications (3)
**User Story**: As a hackathon judge, I want to see Prism working in real scenarios.

**Demo 1: Anonymous DAO Voting**
- Connect with governance context
- Prove token holding threshold
- Vote without revealing amount
- Show privacy maintained

**Demo 2: Anti-Drain Protection**
- Visit "malicious" site
- Auto-create disposable context
- Simulate drain attempt
- Show main wallet protected

**Demo 3: Cross-Chain Attestation**
- Create credential on Solana
- Export via Wormhole
- Verify on Ethereum testnet
- Show privacy preserved

**Acceptance Criteria**:
- [ ] All 3 demos functional
- [ ] Clear UX flow
- [ ] Privacy benefits visible
- [ ] No errors during demo
- [ ] <3 minute demo time

---

### P1 Features (Nice to Have)

#### 8. Prism Name Service (Basic)
**User Story**: As a user, I want one name that works across all chains.

**MVP Scope**:
- Register name.prism on Solana
- Map to one context
- Basic resolution

**Deferred to Post-MVP**:
- Multi-chain resolution
- Context-aware resolution
- Linked names (name.sol, name.eth)

---

#### 9. Privacy Score Algorithm
**User Story**: As a user, I want to know how private my identity is.

**Scoring Factors**:
- Context isolation (0-30 points)
- Credential disclosure (0-25 points)
- Network privacy (0-20 points)
- Transaction patterns (0-15 points)
- Cross-chain exposure (0-10 points)

**Acceptance Criteria**:
- [ ] Score calculates correctly
- [ ] Visual representation clear
- [ ] Warnings for risky behavior
- [ ] Suggestions for improvement

---

#### 10. Transaction Simulation
**User Story**: As a user, I want to see what a transaction will do before signing.

**MVP Scope**:
- Basic simulation (balance changes)
- Risk scoring (low/medium/high)
- Warning for suspicious patterns

**Deferred to Post-MVP**:
- Advanced simulation (all account changes)
- ML-based risk detection
- Community reporting integration

---

### P2 Features (Post-Hackathon)

#### 11. Cross-Chain PNS (Full)
- Multi-chain resolution
- Context-aware mapping
- Linked external names
- Wormhole integration

#### 12. Advanced ZK Circuits
- Reputation proofs
- Membership proofs
- Credential aggregation
- Recursive SNARKs

#### 13. Mobile SDK
- React Native support
- Biometric authentication
- Offline proof generation
- Push notifications

#### 14. Social Recovery
- Guardian system
- Multi-sig recovery
- Time-locked revocation
- Emergency lockdown

#### 15. Developer Console
- Analytics dashboard
- Usage tracking
- Billing integration
- API playground

---

## Technical Requirements

### Smart Contracts (Solana/Anchor)

**Program 1: Root Identity**
- Account size: 147 bytes
- Instructions: create_root, update_settings
- PDAs: seeds = ["root", user_pubkey]

**Program 2: Context Manager**
- Account size: 189 bytes per context
- Instructions: create_context, revoke_context, update_limits
- PDAs: seeds = ["context", root_pda, context_type]

**Program 3: Credential Registry**
- Account size: 161 bytes per credential
- Instructions: issue_credential, verify_credential, revoke_credential
- PDAs: seeds = ["credential", holder, credential_type]

### ZK Circuits (Circom)

**Circuit 1: Age Threshold**
- Constraints: ~5,000
- Proving time: <2s
- Proof size: 128 bytes

**Circuit 2: Balance Solvency**
- Constraints: ~3,000
- Proving time: <1s
- Proof size: 128 bytes

### SDK (TypeScript)

**Package**: @prism-protocol/sdk
- Size: <50kb (minified)
- Dependencies: @solana/web3.js, @lightprotocol/sdk, @arcium/client
- Browser support: Chrome, Firefox, Safari (latest 2 versions)
- Node support: 18+

### Infrastructure

**RPC Endpoints**:
- Triton (primary)
- Helius (fallback)
- QuickNode (fallback)

**Testnet Deployment**:
- Solana Devnet
- Ethereum Sepolia
- Polygon Mumbai

**Mainnet Requirements** (Post-Hackathon):
- Solana Mainnet
- Ethereum Mainnet
- Multi-chain support

---

## User Flows

### Flow 1: First-Time User Setup

1. User visits Prism dashboard
2. Connects Phantom wallet
3. Clicks "Create Identity"
4. Prism creates root identity
5. Suggests creating first context
6. User creates DeFi context
7. Dashboard shows privacy score
8. User ready to connect to dApps

**Time**: ~2 minutes

---

### Flow 2: Anonymous dApp Connection

1. User visits dApp (e.g., Jupiter)
2. Clicks "Connect Wallet"
3. Prism detects new site
4. Offers to create DeFi context
5. User approves
6. Context created with spending limits
7. dApp connected to context (not root)
8. User trades privately

**Time**: ~30 seconds

---

### Flow 3: Proof Generation

1. dApp requests age verification
2. Prism shows proof request dialog
3. User reviews disclosure (boolean vs. exact)
4. User approves minimal disclosure
5. ZK proof generated (<2s)
6. Proof sent to dApp
7. dApp verifies on-chain
8. Access granted

**Time**: ~5 seconds

---

### Flow 4: Wallet Drain Protection

1. User clicks phishing link
2. Prism detects unknown domain
3. Shows risk warning
4. Auto-creates disposable context
5. Sets strict spending limits (0.5 SOL max)
6. Malicious site tries to drain
7. Prism blocks transaction
8. Context burned, main wallet safe

**Time**: ~10 seconds (user saved!)

---

## Non-Functional Requirements

### Performance
- Root identity creation: <3s
- Context creation: <1s
- ZK proof generation: <2s
- Transaction confirmation: <5s (typical Solana)
- Privacy score calculation: <500ms
- Dashboard load time: <2s

### Security
- All private keys remain in user wallet
- No private data stored unencrypted
- ZK proofs cryptographically sound
- Spending limits enforced on-chain
- Emergency burn mechanism

### Scalability
- Unlimited contexts per user
- 100+ credentials per identity
- Support 10,000+ users (MVP)
- Support 1M+ users (mainnet)

### Availability
- 99.9% uptime target
- Graceful degradation if RPC down
- Offline proof generation (post-MVP)
- Multi-region deployment

### Usability
- <5 minute learning curve
- Mobile-responsive
- Accessible (WCAG AA)
- Multilingual (post-MVP)

---

## Testing Requirements

### Unit Tests
- [ ] All SDK functions
- [ ] Smart contract instructions
- [ ] ZK circuit logic
- [ ] Privacy scoring algorithm

### Integration Tests
- [ ] End-to-end user flows
- [ ] Cross-chain attestations
- [ ] RPC proxy functionality
- [ ] Transaction simulation

### Security Tests
- [ ] Penetration testing
- [ ] ZK proof verification
- [ ] Spending limit enforcement
- [ ] Emergency burn mechanism

### User Testing
- [ ] 10+ user testers
- [ ] Usability feedback
- [ ] Performance benchmarks
- [ ] Browser compatibility

---

## Dependencies

### External Services
- Solana RPC (Triton, Helius)
- Light Protocol (ZK compression)
- Arcium (MPC encryption)
- Wormhole (cross-chain)

### Libraries
- @solana/web3.js (required)
- @coral-xyz/anchor (required)
- @lightprotocol/sdk (required)
- @arcium-hq/client (required)
- @certusone/wormhole-sdk (optional)

### Development Tools
- Anchor CLI
- Circom compiler
- Solana CLI
- TypeScript
- React
- Next.js

---

## Timeline (7-Day Hackathon)

### Day 1: Foundation
- ✅ Project setup
- ✅ Anchor program structure
- ✅ Root identity implementation
- ✅ Basic tests

### Day 2: Context System
- Context derivation logic
- Spending limits enforcement
- Privacy level implementation
- Context revocation

### Day 3: ZK Proofs
- Age threshold circuit
- Balance solvency circuit
- Light Protocol integration
- On-chain verification

### Day 4: Anti-Timing RPC
- RPC proxy implementation
- Timing jitter logic
- Decoy generation
- Multi-RPC routing

### Day 5: SDK Development
- Core SDK functions
- TypeScript types
- React hooks
- NPM package setup

### Day 6: User Dashboard
- Context management UI
- Privacy score display
- Settings panel
- Mobile responsive

### Day 7: Demos & Polish
- 3 demo applications
- Documentation
- Demo script
- Video recording

---

## Risk Management

### Technical Risks

**Risk**: ZK proof generation too slow
- Mitigation: Use Light Protocol's optimized circuits
- Fallback: Implement proof batching

**Risk**: RPC timing attacks still work
- Mitigation: Increase jitter, more decoys
- Fallback: Implement Tor routing

**Risk**: Cross-chain attestations fail
- Mitigation: Thorough Wormhole testing
- Fallback: Demo single-chain only for MVP

### Product Risks

**Risk**: Users don't understand privacy benefits
- Mitigation: Clear UX, privacy score visualization
- Fallback: Educational tooltips and guides

**Risk**: Developers find SDK too complex
- Mitigation: 5-line integration examples
- Fallback: Pre-built components

**Risk**: Performance too slow for production
- Mitigation: Optimize critical paths
- Fallback: Queue non-critical operations

---

## Success Criteria

### Must Have for Submission
- [ ] All P0 features implemented
- [ ] 3 working demos
- [ ] Documentation complete
- [ ] No critical bugs
- [ ] Code on GitHub
- [ ] Demo video recorded

### Nice to Have
- [ ] P1 features implemented
- [ ] Advanced ZK circuits
- [ ] Mobile-optimized
- [ ] Cross-chain working

### Judging Criteria Alignment

**Track 02: Privacy Tooling**
- ✅ Solves real privacy problems
- ✅ Developer infrastructure (SDK)
- ✅ Technical innovation (contexts, ZK, anti-timing)
- ✅ Composable with ecosystem

**Bonus Points**
- ✅ Security innovation (anti-drain)
- ✅ Cross-chain support
- ✅ Clear UX
- ✅ Open source

---

## Future Roadmap (Post-Hackathon)

### Q1 2026: Mainnet Launch
- Audit smart contracts
- Audit ZK circuits
- Launch on Solana mainnet
- Launch on Ethereum mainnet

### Q2 2026: Ecosystem Growth
- 10+ dApp integrations
- Mobile SDK release
- Developer grants program
- Community governance

### Q3 2026: Advanced Features
- Social recovery
- Hardware wallet support
- Biometric authentication
- Advanced ZK circuits

### Q4 2026: Scale
- Multi-chain expansion
- Decentralized RPC network
- Identity marketplace
- Enterprise features

---

## Appendix

### Glossary
- **Root Identity**: Soulbound master identity (one per user)
- **Context**: Derived identity for specific use case
- **ZK Proof**: Zero-knowledge proof of credential
- **PDA**: Program Derived Address (Solana)
- **Soulbound**: Non-transferable token/identity

### References
- [Solana Attestation Service](https://solana.com/news/solana-attestation-service)
- [Light Protocol Docs](https://docs.lightprotocol.com)
- [Arcium MPC](https://docs.arcium.com)
- [Wormhole Bridge](https://docs.wormhole.com)
- [Self Protocol MDIP](https://docs.selfid.com/mdip)

---

**Document Owner**: Prism Protocol Team  
**Last Updated**: January 2026  
**Next Review**: Post-Hackathon
