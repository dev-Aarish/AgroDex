import { useState } from "react";
import { useCoreWallet } from "@/hooks/useCoreWallet";
import { HEDERA_TESTNET_CHAIN_ID } from "@/lib/metaMaskAuth";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Wallet,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  LogOut,
  Copy,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const CHAIN_LABELS: Record<string, { label: string; testnet: boolean }> = {
  "0xa86a": { label: "Avalanche C-Chain", testnet: false },
  "0xa869": { label: "Fuji Testnet", testnet: true },
  [HEDERA_TESTNET_CHAIN_ID]: { label: "Hedera Testnet", testnet: true },
};

function ChainBadge({ chainId }: { chainId: string | null }) {
  if (!chainId) return null;
  const info = CHAIN_LABELS[chainId] ?? { label: "Unsupported Network", testnet: false };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        info.testnet
          ? "bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
          : "bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${info.testnet ? "bg-amber-500" : "bg-green-500"}`}
      />
      {info.label}
    </span>
  );
}

export default function CoreWalletButton() {
  const { status, address, chainId, errorMessage, isInstalled, connect, disconnect } = useCoreWallet();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed silently — not critical
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <ChainBadge chainId={chainId} />
        {status === "connected" && address && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors dark:text-slate-400 dark:hover:text-slate-300"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy Address"}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {status === "connected" && address && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert className="bg-green-50 border-green-200 border-2 dark:bg-green-950/20 dark:border-green-900/50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300 font-medium">
                <span className="block text-sm">Connected</span>
                <span className="block font-mono text-base mt-0.5">
                  {formatAddress(address)}
                </span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {status === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert className="bg-blue-50 border-blue-200 border-2 dark:bg-blue-950/20 dark:border-blue-900/50">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                Connecting to Core wallet…
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {status === "error" && errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert variant="destructive" className="border-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {status !== "connected" ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button
              onClick={connect}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
              disabled={status === "connecting"}
            >
              {status === "connecting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Core Wallet
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button
              onClick={disconnect}
              variant="outline"
              className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl transition-all dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/20"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </motion.div>
        )}
      </div>

      {status === "disconnected" && !isInstalled && (
        <div className="p-3 rounded-xl border bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-2">
            Core wallet not detected
          </p>
          <Button
            asChild
            variant="default"
            size="sm"
            className="bg-black hover:bg-gray-800 text-white"
          >
            <a
              target="_blank"
              rel="noreferrer"
              href="https://chromewebstore.google.com/detail/core-crypto-wallet-nft-ex/agoakfejjabomgpkjmpbgphdfgofmhpe"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Install Core Wallet
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
