import { useMemo } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import idl from "@/idl/acctable.json";
import type { Acctable } from "@/idl/acctable";

export function useAnchorProgram(): Program<Acctable> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
    return new Program(idl as Acctable, provider);
  }, [connection, wallet]);
}
