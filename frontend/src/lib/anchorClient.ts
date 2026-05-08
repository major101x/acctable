import { BN, type Program } from "@coral-xyz/anchor";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { Acctable } from "@target/types/acctable";
import { PROGRAM_ID, FEE_RECEIVER } from "./constants";

export type LockState = { amt: BN; isCompleted: boolean };

export function lockPda(walletPublicKey: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lock"), walletPublicKey.toBuffer()],
    PROGRAM_ID
  );
  return pda;
}

export async function fetchLockState(
  program: Program<Acctable>,
  walletPublicKey: PublicKey
): Promise<LockState | null> {
  try {
    return await program.account.lockState.fetch(lockPda(walletPublicKey));
  } catch {
    return null;
  }
}

export async function lock(
  program: Program<Acctable>,
  walletPublicKey: PublicKey,
  amtLamports: number
): Promise<string> {
  return program.methods
    .lock(new BN(amtLamports))
    .accounts({ payer: walletPublicKey, feeReceiver: FEE_RECEIVER })
    .rpc();
}

export async function markComplete(
  program: Program<Acctable>,
  walletPublicKey: PublicKey
): Promise<string> {
  return program.methods
    .markComplete()
    .accounts({ payer: walletPublicKey })
    .rpc();
}

export async function unlock(
  program: Program<Acctable>,
  walletPublicKey: PublicKey
): Promise<string> {
  return program.methods
    .unlock()
    .accounts({ payer: walletPublicKey })
    .rpc();
}

export function lamportsToSol(lamports: BN): number {
  return lamports.toNumber() / LAMPORTS_PER_SOL;
}
