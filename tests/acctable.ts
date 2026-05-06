import { FailedTransactionMetadata, LiteSVM } from "litesvm";
import { expect } from "chai";
import {
  PublicKey,
  Transaction,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import idl from "../target/idl/acctable.json" with {type: "json"};
import { BN, BorshAccountsCoder, Program } from "@coral-xyz/anchor";
import { Acctable } from "../target/types/acctable.js";

const PROGRAM_ID = new PublicKey("9U2SnYkHeWhQHsteHZBGb2W776MrahyWXTuvZhQoQwbi");

let svm: LiteSVM;
let payer: Keypair;
let feeReceiver: Keypair;
let lockPda: PublicKey;
let program: Program<Acctable>;

beforeEach(() => {
  svm = new LiteSVM();
  svm.addProgramFromFile(PROGRAM_ID, "target/deploy/acctable.so");
  payer = new Keypair();
  feeReceiver = new Keypair();
  svm.airdrop(payer.publicKey, BigInt(2 * LAMPORTS_PER_SOL));
  [lockPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("lock"), payer.publicKey.toBuffer()],
    PROGRAM_ID
  );
  program = new Program(idl as Acctable, { connection: null as any });
});

async function doLock() {
  const ix = await program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
      feeReceiver: feeReceiver.publicKey,
    })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);
  svm.sendTransaction(tx);
}

it("lock", async () => {
  const instruction = program.methods
    .lock(new BN(LAMPORTS_PER_SOL))
    .accounts({
      payer: payer.publicKey,
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
  await doLock();

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
    })
    .instruction();

  const tx = new Transaction().add(await instruction);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);

  const result = svm.sendTransaction(tx);
  if (result instanceof FailedTransactionMetadata) {
    throw new Error(`Unlock failed: ${JSON.stringify(result.err())}\nLogs:\n${result.meta().logs().join("\n")}`);
  }

  expect(svm.getAccount(lockPda)?.lamports ?? 0).to.equal(0);
  expect(Number(svm.getBalance(payer.publicKey))).to.be.greaterThan(Number(payerBalanceBefore));
});

it("mark_complete", async () => {
  await doLock();

  const ix = await program.methods
    .markComplete()
    .accounts({ payer: payer.publicKey })
    .instruction();
  const tx = new Transaction().add(ix);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);

  const result = svm.sendTransaction(tx);
  if (result instanceof FailedTransactionMetadata) {
    throw new Error(`mark_complete failed: ${JSON.stringify(result.err())}\nLogs:\n${result.meta().logs().join("\n")}`);
  }

  const coder = new BorshAccountsCoder(idl as any);
  const accountInfo = svm.getAccount(lockPda);
  if (!accountInfo) throw new Error("Account not found");
  const decoded = coder.decode("LockState", Buffer.from(accountInfo.data));

  expect(decoded.is_completed).to.equal(true);
});

it("unlock fails if tasks not complete", async () => {
  await doLock();

  const instruction = program.methods
    .unlock()
    .accounts({
      payer: payer.publicKey,
    })
    .instruction();

  const tx = new Transaction().add(await instruction);
  tx.recentBlockhash = svm.latestBlockhash();
  tx.sign(payer);
  const result = svm.sendTransaction(tx);

  if (!(result instanceof FailedTransactionMetadata)) {
    throw new Error("Expected unlock to fail but it succeeded");
  }
  expect(result.meta().logs().join("\n")).to.include("Error Number: 6000");
});
