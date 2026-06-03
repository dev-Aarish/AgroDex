/**
 * =============================================================================
 * WalletButton — Modern HashPack Wallet Connect/Disconnect UI
 * =============================================================================
 *
 * A responsive, animated button component for wallet interactions.
 * Handles all wallet states: disconnected, connecting, connected, error.
 *
 * Features:
 *  - Animated connection states with loading spinner
 *  - Account ID display with truncation
 *  - Network indicator badge (testnet/mainnet)
 *  - Error state with retry and help panel
 *  - Fully responsive for mobile and desktop
 *  - Help instructions for installing HashPack
 */

import { useWallet } from "@/hooks/useWallet";
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
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// Helper: Truncate Account ID for Display
// =============================================================================

/**
 * Truncates a Hedera account ID for compact display.
 * "0.0.1234567" → "0.0.1234567" (short enough to show full)
 * Used mainly for future-proofing with longer identifiers.
 */
function formatAccountId(accountId: string): string {
  return accountId;
}

// =============================================================================
// Sub-components
// =============================================================================

/**
 * Help panel shown when wallet connection fails.
 * Guides users through HashPack installation and testnet account setup.
 */
function HelpPanel({ network, onRetry }: { network: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-3 p-4 rounded-xl border bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
    >
      <div className="font-semibold text-gray-900 flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600" />
        No{" "}
        <span className="uppercase font-bold text-blue-700">{network}</span>{" "}
        account available
      </div>

      <div className="text-sm text-gray-700 space-y-2">
        <p className="font-medium">
          To connect your HashPack wallet, follow these steps:
        </p>
        <ol className="list-decimal ml-5 space-y-2">
          <li>
            <strong>Install the HashPack extension</strong>
            <br />
            <a
              className="text-blue-700 underline hover:text-blue-900 inline-flex items-center gap-1"
              target="_blank"
              rel="noreferrer"
              href="https://chromewebstore.google.com/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk"
            >
              Chrome Web Store <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <strong>Create a Hedera Testnet account</strong>
            <br />
            <a
              className="text-blue-700 underline hover:text-blue-900 inline-flex items-center gap-1"
              target="_blank"
              rel="noreferrer"
              href="https://portal.hedera.com/register"
            >
              Hedera Portal (Testnet) <ExternalLink className="h-3 w-3" />
            </a>
          </li>
          <li>
            <strong>Import your account into HashPack</strong>
            <br />
            <span className="text-gray-600">
              HashPack → Settings → Networks →{" "}
              <strong>Testnet</strong> → <em>Import an account</em> (paste
              your private key from the portal)
            </span>
          </li>
          <li>
            <strong>Come back and retry</strong>
            <br />
            <span className="text-gray-600">
              Click the &quot;Retry&quot; button below
            </span>
          </li>
        </ol>
      </div>

      <div className="flex gap-2 flex-wrap pt-2">
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-black hover:bg-gray-800"
        >
          <a
            target="_blank"
            rel="noreferrer"
            href="https://chromewebstore.google.com/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Install HashPack
          </a>
        </Button>
        <Button
          asChild
          variant="default"
          size="sm"
          className="bg-black hover:bg-gray-800"
        >
          <a
            target="_blank"
            rel="noreferrer"
            href="https://portal.hedera.com/register"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Create Testnet Account
          </a>
        </Button>
        <Button onClick={onRetry} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    </motion.div>
  );
}

/**
 * Network indicator badge — shows testnet or mainnet.
 */
function NetworkBadge({ network }: { network: string }) {
  const isTestnet = network === "testnet";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        isTestnet
          ? "bg-amber-100 text-amber-700 border border-amber-200"
          : "bg-green-100 text-green-700 border border-green-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isTestnet ? "bg-amber-500" : "bg-green-500"
        }`}
      />
      {isTestnet ? "Testnet" : "Mainnet"}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function WalletButton() {
  const { status, accountId, network, errorMessage, connect, disconnect } =
    useWallet();
  const [copied, setCopied] = useState(false);

  /** Copy account ID to clipboard */
  const handleCopy = async () => {
    if (!accountId) return;
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available in some contexts
    }
  };

  return (
    <div className="space-y-4">
      {/* Network Badge */}
      <div className="flex items-center justify-between">
        <NetworkBadge network={network} />
        {status === "connected" && accountId && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            title="Copy account ID"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy ID"}
          </button>
        )}
      </div>

      {/* Connected State */}
      <AnimatePresence mode="wait">
        {status === "connected" && accountId && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert
              variant="default"
              className="bg-green-50 border-green-200 border-2"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 font-medium">
                <span className="block text-sm">Connected</span>
                <span className="block font-mono text-base mt-0.5">
                  {formatAccountId(accountId)}
                </span>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Connecting State */}
        {status === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Alert
              variant="default"
              className="bg-blue-50 border-blue-200 border-2"
            >
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <AlertDescription className="text-blue-800">
                Connecting… Approve the connection in your HashPack wallet.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Error State */}
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
            <div className="mt-3">
              <HelpPanel network={network} onRetry={connect} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {status !== "connected" ? (
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button
              onClick={connect}
              className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
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
                  Connect HashPack
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
            <Button
              onClick={disconnect}
              variant="outline"
              className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </motion.div>
        )}
      </div>

      {/* Tip for disconnected state */}
      {status === "disconnected" && (
        <p className="text-xs text-gray-500 text-center">
          💡 Make sure{" "}
          <a
            href="https://chromewebstore.google.com/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline"
          >
            HashPack
          </a>{" "}
          is installed and you have a {network} account.
        </p>
      )}
    </div>
  );
}
