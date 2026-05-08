import { Buffer } from "buffer";

// Polyfill Buffer for @solana/web3.js and @coral-xyz/anchor (legacy web3.js v1)
if (typeof globalThis.Buffer === "undefined") {
  (globalThis as typeof globalThis & { Buffer: typeof Buffer }).Buffer = Buffer;
}
