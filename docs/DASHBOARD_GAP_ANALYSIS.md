# Dashboard Gap Analysis: Prism vs Privy & Supabase

**Purpose**: Deep analysis of Prism’s current dashboard structure and a feature-by-feature comparison with “complete” developer dashboards (Privy, Supabase) to identify gaps and priorities.

**Status**: Current dashboards look strong for an MVP; this doc outlines what’s missing to reach “complete dashboard” parity.

---

## 1. Current Prism Dashboard Structure

### 1.1 Architecture

| Layer | Implementation |
|-------|----------------|
| **Routes** | `/dashboard` (Dev Settings), `/user` (My Identity) — separate pages |
| **Layout** | Per-page: fixed nav (Home, Demo, Dashboard/My identity), full-width main, footer |
| **State** | Component-level React state; no global dashboard state or URL-driven section |
| **Auth** | Wallet-only (Phantom, Solflare); no email/team login for “dashboard account” |

### 1.2 Developer Settings Dashboard (`/dashboard`)

**Sections (sidebar + main):**

| Section | Purpose | Data source |
|--------|---------|-------------|
| **Overview** | Single scroll: RPC, Program, Arcium, Context Types, Parameters, Config Snippet | Env + SDK + local state |
| **RPC & Network** | RPC URL (masked), source | `NEXT_PUBLIC_SOLANA_RPC_URL` |
| **Program** | Program ID, network | Constant (devnet) |
| **Arcium MPC** | MXE address, cluster ID, mode, initialized | Env + `prism.getArciumStatus()` |
| **Context Types** | Table of types (DeFi, Social, …) + example use | Static labels |
| **Parameters** | Context type, max SOL, ZK threshold, commitment, privacy level; **live snippet** | Local state → generated code |
| **Config Snippet** | Static env + init snippet | Constant |

**Strengths:**

- Clear split: developer config vs end-user identity.
- Overview gives “everything in one place” without losing detail in dedicated sections.
- Parameters drive a **live code snippet** (copy-paste ready).
- Mobile: collapsible sidebar overlay.
- Desktop: fixed sidebar, scrollable main.

**Gaps (see Section 3):**

- No app/project model (single “demo app” only).
- No API keys or secrets management.
- No usage/analytics.
- No team/roles.
- No docs/help inline.
- No environment switcher (dev/staging/prod).

### 1.3 User Dashboard (`/user`)

**Sections (single scroll):**

| Section | Purpose | Data source |
|--------|---------|-------------|
| **Root identity** | Root PDA, context count, demo (mock) count | On-chain via `usePrismProgram` + mock |
| **Privacy score** | Score 0–100 + recommendations | Mock (ideation: “Privacy Leakage Score”) |
| **Create new context** | App, type, max SOL; Create (on-chain) / Add demo | On-chain + local mock state |
| **My contexts** | List of on-chain + mock contexts; revoke | On-chain + mock |
| **Recent activity** | List of actions + time | Mock |
| **Credentials** | List “disclosed to X apps” | Mock |

**Strengths:**

- Clear narrative: identity → score → create context → list contexts → activity → credentials.
- Real on-chain: root PDA, context count, create/revoke.
- Mock sections (score, activity, credentials) show intended UX and align with ideation.

**Gaps:**

- No real privacy score backend.
- No real activity log (indexer/events).
- No real credentials/disclosure tracking.
- No “per-app” dashboard (e.g. “Apps using my identity”).
- No export/download (e.g. context list, activity CSV).

---

## 2. What Privy & Supabase Dashboards Offer

### 2.1 Privy (dashboard.privy.io)

| Area | Features |
|------|----------|
| **App model** | Multiple apps per account; app dropdown in nav; separate config per app |
| **Credentials** | **App ID** (public), **App Secret** (backend-only); copy, regenerate, rotate |
| **Auth config** | Login methods: email OTP, social, embedded wallets, MFA; enable/disable per method |
| **Appearance** | Branding, theme, custom CSS for login UI |
| **Team** | **Team** page: invite members; roles **Admin / Developer / Viewer**; permissions (create apps, API keys, manage admins) |
| **Security** | Dashboard MFA, SSO for team |
| **Docs** | Dashboard links into docs (create app, login methods, app clients, teammate roles, MFA) |

**Takeaways:**

- One dashboard, many **apps**; each app has its own credentials and config.
- Credentials and auth configuration are first-class.
- Team and roles are built in.
- Strong “get started” flow: create app → get keys → configure login → integrate.

