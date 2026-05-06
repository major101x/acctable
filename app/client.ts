import { AnchorProvider, BN, Program, Wallet, setProvider } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import idl from "../target/idl/acctable.json" with { type: "json" };
import type { Acctable } from "../target/types/acctable.js";

export const PROGRAM_ID = new PublicKey("9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi");

// Developer's treasury — receives 3% fee on every lock. Set via FEE_RECEIVER env var.
export const FEE_RECEIVER = new PublicKey(
  process.env.FEE_RECEIVER ?? "11111111111111111111111111111111"
);

export type LockState = { amt: BN; isCompleted: boolean };

export class AnchorClient {
  program: Program<Acctable>;
  payer: Keypair;

  constructor(connection: Connection, payer: Keypair) {
    const provider = new AnchorProvider(connection, new Wallet(payer), {
      commitment: "confirmed",
    });
    setProvider(provider);
    this.program = new Program(idl as Acctable, provider);
    this.payer = payer;
  }

  lockPda(): PublicKey {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("lock"), this.payer.publicKey.toBuffer()],
      PROGRAM_ID
    );
    return pda;
  }

  async fetchLockState(): Promise<LockState | null> {
    try {
      return await this.program.account.lockState.fetch(this.lockPda());
    } catch {
      return null;
    }
  }

  async lock(amtLamports: number): Promise<string> {
    // TODO(human): implement this method
    //
    // Build and send the lock instruction using Anchor's fluent method API.
    //   1. Call this.program.methods.lock(new BN(amtLamports))
    //   2. Chain .accounts({ payer, feeReceiver }) — lock PDA + systemProgram are auto-resolved
    //   3. Chain .rpc() — this signs with the provider wallet, sends, and awaits confirmation
    // Return the transaction signature string.
    const tx = this.program.methods.lock(new BN(amtLamports))
    .accounts({
      payer: this.payer.publicKey,
      feeReceiver: FEE_RECEIVER,
    }).rpc()

    return tx;
  }

  async markComplete(): Promise<string> {
    return this.program.methods
      .markComplete()
      .accounts({ payer: this.payer.publicKey })
      .rpc();
  }

  async unlock(): Promise<string> {
    // Note: requires lock.is_completed == true on-chain. Currently no on-chain
    // instruction exists to flip is_completed — this is a future program upgrade.
    return this.program.methods
      .unlock()
      .accounts({
        payer: this.payer.publicKey,
      })
      .rpc();
  }
}
