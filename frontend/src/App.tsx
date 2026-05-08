import { useWallet } from "@solana/wallet-adapter-react";
import { ConnectPrompt } from "./components/ConnectPrompt";
import { Dashboard } from "./components/Dashboard";

export function App() {
  const { connected } = useWallet();
  return connected ? <Dashboard /> : <ConnectPrompt />;
}
