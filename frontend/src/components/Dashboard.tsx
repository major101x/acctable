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
  const [unlockSuccess, setUnlockSuccess] = useState(false);

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
          setUnlockSuccess(true);
          break;
      }
    } catch (error) {
      setTxError(error instanceof Error ? error.message : String(error));
    } finally {
      await refetch();
      setSubmitting(null);
    }
  }

  if (unlockSuccess) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-900 flex items-center justify-center">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold">SOL Unlocked!</h2>
            <p className="text-gray-400 mt-2 text-sm">Your funds are back in your wallet.</p>
          </div>
          <button
            onClick={() => setUnlockSuccess(false)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Lock again
          </button>
        </div>
      </div>
    );
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
