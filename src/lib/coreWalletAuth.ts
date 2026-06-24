import { supabase } from "./supabaseClient";
import {
  HEDERA_TESTNET_CHAIN_ID,
  HEDERA_TESTNET_PARAMS,
} from "./metaMaskAuth";

function getCoreProvider() {
  if (typeof window === "undefined") return null;
  if ((window as any).avalanche) return (window as any).avalanche;
  if ((window as any).ethereum?.isAvalanche) return (window as any).ethereum;
  return null;
}

export function isCoreAuthInstalled(): boolean {
  return getCoreProvider() !== null;
}

/**
 * Switch Core Wallet to Hedera Testnet using wallet_switchEthereumChain.
 * Falls back to wallet_addEthereumChain if the network is unknown.
 */
export async function switchCoreToHederaTestnet(): Promise<boolean> {
  const provider = getCoreProvider();
  if (!provider) return false;

  try {
    const currentChainId: string = await provider.request({ method: "eth_chainId" });
    if (currentChainId === HEDERA_TESTNET_CHAIN_ID) return true;

    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HEDERA_TESTNET_CHAIN_ID }],
      });
      return true;
    } catch (switchError: unknown) {
      const err = switchError as { code?: number; message?: string };
      if (err.code === 4902) {
        // Chain not added — try adding it
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [HEDERA_TESTNET_PARAMS],
        });
        return true;
      }
      if (err.code === 4001) {
        console.warn("User rejected Hedera Testnet network switch");
      }
      return false;
    }
  } catch (err) {
    console.error("Failed to switch to Hedera Testnet:", err);
    return false;
  }
}

/**
 * Sign in using Core (Avalanche) wallet via Supabase Web3 Auth (EIP-4361).
 *
 * Core Wallet exposes an EIP-1193 provider but may not be at window.ethereum
 * (it can be at window.avalanche or window.ethereum with isAvalanche flag).
 * We temporarily swap window.ethereum to Core's provider so supabase's
 * signInWithWeb3 picks it up, then restore the original.
 */
export async function signInWithCoreWallet(statement?: string) {
  const provider = getCoreProvider();
  if (!provider) {
    return {
      data: null,
      error: new Error("Core wallet is not installed"),
    };
  }

  const originalEthereum = (window as any).ethereum;

  try {
    (window as any).ethereum = provider;

    // Switch to Hedera Testnet before authenticating (same as MetaMask flow)
    await switchCoreToHederaTestnet();

    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: "ethereum",
      statement: statement || "Sign in to AgroDex with your Core wallet.",
      options: {
        url: "https://agro-dex-1u85.vercel.app",
      },
    });

    return { data, error };
  } catch (err: unknown) {
    console.error("Core wallet sign-in error:", err);
    const message =
      err instanceof Error ? err.message : "Core wallet authentication failed";
    return {
      data: null,
      error: new Error(message),
    };
  } finally {
    (window as any).ethereum = originalEthereum;
  }
}