### 2.2 Supabase (supabase.com/dashboard)

| Area | Features |
|------|----------|
| **Project model** | Multiple **projects** per org; project switcher; per-project settings |
| **API keys** | **Publishable** (anon) vs **Secret** (service_role); multiple keys; enable/disable; copy |
| **Database** | Table editor, SQL editor, migrations, backups, extensions |
| **Auth** | Providers, email templates, MFA, JWT settings, **Auth audit logs** |
| **Storage** | Buckets, policies, CDN |
| **Logs** | **Logs Explorer**: API, Postgres, Auth, Storage, Realtime, Edge Functions; search, filters |
| **Reports** | Database usage, API usage, storage (billing/quotas) |
| **Settings** | General, API, Database, Auth, Storage, Billing |
| **Account** | Org/team, **Account audit logs** (cross-project) |

**Takeaways:**

- Project-centric; everything (DB, Auth, Storage, Logs) is scoped to a project.
- Observability is central: logs, reports, audit logs.
- Keys and env are explicit (publishable vs secret, multiple keys).

---

## 3. Feature Comparison Matrix

| Feature | Prism (current) | Privy | Supabase | Priority for Prism |
|--------|------------------|-------|----------|--------------------|
| **App / project model** | Single implicit “demo” app | Multiple apps, app switcher | Multiple projects, project switcher | **High** – needed for multi-env and “complete” feel |
| **API keys / secrets** | None (env only) | App ID + App Secret, rotate | Publishable + secret, multiple | **High** – expected for any dev dashboard |
| **Config per app** | One global config | Per-app config | Per-project config | **High** (with app model) |
| **Environment switcher** | None | Separate apps per env | Project = env | **Medium** – dev/staging/prod |
| **Team / roles** | None | Admin, Developer, Viewer | Org + roles | **Medium** – post-MVP |
| **Usage / analytics** | None | Implied (users, apps) | Logs, reports, quotas | **Medium** – “how much am I using?” |
| **Audit / activity log** | Mock “Recent activity” (user) | — | Auth + account audit logs | **Medium** – real events for dev + user |
| **Inline docs / help** | None | Links to docs per section | Docs + in-dashboard hints | **Low–Medium** – “How do I…?” |
| **Copy snippets** | Parameters + config snippet | — | SQL, code samples | **Done** – strong already |
| **Live code gen** | Parameters → snippet | — | — | **Done** – differentiator |
| **User-facing dashboard** | User Dashboard (identity, contexts) | N/A (auth provider) | N/A (BaaS) | **Done** – Prism-specific strength |
| **Privacy score** | Mock | N/A | N/A | **Medium** – real score when backend exists |
| **Credentials (user)** | Mock “Credentials” | N/A | N/A | **Low** – when ZK/credentials product exists |

---

## 4. What We’re Missing (Summary)

### 4.1 Developer Dashboard (`/dashboard`)

1. **App/project abstraction**  
   - No “Create app” or “Select app”; no app-scoped config.  
   - **Target**: Multiple apps (e.g. “Demo”, “Staging”, “Production”), each with own RPC, program, Arcium, parameters.

2. **API keys / secrets**  
   - No App ID, no secret key, no rotate/copy in UI.  
   - **Target**: At least “App ID” (public) + “API key” or “Secret” (masked, copy, regenerate), stored per app (or env).

3. **Environment switcher**  
   - No dev/staging/prod.  
   - **Target**: Dropdown or tabs (e.g. Devnet / Mainnet) or per-app “Environment” that drives RPC and program.

4. **Usage / analytics**  
   - No requests, proofs generated, contexts created, etc.  
   - **Target**: Simple “Usage” section: e.g. contexts created (this app), proofs generated, RPC calls (if we ever proxy).

5. **Team / roles**  
   - Single user (wallet).  
   - **Target**: Post-MVP: invite teammates, roles (e.g. Admin / Developer / Viewer) for dashboard access.

6. **Inline help**  
   - No “What is Arcium?” or “How do I get MXE?” in the UI.  
   - **Target**: Short tooltips or “Learn” links next to RPC, Arcium, Parameters, Config Snippet.

### 4.2 User Dashboard (`/user`)

1. **Real privacy score**  
   - Currently mock.  
   - **Target**: When backend exists: real score + recommendations from leakage model.

2. **Real activity log**  
   - Currently mock.  
   - **Target**: Events from indexer or RPC (context created/revoked, proof generated, etc.) with time and type.

