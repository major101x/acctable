import { useState, useMemo } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAnchorProgram } from "@/hooks/useAnchorProgram";
import { useLockState } from "@/hooks/useLockState";
import { lamportsToSol } from "@/lib/anchorClient";
import * as client from "@/lib/anchorClient";
import type { DashboardState } from "@/types";
import { ActionPanel } from "./ActionPanel";

export function Dashboard() {
  const program = useAnchorProgram();
  const { publicKey } = useWallet();
  const { lockState, refetch } = useLockState(program, publicKey);
  const [submitting, setSubmitting] = useState<
    "lock" | "markComplete" | "unlock" | null
  >(null);
  const [txError, setTxError] = useState<string | null>(null);

  // Derive base state from on-chain data — useMemo avoids useEffect+setState cascade
  const baseState = useMemo((): DashboardState => {
    if (lockState === "loading" || lockState === null)
      return { tag: "no-lock" };
    if (!lockState.isCompleted) {
      return { tag: "locked-incomplete", amtSol: lamportsToSol(lockState.amt) };
    }
    return { tag: "locked-complete", amtSol: lamportsToSol(lockState.amt) };
  }, [lockState]);

  const uiState: DashboardState = submitting
    ? { tag: "submitting", action: submitting }
    : baseState;

  async function handleAction(
    action: "lock" | "markComplete" | "unlock",
    amtLamports?: number,
  ) {
    if (!program || !publicKey) return;
    setTxError(null);
    setSubmitting(action);
    try {
      switch (action) {
        case "lock":
          if (amtLamports !== undefined) await client.lock(program, publicKey, amtLamports);
          break;
        case "markComplete":
          await client.markComplete(program, publicKey);
          break;
        case "unlock":
          await client.unlock(program, publicKey);
          break;
      }
    } catch (error) {
      setTxError(error instanceof Error ? error.message : String(error));
    } finally {
      await refetch();
      setSubmitting(null);
    }
  }

  if (lockState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">acctable</h1>
        {txError && (
          <p className="text-red-400 text-sm bg-red-900/30 border border-red-800 rounded-lg p-3">
            {txError}
          </p>
        )}
        <ActionPanel
          state={uiState}
          onAction={(action, amt) => void handleAction(action, amt)}
        />
      </div>
    </div>
  );
}
