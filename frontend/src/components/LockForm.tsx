import { useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface Props {
  onLock: (amtLamports: number) => void;
  disabled: boolean;
}

export function LockForm({ onLock, disabled }: Props) {
  const [inputSol, setInputSol] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sol = parseFloat(inputSol);
    if (isNaN(sol) || sol <= 0) return;
    onLock(Math.floor(sol * LAMPORTS_PER_SOL));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm text-gray-400 block mb-1">Amount (SOL)</label>
        <input
          type="number"
          min="0"
          step="0.001"
          value={inputSol}
          onChange={(e) => setInputSol(e.target.value)}
          placeholder="0.1"
          disabled={disabled}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">3% fee deducted on lock</p>
      </div>
      <button
        type="submit"
        disabled={disabled || !inputSol}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold py-2 px-4 rounded-lg transition"
      >
        Lock SOL
      </button>
    </form>
  );
}
