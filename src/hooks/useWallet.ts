/**
 * =============================================================================
 * useWallet Hook — Convenient Wallet Access
 * =============================================================================
 *
 * Re-exports the useWallet hook from WalletContext for cleaner imports.
 * This follows the standard React pattern of having hooks in /hooks/.
 *
 * @example
 * import { useWallet } from "@/hooks/useWallet";
 *
 * function MyComponent() {
 *   const { accountId, isConnected, connect } = useWallet();
 *   // ...
 * }
 */

export { useWallet } from "@/context/WalletContext";
