/**
 * =============================================================================
 * WalletContext — React Context for HashPack Wallet State
 * =============================================================================
 *
 * Provides wallet connection state to the entire React component tree.
 * Wraps the `walletService` singleton in a React-friendly context pattern.
 *
 * Features:
 *  - Auto-initializes HashConnect on mount
 *  - Subscribes to wallet state changes and re-renders consumers
 *  - Provides connect/disconnect actions
 *  - Session restoration on page refresh
 *
 * Usage:
 *  Wrap your app with <WalletProvider> and use the useWallet() hook.
 *
 * @example
 * // In App.tsx
 * <WalletProvider>
 *   <App />
 * </WalletProvider>
 *
 * // In any component
 * const { accountId, status, connect, disconnect } = useWallet();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { walletService, WalletState } from "@/lib/hashconnect";

// =============================================================================
// Context Types
// =============================================================================

interface WalletContextType {
  /** Current connection status */
  status: WalletState["status"];
  /** Connected account ID (e.g., "0.0.12345") — null when disconnected */
  accountId: string | null;
  /** Current Hedera network */
  network: "testnet" | "mainnet";
  /** Error message if connection failed */
  errorMessage: string | null;
  /** Whether HashConnect has been initialized */
  isInitialized: boolean;
  /** Whether wallet is currently connected */
  isConnected: boolean;
  /** Whether connection is in progress */
  isConnecting: boolean;
  /** Full wallet state from the service layer */
  walletState: WalletState;
  /** Open HashPack pairing modal to connect */
  connect: () => Promise<void>;
  /** Disconnect wallet and clear session */
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export function WalletProvider({ children }: { children: React.ReactNode }) {
  // Local state synced with the walletService singleton
  const [walletState, setWalletState] = useState<WalletState>(
    walletService.getState(),
  );

  useEffect(() => {
    // Initialize HashConnect when the provider mounts
    walletService.init();

    // Subscribe to state changes from the service layer
    // This ensures React re-renders whenever the wallet state changes
    const unsubscribe = walletService.subscribe((newState) => {
      setWalletState(newState);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Memoize actions so they don't cause unnecessary re-renders
  const connect = useCallback(async () => {
    await walletService.connect();
  }, []);

  const disconnect = useCallback(async () => {
    await walletService.disconnect();
  }, []);

  // Derived convenience booleans
  const isConnected = walletState.status === "connected";
  const isConnecting = walletState.status === "connecting";

  const value: WalletContextType = {
    status: walletState.status,
    accountId: walletState.accountId,
    network: walletState.network,
    errorMessage: walletState.errorMessage,
    isInitialized: walletState.isInitialized,
    isConnected,
    isConnecting,
    walletState,
    connect,
    disconnect,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

// =============================================================================
// Consumer Hook
// =============================================================================

/**
 * Hook to access wallet state and actions from any component.
 * Must be used within a <WalletProvider>.
 *
 * @throws Error if used outside of WalletProvider
 *
 * @example
 * function MyComponent() {
 *   const { accountId, isConnected, connect, disconnect } = useWallet();
 *
 *   if (!isConnected) {
 *     return <button onClick={connect}>Connect Wallet</button>;
 *   }
 *
 *   return (
 *     <div>
 *       <p>Connected: {accountId}</p>
 *       <button onClick={disconnect}>Disconnect</button>
 *     </div>
 *   );
 * }
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a <WalletProvider>");
  }
  return context;
}
