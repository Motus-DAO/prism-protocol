# Dark Pools and Solana: Why Prism Matters

Prism: **one identity refracts into many context-bound personas** (like light into colors). This doc explains what dark pools are, the problem they solve in traditional finance, and **why that problem is even harder on Solana**—and how Prism bridges the gap with context isolation and ZK solvency proofs.

---

## What Dark Pools Are

Dark pools are private trading venues where large institutional investors can buy and sell securities without exposing their orders to the public market. Think of them as "private stock exchanges" for big players.

---

## The Core Problem They Solve: Price Impact

When a whale (institutional investor) wants to buy or sell a huge position on a public exchange (e.g. NYSE, NASDAQ):

- **Public order books** show everyone what's being bought and sold.
- Other traders see the massive order and react immediately.
- **Price moves against you** — if you're buying, price goes up; if selling, price goes down.
- You get worse execution: a 500,000-share order can cost millions more than it should.

This is **market impact**: your own order moves the price against you. Dark pools reduce that by hiding orders until after execution.

---

## How Dark Pools Work (TradFi)

Rough flow:

1. **Order submission** — Institutional investor wants to sell 500,000 shares.
2. **Hidden matching** — Order goes to a dark pool where it sits invisible to the public.
3. **Price reference** — Orders are pegged to public market prices (e.g. midpoint between bid and ask).
4. **Matching** — When another large counterparty appears, the pool matches them.
5. **Execution** — Trade happens at the midpoint; both sides get filled without moving the public market.
6. **Reporting** — After execution, the trade is reported to regulators and appears on the public tape—by then it's done.

**Why institutions use them:** anonymity until execution, better prices (less slippage), full execution of large orders, and no front-running from HFTs seeing your order.

---

## Types of Dark Pools

1. **Broker-dealer pools** (e.g. Goldman Sachs SigmaX, Credit Suisse CrossFinder) — Run by investment banks; match their own clients' orders internally.
2. **Agency broker pools** — Act as agents, not principals; use NBBO (National Best Bid Offer) pricing.
3. **Exchange-owned pools** (e.g. NYSE Euronext, SwissAtMid) — Run by traditional exchanges; more regulated.

As of February 2022, nearly half of all US stock trading occurred in dark pools and off-exchange venues. For certain stocks, dark pool volume has exceeded 50% on some days.

---

## The Crypto / Solana Gap

**Traditional dark pools hide orders before execution. On Solana, everything is public.**

- Balances, history, and counterparties are visible on-chain.
- There is no native "dark pool" in the sense of hidden order books and post-trade reporting.
- To participate in private or gated venues, you often have to **prove solvency**—and today that usually means **revealing** your balance or wallet, which defeats the purpose and recreates front-running and market-impact risk.

So: **TradFi dark pools hide orders before execution. On Solana, even after execution everything is visible.** That's the gap.

---

## What Prism Does on Solana

Prism doesn't replicate TradFi dark pools literally. It provides the **privacy primitives** that make dark-pool-style use cases possible on-chain:

- **Context isolation** — You use a disposable context (derived address) for the venue, not your main wallet. Your main balance and history stay off the table.
- **ZK solvency proofs** — You prove "balance ≥ threshold" (e.g. "I have at least $10K") without revealing your actual balance. The venue gets assurance, not your full exposure.
- **Arcium encryption** — Balances are encrypted and bound to that context; verification uses commitments and proofs, not plaintext amounts.

So: **prove solvency without revealing your balance; trade in a context that doesn't leak your full identity or activity.** That's the dark-pool-like guarantee Prism is aiming for on Solana.

---

## Summary

| TradFi dark pools | Solana today | Prism's role |
|-------------------|--------------|--------------|
| Hide orders before execution | All balances and history public | Context + ZK + encryption so you prove "enough" without revealing "how much" or "who" (main wallet) |
| Post-trade reporting | Everything visible on-chain | Isolated context and selective disclosure limit what's exposed |
| Reduce market impact / front-running | Revealing balance = front-running risk | ZK solvency + context isolation bridge the gap |

For the technical flow (context → encryption → proof → verification), see the main [README](../README.md) and [ARCIUM_CRYPTOGRAPHIC_FLOW.md](./ARCIUM_CRYPTOGRAPHIC_FLOW.md).
