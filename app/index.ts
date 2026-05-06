import { Connection, Keypair, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";
import { AnchorClient } from "./client.js";

function loadKeypair(keypairPath?: string): Keypair {
  const resolved = keypairPath ?? path.join(os.homedir(), ".config/solana/id.json");
  const raw = JSON.parse(fs.readFileSync(resolved, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function main() {
  const [, , cmd, ...args] = process.argv;
  const cluster = (process.env.CLUSTER ?? "devnet") as "devnet" | "mainnet-beta";
  const connection = new Connection(clusterApiUrl(cluster), "confirmed");
  const payer = loadKeypair(process.env.KEYPAIR_PATH);
  const client = new AnchorClient(connection, payer);

  switch (cmd) {
    case "lock": {
      const sol = parseFloat(args[0] ?? "");
      if (isNaN(sol) || sol <= 0) {
        console.error("Usage: lock <amount-in-SOL>  e.g. lock 0.5");
        process.exit(1);
      }
      const sig = await client.lock(sol * LAMPORTS_PER_SOL);
      console.log(`Locked ${sol} SOL — tx: ${sig}`);
      break;
    }

    case "unlock": {
      const state = await client.fetchLockState();
      if (!state) {
        console.error("No active lock found for this wallet.");
        process.exit(1);
      }
      if (!state.isCompleted) {
        console.error("Tasks not yet marked complete — unlock will be rejected by the program.");
        process.exit(1);
      }
      const sig = await client.unlock();
      console.log(`Unlocked — tx: ${sig}`);
      break;
    }

    case "complete": {
      const sig = await client.markComplete();
      console.log(`Marked complete — tx: ${sig}`);
      break;
    }

    case "status": {
      const state = await client.fetchLockState();
      if (!state) {
        console.log("No active lock for this wallet.");
      } else {
        const sol = state.amt.toNumber() / LAMPORTS_PER_SOL;
        console.log(`Locked:    ${sol} SOL`);
        console.log(`Completed: ${state.isCompleted}`);
      }
      break;
    }

    default:
      console.error("Commands:");
      console.error("  lock <sol>   — lock SOL into the program vault");
      console.error("  complete     — mark your tasks as done");
      console.error("  unlock       — reclaim SOL once tasks are complete");
      console.error("  status       — view current lock state");
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
