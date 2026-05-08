# Acctable

Lock SOL until you finish what you said you would.

**Live demo:** https://acctable-solana.vercel.app

---

## How it works

1. **Lock** — Deposit SOL into a personal on-chain vault. A 3% protocol fee is taken upfront and the rest is held in a PDA until you're done.
2. **Complete** — Self-attest that your tasks are finished by calling `mark_complete`. This flips a flag on-chain that gates the unlock.
3. **Unlock** — Call `unlock` to close the vault and get your lamports back. The instruction enforces `is_completed == true`. No way around it.

No partial unlocks. No time-based release. You either finished or you didn't.

---

## Stack

- **Program:** Anchor 0.32.1 · Rust · Solana devnet
- **Program ID:** `9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi`
- **Frontend:** React 19 · Vite 8 · Tailwind CSS v4 · TypeScript 6
- **Wallets:** Phantom, Solflare
- **Tests:** LiteSVM 0.2.0 · ts-mocha · Chai

---

## Project structure

```
acctable/
├── programs/acctable/   # Anchor program (Rust)
│   └── src/
│       ├── instructions/   # lock, unlock, mark_complete
│       ├── state.rs        # LockState account
│       └── errors.rs
├── tests/               # TypeScript integration tests (LiteSVM)
├── app/                 # CLI client (tsx)
├── frontend/            # React SPA
└── Anchor.toml
```

---

## Prerequisites

- Rust (stable) + cargo
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor CLI 0.32.1](https://www.anchor-lang.com/docs/installation)
- Node ≥ 18 + yarn

---

## Quick start

**Build the program:**
```sh
anchor build
```

**Run tests:**
```sh
yarn test
```

**Run the frontend:**
```sh
cd frontend
yarn
yarn dev
```

**CLI client (devnet):**
```sh
cp .env.example .env   # fill in FEE_RECEIVER
yarn client status
yarn client lock 1
yarn client complete
yarn client unlock
```

---

## Program instructions

| Instruction     | Signer     | What it does                                              |
|-----------------|------------|-----------------------------------------------------------|
| `lock(amt)`     | Anyone     | Creates PDA vault `[b"lock", payer]`, deposits `amt * 97%`, sends `amt * 3%` to fee receiver |
| `mark_complete` | Payer only | Sets `lock.is_completed = true` on the caller's vault     |
| `unlock`        | Payer only | Closes vault and returns all lamports (requires `is_completed`) |

---

## Network

Deployed to **devnet**. The frontend uses `https://api.devnet.solana.com`.

To test with the CLI, airdrop yourself devnet SOL first:
```sh
solana airdrop 2
```

---

## What I Learned

**Anchor PDAs and account lifecycle.** Seeds derive a deterministic address `[b"lock", payer.key()]` that no private key controls, so only the program can sign for it. `init` allocates and pays rent in one step; `close = payer` drains the lamports back on unlock.

**CPIs for moving lamports.** The `lock` instruction fans out a single transfer into two: one to the PDA vault, one to the fee receiver. Both go through `system_program::transfer` via CPI. Doing the math before either transfer matters. If you split after the first transfer, the account balance has already changed. I initially planned on using the system instruction method or the sol transfer method but I wasnt making a complex call so i chose the one with the highest abstraction.

**Anchor constraints as on-chain guards.** The unlock instruction uses a custom `constraint = lock.is_completed` directly in the `#[account]` macro. If the constraint fails, Anchor rejects the transaction before the handler runs. No runtime `if` needed. The check is part of account validation.

**LiteSVM for fast local tests.** LiteSVM emulates the SVM in-process. Tests run in milliseconds with no validator process to spin up. I had to downgrade the version to ensure compatibility with solana/web3.js. It's close enough to real behavior for unit and integration testing but doesn't catch everything (e.g., compute budget behavior differs slightly).

**Connecting Anchor to React.** The bridge is `AnchorProvider` (wraps an RPC connection and a wallet) feeding into `new Program(idl, provider)`. The IDL drives type inference, so `program.methods.lock(new BN(amt))` is fully typed end-to-end. Wallet-adapter supplies the signer; everything else is standard Anchor.

**Polyfilling for the browser.** Solana's JS libraries were built for Node — they assume `Buffer`, `process`, and `global`. Vite 8 uses rolldown which broke `vite-plugin-node-polyfills`. The fix was manual: `define: { global: "globalThis", "process.env": "{}" }` in `vite.config.ts` plus a `polyfills.ts` that imports `buffer` and patches `window.Buffer` before anything else loads.

---

## Challenges

**`init` + `mut` conflict.** Anchor's `init` constraint already implies mutability. You can't also mark an account `mut`. The compiler error is cryptic. Fix: remove `mut` from any `init` account.

**Payer needs more SOL than you think.** When locking 1 SOL, the payer needs ~2 SOL in the test. Anchor's `init` deducts rent (~0.0009 SOL) from the payer *before* the instruction handler runs, so the CPI transfer has to succeed on a slightly lower balance than you passed in.

**LiteSVM keeps 0-lamport accounts.** After `close = payer`, real Solana deletes the account. LiteSVM 0.2.0 keeps it around with 0 lamports. Asserting `getAccount() === null` fails. The correct check is `account.lamports === 0`.

**LiteSVM error shape.** `FailedTransactionMetadata.err()` returns `{}` in 0.2.0, not a structured error code. To assert a specific program error fired (e.g., `TasksNotCompleted`), check `result.meta().logs()` for the string `"Error Number: 6000"`.

**Vite 8 + rolldown broke the Node polyfill plugin.** `vite-plugin-node-polyfills` hard-crashed at build time with Vite 8's new bundler. Switched to manual polyfilling (see above). Had to import `polyfills.ts` as the *first* line in `main.tsx`. Wallet-adapter modules read `Buffer` at import time, not call time.

**`ts-node` has no ESM loader here.** The CLI client (`app/`) is ESM. `ts-node` with `--esm` produced loader errors with this Node version. Switched to `tsx`, which handles ESM TypeScript transparently.

**ESM module init order.** The fee receiver address was declared as a module-level constant in `client.ts`, initialized at import time. before `dotenv/config` ran in `index.ts`. The constant read `process.env.FEE_RECEIVER` as `undefined`. Fix: pass it as a constructor parameter so it's evaluated lazily, after dotenv has loaded.

**TypeScript 6 deprecated `baseUrl`.** TS6 warns when you use `baseUrl` without a corresponding `paths` entry. The fix is `"ignoreDeprecations": "6.0"` in `tsconfig.app.json`.
