/**
 * =============================================================================
 * HashConnect Service Layer — AgroDex Wallet Integration
 * =============================================================================
 *
 * This module provides a singleton service for managing HashPack wallet
 * connections via the HashConnect v3 SDK (built on WalletConnect).
 *
 * Architecture:
 *  - Single `HashConnect` instance managed globally
 *  - Pub/sub pattern for state changes (React context subscribes to this)
 *  - localStorage used for session persistence across page refreshes
 *  - No private keys or seed phrases are ever stored or accessed
 *
 * Usage:
 *  - Import `walletService` and call `.connect()`, `.disconnect()`, etc.
 *  - Subscribe to state changes with `.subscribe(callback)`
 *  - Get current state with `.getState()`
 *
 * @see https://docs.hashpack.app/dapp-developers/walletconnect
 */

import {
  HashConnect,
  HashConnectConnectionState,
  SessionData,
} from "hashconnect";
import { LedgerId } from "@hashgraph/sdk";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Represents the current state of the wallet connection.
 * Uses a discriminated union for type-safe state handling.
 */
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface WalletState {
  /** Current connection status */
  status: WalletStatus;
  /** Connected Hedera account ID (e.g., "0.0.12345") — null when not connected */
  accountId: string | null;
  /** Full session data from HashConnect pairing event */
  sessionData: SessionData | null;
  /** Current Hedera network being used */
  network: "testnet" | "mainnet";
  /** Error message if status is "error" */
  errorMessage: string | null;
  /** Whether the service has been initialized */
  isInitialized: boolean;
}

/** Metadata about the dApp shown to the user in HashPack */
const APP_METADATA = {
  name: "AgroDex",
  description: "AI-Powered Agricultural Traceability on Hedera",
  icons: [
    "https://raw.githubusercontent.com/simple-icons/simple-icons/develop/icons/hedera.svg",
  ],
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "https://agrodex.app",
};

// =============================================================================
// Configuration
// =============================================================================

/** The Hedera network to connect to (defaults to testnet) */
const NETWORK = (import.meta.env.VITE_HEDERA_NETWORK as string) || "testnet";

/** localStorage key for persisting session data */
const SESSION_STORAGE_KEY = "agrodex_hashconnect_session";

/** WalletConnect project ID (required by HashConnect v3) */
const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

// =============================================================================
// Singleton State
// =============================================================================

/** The single HashConnect instance */
let hashConnect: HashConnect | null = null;

/** Current wallet state */
let currentState: WalletState = {
  status: "disconnected",
  accountId: null,
  sessionData: null,
  network: NETWORK as "testnet" | "mainnet",
  errorMessage: null,
  isInitialized: false,
};

/** Set of subscribers that get notified on state changes */
const subscribers = new Set<(state: WalletState) => void>();

/**
 * Updates the wallet state and notifies all subscribers.
 * This is the ONLY way state should be modified.
 */
function setState(patch: Partial<WalletState>): void {
  currentState = { ...currentState, ...patch };
  subscribers.forEach((cb) => cb(currentState));
}

// =============================================================================
// Wallet Service (exported singleton)
// =============================================================================

