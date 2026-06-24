import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  isCoreWalletInstalled,
  connectCoreWallet,
  listenToWalletChanges,
  getProvider,
} from "@/lib/coreWallet";
import { signInWithCoreWallet } from "@/lib/coreWalletAuth";
import { supabase } from "@/lib/supabaseClient";

interface CoreWalletContextType {
  status: "disconnected" | "connecting" | "connected" | "error";
  address: string | null;
  chainId: string | null;
  errorMessage: string | null;
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const CoreWalletContext = createContext<CoreWalletContextType | undefined>(undefined);

export function CoreWalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isCoreWalletInstalled());
  }, []);

  // Listen for account/chain changes when connected
  useEffect(() => {
    if (status !== "connected") return;

    const unsubscribe = listenToWalletChanges(
      (accounts) => {
        if (accounts.length === 0) {
          // Wallet disconnected or locked
          void disconnect();
        } else {
          setAddress(accounts[0].toLowerCase());
        }
      },
      (newChainId) => {
        setChainId(newChainId);
      },
    );

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const connect = useCallback(async () => {
    setErrorMessage(null);
    setStatus("connecting");

    try {
      const result = await connectCoreWallet();
      setAddress(result.address);
      setChainId(result.chainId);

      const { error: authError } = await signInWithCoreWallet();
      if (authError) {
        console.warn("Supabase Web3 auth failed:", authError.message);
      }

      // Re-read chain ID after possible Hedera network switch
      const provider = getProvider();
      if (provider) {
        const newChainId: string = await provider.request({ method: "eth_chainId" });
        setChainId(newChainId);
      }

      setStatus("connected");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to connect Core wallet");
      setStatus("error");
    }
  }, []);

  const disconnect = useCallback(async () => {
    setAddress(null);
    setChainId(null);
    setErrorMessage(null);
    setStatus("disconnected");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && !session.user.email) {
        await supabase.auth.signOut();
      }
    } catch {
      // Ignore sign-out errors
    }
  }, []);

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  const value: CoreWalletContextType = {
    status,
    address,
    chainId,
    errorMessage,
    isInstalled,
    isConnected,
    isConnecting,
    connect,
    disconnect,
  };

  return (
    <CoreWalletContext.Provider value={value}>
      {children}
    </CoreWalletContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCoreWallet(): CoreWalletContextType {
  const context = useContext(CoreWalletContext);
  if (context === undefined) {
    throw new Error("useCoreWallet must be used within a CoreWalletProvider");
  }
  return context;
}
