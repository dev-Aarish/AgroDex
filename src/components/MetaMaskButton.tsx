import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isMetaMaskInstalled, signInWithMetaMask } from "@/lib/metaMaskAuth";
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

export default function MetaMaskButton() {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [installed, setInstalled] = useState(true);

  const isWeb3User = user && !user.email;
  const walletAddress = user?.user_metadata?.address || user?.user_metadata?.sub || "";

  useEffect(() => {
    setInstalled(isMetaMaskInstalled());
  }, []);

  useEffect(() => {
    if (isWeb3User) {
      setStatus("connected");
    } else {
      setStatus("disconnected");
    }
  }, [isWeb3User, user]);

  const handleConnect = async () => {
    setStatus("connecting");
    setErrorMessage(null);

    try {
      const { error } = await signInWithMetaMask();
      if (error) {
        throw error;
      }
      setStatus("connected");
    } catch (err: unknown) {
      console.error("MetaMask connect error:", err);
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect MetaMask");
    }
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
      setStatus("disconnected");
    } catch (err) {
      console.error("MetaMask disconnect error:", err);
    }
  };

  const handleCopy = async () => {
    if (!walletAddress) return;
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Network & Copy Row */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Hedera EVM
        </span>
        {status === "connected" && walletAddress && (
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
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

      {/* Connected State */}
      {status === "connected" && walletAddress && (
        <div className="transition-all duration-200">
          <Alert variant="default" className="bg-emerald-50 border-emerald-200 border-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 font-medium">
              <span className="block text-sm">Authenticated with MetaMask</span>
              <span className="block font-mono text-base mt-0.5">
                {truncateAddress(walletAddress)}
              </span>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Connecting State */}
      {status === "connecting" && (
        <div className="transition-all duration-200">
          <Alert variant="default" className="bg-blue-50 border-blue-200 border-2">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Connecting... Sign the authentication challenge in MetaMask.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Error State */}
      {status === "error" && errorMessage && (
        <div className="transition-all duration-200 space-y-3">
          <Alert variant="destructive" className="border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
          <Button onClick={handleConnect} variant="outline" size="sm" className="w-full">
            Retry Connection
          </Button>
        </div>
      )}

      {/* Not Installed State */}
      {!installed && (
        <div className="transition-all duration-200 space-y-3 p-4 rounded-xl border bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <div className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            MetaMask is not installed
          </div>
          <p className="text-sm text-gray-700">
            To log in using an EVM wallet, please install the MetaMask extension and set up a Hedera Testnet account.
          </p>
          <Button asChild variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white w-full">
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Install MetaMask
            </a>
          </Button>
        </div>
      )}

      {/* Action Buttons */}
      {installed && (
        <div className="flex gap-2">
          {status !== "connected" ? (
            <div className="flex-1">
              <Button
                onClick={handleConnect}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
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
                    Connect MetaMask
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex-1">
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full h-12 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold rounded-xl transition-all"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect MetaMask
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
