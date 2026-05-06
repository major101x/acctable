import { FailedTransactionMetadata, LiteSVM } from "litesvm";
import { expect } from "chai";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import idl from "../target/idl/acctable.json" with {type: "json"};
import { BN, BorshAccountsCoder, Program } from "@coral-xyz/anchor";
import { Acctable } from "../target/types/acctable.js";

it("lock", async () => {
  const programId = new PublicKey(
    "9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi",
  );
  const svm = new LiteSVM();
  svm.addProgramFromFile(programId, "target/deploy/acctable.so");
  const payer = new Keypair();
  const feeReceiver = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(2 * LAMPORTS_PER_SOL));

  const seeds = [Buffer.from("lock"), payer.publicKey.toBuffer()];
  const [lockPda] = PublicKey.findProgramAddressSync(seeds, programId);

  const program = new Program(idl as Acctable, { connection: null as any });

  const instruction = program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
      feeReceiver: feeReceiver.publicKey,
    })
    .instruction();

  const tx = new Transaction().add(await instruction);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);

  const result = svm.sendTransaction(tx);
  if (result instanceof FailedTransactionMetadata) {
    throw new Error(`Lock failed: ${JSON.stringify(result.err())}\nLogs:\n${result.meta().logs().join("\n")}`);
  }

  const coder = new BorshAccountsCoder(idl as any);
  const accountInfo = svm.getAccount(lockPda);
  if (!accountInfo) throw new Error("Account not found");
  const decoded = coder.decode("LockState", Buffer.from(accountInfo.data));

  const expectedAmount = LAMPORTS_PER_SOL - (LAMPORTS_PER_SOL * 3) / 100;

  expect(decoded.amt.toString()).to.equal(new BN(expectedAmount).toString());
});

it("unlock", async () => {
  const programId = new PublicKey(
    "9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi",
  );
  const svm = new LiteSVM();
  svm.addProgramFromFile(programId, "target/deploy/acctable.so");
  const payer = new Keypair();
  const feeReceiver = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(2 * LAMPORTS_PER_SOL));

  const seeds = [Buffer.from("lock"), payer.publicKey.toBuffer()];
  const [lockPda] = PublicKey.findProgramAddressSync(seeds, programId);

  const program = new Program(idl as Acctable, { connection: null as any });

  const lockIx = await program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
      feeReceiver: feeReceiver.publicKey,
    })
    .instruction();
  const lockTx = new Transaction().add(lockIx);
  lockTx.recentBlockhash = svm.latestBlockhash();
  lockTx.sign(payer);
  svm.sendTransaction(lockTx);

  // Flip is_completed = true at byte offset 16 (8 discriminator + 8 u64)
  const rawAccount = svm.getAccount(lockPda)!;
  const data = Buffer.from(rawAccount.data);
  data[16] = 1;
  svm.setAccount(lockPda, { ...rawAccount, data });

  const payerBalanceBefore = svm.getBalance(payer.publicKey);
  if (!payerBalanceBefore) throw new Error("account not found");

  const instruction = program.methods
    .unlock()
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(await instruction);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);

  const result = svm.sendTransaction(tx);
  if (result instanceof FailedTransactionMetadata) {
    throw new Error(`Unlock failed: ${JSON.stringify(result.err())}\nLogs:\n${result.meta().logs().join("\n")}`);
  }

  const accountInfo = svm.getAccount(lockPda);
  const payerLamports = svm.getBalance(payer.publicKey);

  expect(accountInfo?.lamports ?? 0).to.equal(0);
  expect(Number(payerLamports)).to.be.greaterThan(Number(payerBalanceBefore));
});

it("mark_complete", async () => {
  const programId = new PublicKey(
    "9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi",
  );
  const svm = new LiteSVM();
  svm.addProgramFromFile(programId, "target/deploy/acctable.so");
  const payer = new Keypair();
  const feeReceiver = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(2 * LAMPORTS_PER_SOL));

  const seeds = [Buffer.from("lock"), payer.publicKey.toBuffer()];
  const [lockPda] = PublicKey.findProgramAddressSync(seeds, programId);

  const program = new Program(idl as Acctable, { connection: null as any });

  // Setup: lock some SOL first so the LockState account exists
  const lockIx = await program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
      feeReceiver: feeReceiver.publicKey,
    })
    .instruction();
  const lockTx = new Transaction().add(lockIx);
  lockTx.recentBlockhash = svm.latestBlockhash();
  lockTx.sign(payer);
  svm.sendTransaction(lockTx);

  // TODO(human): build the markComplete instruction, create and send the transaction,
  // then assert the result is not a FailedTransactionMetadata.
  // Hint: markComplete takes no args and only needs { payer: payer.publicKey } in accounts.
  const markIx = await program.methods
    .markComplete()
    .accounts({
      payer: payer.publicKey,
    })
    .instruction();
  const markTx = new Transaction().add(markIx);
  markTx.recentBlockhash = svm.latestBlockhash();
  markTx.sign(payer);
  svm.sendTransaction(markTx);

  const coder = new BorshAccountsCoder(idl as any);
  const accountInfo = svm.getAccount(lockPda);
  if (!accountInfo) throw new Error("Account not found");
  const decoded = coder.decode("LockState", Buffer.from(accountInfo.data));

  expect(decoded.is_completed).to.equal(true);
});

it("unlock fails if tasks not complete", async () => {
  const programId = new PublicKey(
    "9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi",
  );
  const svm = new LiteSVM();
  svm.addProgramFromFile(programId, "target/deploy/acctable.so");
  const payer = new Keypair();
  const feeReceiver = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(2 * LAMPORTS_PER_SOL));

  const seeds = [Buffer.from("lock"), payer.publicKey.toBuffer()];
  const [lockPda] = PublicKey.findProgramAddressSync(seeds, programId);

  const program = new Program(idl as Acctable, { connection: null as any });

  const lockIx = await program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
      feeReceiver: feeReceiver.publicKey,
    })
    .instruction();
  const lockTx = new Transaction().add(lockIx);
  lockTx.recentBlockhash = svm.latestBlockhash();
  lockTx.sign(payer);
  svm.sendTransaction(lockTx);

  // TODO(human): attempt to unlock WITHOUT calling mark_complete first,
  // then assert:
  //   1. the result IS a FailedTransactionMetadata (not success)
  //   2. the error code is 6000 (TasksNotCompleted)
  // Hint: result.err() returns { InstructionError: [0, { Custom: <code> }] }
  // Cast result.err() as any to navigate the shape.

  const instruction = program.methods
    .unlock()
    .accounts({
      payer: payer.publicKey,
      lock: lockPda,
      systemProgram: SystemProgram.programId,
    })
    .instruction();

  const tx = new Transaction().add(await instruction);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);
  const result = svm.sendTransaction(tx);

  if (!(result instanceof FailedTransactionMetadata)) {
    throw new Error("Expected unlock to fail but it succeeded");
  }
  const logs = result.meta().logs().join("\n");
  expect(logs).to.include("Error Number: 6000");
});
