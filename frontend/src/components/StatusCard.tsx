interface Props {
  amtSol: number;
  isCompleted: boolean;
}

export function StatusCard({ amtSol, isCompleted }: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">Locked</span>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            isCompleted
              ? "bg-green-900 text-green-300"
              : "bg-yellow-900 text-yellow-300"
          }`}
        >
          {isCompleted ? "Complete" : "Pending"}
        </span>
      </div>
      <p className="text-3xl font-bold">{amtSol.toFixed(4)} SOL</p>
    </div>
  );
}