3. **Real credentials**  
   - Currently mock.  
   - **Target**: When ZK/credentials product exists: which credentials exist and to which apps they were disclosed.

4. **“Apps using my identity”**  
   - Not surfaced.  
   - **Target**: List of apps (or contexts) that have used this identity, with last used / permission summary.

5. **Export**  
   - None.  
   - **Target**: Export context list or activity (e.g. CSV/JSON) for transparency.

### 4.3 Cross-cutting

1. **Unified nav**  
   - Dashboard and User are separate pages; no single “Dashboard” shell with “Dev” vs “My identity” as tabs/sections.  
   - **Target**: Optional: one layout with sidebar “Dev settings” and “My identity” (and later “Team”, “Billing”).

2. **Dashboard account**  
   - No login beyond wallet; no “Prism account” (email/SSO) for team or billing.  
   - **Target**: Post-MVP: sign in to dashboard (e.g. Privy/email) for team and app management.

---

## 5. Prioritized Recommendations

### Phase 1 – “Complete” developer dashboard (Privy/Supabase-like)

1. **App model (local first)**  
   - Add “Apps” in Dev Dashboard: create/select app (name, optional env).  
   - Store in localStorage or state: `currentAppId`, `apps: { id, name, env, rpcUrl?, programId? }`.  
   - Sidebar or header: app switcher.  
   - All config (RPC, Program, Arcium, Parameters) and snippet are per-app.

2. **API keys section**  
   - Per app: “App ID” (public, copy), “API Key” (masked, copy, “Regenerate”).  
   - For MVP, keys can be client-generated UUIDs stored in localStorage; later replace with backend-issued keys.

3. **Environment switcher**  
   - Per app or global: Devnet / Mainnet (or “Custom”) that sets default RPC and program ID.  
   - Snippet and Parameters reflect selected env.

4. **Inline help**  
   - Small “?” or “Learn” next to Arcium, Parameters, Config Snippet linking to docs (e.g. `docs/README.md`, SDK docs).

### Phase 2 – Observability and polish

5. **Usage (mock then real)**  
   - “Usage” section: contexts created, proofs generated (from SDK or backend when available).  
   - Start with mock counts; replace with real when we have indexer/API.

6. **Real activity (user)**  
   - Replace mock “Recent activity” with real events (context created/revoked, proof generated) from indexer or RPC.

7. **Unified shell (optional)**  
   - Single layout: top nav “Prism” | Home | Demo | **Dashboard** (dropdown: Dev settings | My identity).  
   - Dashboard route becomes `/dashboard` (dev) and `/dashboard/identity` or `/user` (user); same chrome, different content.

### Phase 3 – Scale and teams

8. **Team and roles**  
   - Backend: org, members, roles.  
   - Dashboard: “Team” page, invite, role-based visibility (e.g. Viewer can’t regenerate API keys).

9. **Dashboard account**  
   - Email/SSO login for dashboard (not just wallet) so team and billing are stable.

10. **Real privacy score and credentials**  
    - When product supports it: real score backend, real credentials and disclosure list.

---

## 6. What’s Already Strong (Keep It)

- **Two-dashboard split** (Dev vs User) matches “developer config” vs “end-user identity” and is a strength.
- **Overview + deep sections** in Dev Dashboard (single scroll + sidebar) is clear and comparable to “overview + settings” in Supabase/Privy.
- **Live parameter-driven snippet** is a differentiator; keep and extend (e.g. per-env, per-app).
- **User Dashboard** narrative (identity → score → create → list → activity → credentials) and use of mock data for score/activity/credentials is the right UX target; replace mocks with real data when backend exists.
- **Mobile**: collapsible sidebar and single-column layout are in good shape.
- **Visual design**: HoloPanel, prism colors, consistent typography already feel “dashboard-grade.”

---

## 7. Conclusion

**Current state**: Prism already has a clear, usable Dev Settings Dashboard and User Dashboard that communicate the product and support the demo. The main gaps versus “complete” dashboards like Privy and Supabase are:

- **App/project model** and **API keys** (and optionally **environment switcher** and **inline help**) for the developer dashboard.
- **Real data** for activity, privacy score, and credentials on the user side when backend exists.
- **Team/roles** and **dashboard account** as post-MVP scale features.

Implementing **Phase 1** (app model, API keys, env switcher, inline help) would bring Prism’s developer dashboard to “complete dashboard” parity for an MVP, while keeping the current strengths and the distinct user-facing identity dashboard.
