import { useState, useCallback, useEffect } from "react";
import type { Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import type { Acctable } from "@/idl/acctable";
import { fetchLockState, type LockState } from "@/lib/anchorClient";

export function useLockState(
  program: Program<Acctable> | null,
  walletPublicKey: PublicKey | null
) {
  const [lockState, setLockState] = useState<LockState | null | "loading">("loading");

  const refetch = useCallback(async () => {
    // All setState calls happen after await — safe within useEffect
    const state = !program || !walletPublicKey
      ? await Promise.resolve(null)
      : await fetchLockState(program, walletPublicKey);
    setLockState(state);
  }, [program, walletPublicKey]);

  useEffect(() => {
    // eslint-disable-next-line -- refetch is async; setState is called post-await
    void refetch();
  }, [refetch]);

  return { lockState, refetch };
}
