import type { DashboardState } from "@/types";
import { LockForm } from "./LockForm";
import { StatusCard } from "./StatusCard";

interface Props {
  state: DashboardState;
  onAction: (action: "lock" | "markComplete" | "unlock", amtLamports?: number) => void;
}

export function ActionPanel({ state, onAction }: Props) {
  if (state.tag === "submitting") {
    return (
      <div className="flex items-center gap-2 justify-center text-gray-400 py-4">
        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
        <span className="text-sm">{state.action}ing...</span>
      </div>
    );
  }

  if (state.tag === "no-lock") {
    return <LockForm onLock={(amt) => onAction("lock", amt)} disabled={false} />;
  }

  const isComplete = state.tag === "locked-complete";

  return (
    <div className="space-y-4">
      <StatusCard amtSol={state.amtSol} isCompleted={isComplete} />
      <button
        onClick={() => onAction(isComplete ? "unlock" : "markComplete")}
        className={`w-full font-semibold py-2 px-4 rounded-lg transition text-white ${
          isComplete
            ? "bg-green-600 hover:bg-green-700"
            : "bg-yellow-600 hover:bg-yellow-700"
        }`}
      >
        {isComplete ? "Unlock SOL" : "Mark Complete"}
      </button>
    </div>
  );
}
