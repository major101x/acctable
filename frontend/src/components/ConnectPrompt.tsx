import { WalletButton } from "./WalletButton";

export function ConnectPrompt() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white gap-6">
      <h1 className="text-4xl font-bold tracking-tight">acctable</h1>
      <p className="text-gray-400 text-center max-w-xs">
        Lock SOL until you finish what you said you would. No partial unlocks.
      </p>
      <WalletButton />
    </div>
  );
}