export const walletService = {
  /**
   * Returns the current wallet state.
   * This is a snapshot — use `subscribe()` for reactive updates.
   */
  getState(): WalletState {
    return currentState;
  },

  /**
   * Subscribe to wallet state changes.
   * The callback is immediately called with the current state.
   *
   * @param callback - Function called whenever state changes
   * @returns Unsubscribe function — call it to stop receiving updates
   *
   * @example
   * const unsubscribe = walletService.subscribe((state) => {
   *   console.log("Wallet status:", state.status);
   * });
   * // Later: unsubscribe();
   */
  subscribe(callback: (state: WalletState) => void): () => void {
    subscribers.add(callback);
    // Immediately emit current state so subscriber gets initial value
    callback(currentState);
    return () => {
      subscribers.delete(callback);
    };
  },

  /**
   * Initialize the HashConnect instance and set up event listeners.
   * Safe to call multiple times — will only initialize once.
   *
   * This also attempts to restore a previous session from localStorage.
   */
  async init(): Promise<void> {
    // Prevent double initialization
    if (hashConnect) return;

    // If no WalletConnect project ID is configured, skip HashConnect entirely.
    // The app still works for email-based login via Supabase.
    if (!WALLETCONNECT_PROJECT_ID) {
      console.warn(
        "[HashConnect] No VITE_WALLETCONNECT_PROJECT_ID set. " +
        "Wallet login is disabled. Email login still works.",
      );
      setState({ isInitialized: true });
      return;
    }

    // Safety timeout: if init hangs for more than 8 seconds, unblock the app
    const initTimeout = setTimeout(() => {
      if (!currentState.isInitialized) {
        console.warn("[HashConnect] Init timed out — unblocking app.");
        setState({ isInitialized: true });
      }
    }, 8000);

    try {
      const ledgerId =
        NETWORK === "mainnet" ? LedgerId.MAINNET : LedgerId.TESTNET;

      hashConnect = new HashConnect(
        ledgerId,
        WALLETCONNECT_PROJECT_ID,
        APP_METADATA,
        false,
      );

      // Register event listeners BEFORE calling init()
      hashConnect.connectionStatusChangeEvent.on(
        (status: HashConnectConnectionState) => {
          console.log("[HashConnect] Connection status:", status);
          // Note: Disconnected fires on WebSocket errors too — don't clear
          // user state here unless we were previously connected.
          if (
            status === HashConnectConnectionState.Disconnected &&
            currentState.status === "connected"
          ) {
            localStorage.removeItem(SESSION_STORAGE_KEY);
            setState({
              status: "disconnected",
              accountId: null,
              sessionData: null,
              errorMessage: null,
            });
          }
        },
      );

      hashConnect.pairingEvent.on((sessionData: SessionData) => {
        console.log("[HashConnect] Pairing event:", sessionData);
        const accountId = sessionData?.accountIds?.[0] || null;
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
        setState({
          status: "connected",
          accountId,
          sessionData,
          errorMessage: null,
        });
      });

      hashConnect.disconnectionEvent.on(() => {
        console.log("[HashConnect] Disconnected");
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setState({
          status: "disconnected",
          accountId: null,
          sessionData: null,
          errorMessage: null,
        });
      });

      // init() connects to WalletConnect relay — may throw if key is invalid
      await hashConnect.init();

      // Try to restore previous session from localStorage
      const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      if (savedSession) {
        try {
          const sessionData: SessionData = JSON.parse(savedSession);
          if (sessionData?.accountIds?.length > 0) {
            clearTimeout(initTimeout);
            setState({
              status: "connected",
              accountId: sessionData.accountIds[0],
              sessionData,
              errorMessage: null,
              isInitialized: true,
            });
            return;
          }
        } catch {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      clearTimeout(initTimeout);
      setState({ isInitialized: true });
    } catch (error) {
      clearTimeout(initTimeout);
      console.error("[HashConnect] Initialization failed:", error);
      // IMPORTANT: always mark initialized so the app doesn't hang
      setState({
        status: "disconnected", // don't show error — wallet is just unavailable
        errorMessage: null,
        isInitialized: true,
      });
    }
  },

  /**
   * Open the HashConnect pairing modal to connect a wallet.
   * Automatically initializes if not already done.
   *
   * The modal handles:
   *  - Browser extension detection (HashPack Chrome extension)
   *  - QR code generation for mobile HashPack
   *  - WalletConnect deep linking
   */
  async connect(): Promise<void> {
    // Initialize if needed
    if (!hashConnect) {
      await this.init();
    }

    if (!hashConnect) {
      setState({
        status: "error",
        errorMessage: "HashConnect failed to initialize. Please refresh the page.",
      });
      return;
    }

    setState({
      status: "connecting",
      errorMessage: null,
    });

    try {
      // Small delay to ensure extension has time to inject into page
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Open the pairing modal — this shows QR code and extension option
      await hashConnect.openPairingModal();

      // Set a timeout — if still connecting after 60 seconds, show error
      setTimeout(() => {
        if (currentState.status === "connecting") {
          setState({
            status: "error",
            errorMessage: `No ${NETWORK} account found in HashPack. Please create or import a ${NETWORK} account.`,
          });
        }
      }, 60000);
    } catch (error) {
      console.error("[HashConnect] Connection failed:", error);
      setState({
        status: "error",
        errorMessage:
          error instanceof Error
            ? error.message
            : "Failed to open wallet connection modal",
      });
    }
  },

  /**
   * Disconnect the wallet and clear all session data.
   */
  async disconnect(): Promise<void> {
    try {
      // Clear persisted session first (even if disconnect fails)
      localStorage.removeItem(SESSION_STORAGE_KEY);

      // Tell HashConnect to disconnect
      if (hashConnect) {
        await hashConnect.disconnect();
      }
    } catch (error) {
      console.warn("[HashConnect] Disconnect error (non-critical):", error);
    }

    // Always reset state regardless of disconnect success
    setState({
      status: "disconnected",
      accountId: null,
      sessionData: null,
      errorMessage: null,
    });
  },

  /**
   * Get the HashConnect instance for advanced operations
   * (e.g., sending transactions through the wallet).
   *
   * Returns null if not initialized.
   */
  getHashConnect(): HashConnect | null {
    return hashConnect;
  },
};
