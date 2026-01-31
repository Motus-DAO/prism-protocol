# What This SDK Actually Does (Technical, Honest)

**Audience:** You, judges, and future integrators.  
**Goal:** Describe precisely what privacy we provide and what we do **not** provide, so the pitch is accurate.

---

## 1. The On-Chain Reality (What Everyone Can See)

On Solana, **every transaction** exposes:

- **Fee payer / signer**: The wallet that signed the transaction (e.g. `6KeTScqyUKrzzYu4m7YpLakPt5CVhXY2ZfWe3kRmmFRd`). This is **always visible** and cannot be hidden by this (or any) program.
- **Account keys**: All accounts read or written (root identity PDA, context PDA, program ID, etc.) appear in the transaction message.

So for any `create_context`, `create_context_encrypted`, or `revoke_context`:

- An observer sees: **signer = wallet X**, **accounts = [X?, root_pda, context_pda, program]**.
- Root PDA is derived as: `PDA(program_id, ["root", user_pubkey])` → so **root_pda is tied to the signer**.
- Context PDA is derived as: `PDA(program_id, ["context", root_pda, context_index])` → so **context_pda is tied to root_pda**, hence to the signer.

**Conclusion:** Anyone who sees the transaction can link **context → root → signer**. We do **not** break that link. The signer is always visible; PDAs are derivable from the signer.

---

## 2. What “Encrypted Context” Actually Does

`create_context_encrypted` does **not** hide who signed or who owns the context. It only changes **what is stored inside the context account**:

| Field | `create_context` (plain) | `create_context_encrypted` |
|-------|---------------------------|----------------------------|
| `root_identity` | Root PDA (32 bytes) | **Zero pubkey** (so we don’t store root in the account) |
| `root_identity_hash` | `None` | Hash of root PDA (for verification) |
| `encryption_commitment` | `None` | Arcium commitment (for balance binding) |

So:

- **On-chain account data**: We don’t store the root PDA in the context account; we store a hash and a commitment. That helps with **data minimization** in the account (no plaintext root).
- **Transaction-level linking**: Unchanged. The transaction still includes the root PDA and context PDA as accounts; the signer is still the fee payer. So **linking signer ↔ root ↔ context** is still possible from the transaction log.

So “encryption” here = **encrypted/hashed storage in the context account**, not **hiding the signer or breaking the tx graph**.

---

## 3. What This SDK Actually Provides (Honest Summary)

### 3.1 Application-level context isolation

- **One root identity per wallet** (PDA: `["root", user_pubkey]`).
- **Multiple contexts per root** (PDA: `["context", root_pda, index]`), each with:
  - Spending limits (`max_per_transaction`),
  - Revocation (burn after use),
  - Optional encrypted account layout (`create_context_encrypted`).

**Privacy meaning:**  
From the **application’s** point of view, you can give “context A” to dApp 1 and “context B” to dApp 2. Each dApp only sees one address (the context PDA), not your main wallet. So we provide **context isolation at the API / UX layer**.  
We do **not** provide **on-chain unlinkability**: an analyst can still link all your contexts to the same signer via the transaction history.

### 3.2 Amount privacy: ZK solvency proof

- **Noir circuit** proves: “balance ≥ threshold” (private balance, public threshold).
- The dark pool (or any verifier) learns **only** that the user meets the threshold, not the actual balance.

**Privacy meaning:**  
**Selective disclosure of the amount** — we hide “how much” while proving “enough.” This is real **amount privacy** for the counterparty. It does not hide **who** (the signer / context owner).

### 3.3 Arcium: binding encrypted balance to a context

- Balance is **encrypted** with Arcium (X25519 + cipher), with a **commitment** tied to the context pubkey.
- Verifier sees: commitment + ZK proof (and optionally on-chain `encryption_commitment` in the context account).

**Privacy meaning:**  
The **balance ciphertext** is bound to a specific context; the plaintext balance is not exposed. So we get **encrypted balance + commitment**, not signer anonymity.

### 3.4 What we do **not** provide

- **Signer anonymity**: The wallet that signs (create root, create context, revoke) is always visible.
- **Unlinkability of contexts**: Anyone with tx history can link context PDAs to the same signer via root PDA derivation.
- **Relayer / mixer**: We don’t route your tx through a third party so that the fee payer is not your main wallet.

So we do **not** solve “hide my wallet from the chain.” We do **application-level isolation** and **amount/balance privacy** (ZK + encryption).

---

## 4. How to Pitch It (Honest Angles)

### Do say

- “**Context-based identities** so each dApp sees a different address (context PDA), not your main wallet.”
- “**ZK solvency proof**: prove you meet a balance threshold without revealing the amount.”
- “**Arcium encryption** binds the encrypted balance to a context; verifiers see a commitment + proof, not the balance.”
- “**Spending limits and one-time contexts** (create → use → revoke) to limit exposure and simplify UX.”

### Don’t say (unless you add caveats)

- “Your wallet is hidden” → No. The signer is visible.
- “Contexts are unlinkable on-chain” → No. They are linkable via signer and root PDA.
- “Encryption hides the owner” → No. It hides the balance and avoids storing root in the context account; it does not hide who signed.

### Suggested one-liner

- “Prism gives you **context isolation** (one address per use case), **amount privacy** (ZK solvency + Arcium binding), and **spending limits**; the **signer is still visible on-chain**, so we don’t claim signer anonymity.”

---

## 5. Why “Encryption” Is Still Worth Mentioning (But With Care)

- **Arcium** is used to encrypt the **balance** and bind it to a **context** (commitment). That’s real and useful for “prove solvency without revealing amount” and for binding data to a specific context.
- **Encrypted context creation** improves **account data** (no plaintext root in the context account; hash + commitment instead). It does **not** change who signs or who can be linked from the chain.

So you can pitch: “We use Arcium to encrypt balances and bind them to contexts; we also support encrypted context accounts that don’t store the root PDA.” Just don’t imply that encryption hides the signer or makes contexts unlinkable on-chain.

---

## 6. Short Technical Summary (For Judges / Docs)

- **Root identity**: PDA from `(program_id, "root", user_pubkey)`. One per wallet.
- **Context**: PDA from `(program_id, "context", root_pda, index)`. Many per root; each has limits and can be revoked.
- **Linking**: Signer → root PDA → context PDA is derivable from public data (tx + program logic). We do not break this.
- **Privacy we add**: (1) Context isolation at the app layer, (2) ZK proof of “balance ≥ threshold” without revealing balance, (3) Arcium encryption + commitment bound to context. We do **not** hide the signer or provide on-chain unlinkability of contexts.

If you want, we can add a “Limitations” subsection to the main README that points to this doc and uses the same wording.
