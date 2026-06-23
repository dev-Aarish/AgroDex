import { supabase } from "./supabaseClient";

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any;
}

// Chain ID for Hedera Testnet (EVM) is 296 (0x128)
export const HEDERA_TESTNET_CHAIN_ID = "0x128"; // 296 in hex

export const HEDERA_TESTNET_PARAMS = {
  chainId: HEDERA_TESTNET_CHAIN_ID,
  chainName: "Hedera Testnet",
  nativeCurrency: {
    name: "HBAR",
    symbol: "HBAR",
    decimals: 18,
  },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

/**
 * Check if MetaMask or any EIP-1193 provider is installed
 */
export function isMetaMaskInstalled(): boolean {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof window !== "undefined" && typeof (window as Record<string, any>).ethereum !== "undefined";
}

/**
 * Request network switch to Hedera Testnet
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function switchToHederaTestnet(provider: any = (window as Record<string, any>).ethereum): Promise<boolean> {
  if (!provider) return false;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: HEDERA_TESTNET_CHAIN_ID }],
    });
    return true;
  } catch (error: unknown) {
    const err = error as { code?: number; message?: string };
    // User rejected the network switch
    if (err.code === 4001) {
      console.warn("User rejected Hedera Testnet network switch");
      return false;
    }
    // Chain has not been added to MetaMask — try adding it
    if (err.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [HEDERA_TESTNET_PARAMS],
        });
        return true;
      } catch (addError: unknown) {
        const addErr = addError as { code?: number; message?: string };
        if (addErr.code === 4001) {
          console.warn("User rejected adding Hedera Testnet network");
        } else {
          console.error("Failed to add Hedera Testnet network:", addErr.message ?? addErr);
        }
        return false;
      }
    }
    console.error("Failed to switch to Hedera Testnet network:", err.message ?? err);
    return false;
  }
}

/**
 * Sign in using MetaMask/EVM Wallet via Supabase Web3 Auth (EIP-4361)
 */
export async function signInWithMetaMask(statement?: string): Promise<{ data: unknown; error: unknown }> {
  if (!supabase) {
    return {
      data: null,
      error: new Error("Supabase client is not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."),
    };
  }

  if (!isMetaMaskInstalled()) {
    return {
      data: null,
      error: new Error("MetaMask or compatible EVM wallet is not installed"),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = (window as Record<string, any>).ethereum;

  try {
    // 1. Request account access first — authorizes the dapp with MetaMask
    const accounts = await provider.request({ method: "eth_requestAccounts" });
    if (!accounts || accounts.length === 0) {
      return {
        data: null,
        error: new Error("No accounts found. Please unlock your wallet."),
      };
    }

    // 2. Ensure we are on Hedera Testnet
    const currentChainId = await provider.request({ method: "eth_chainId" });
    if (currentChainId !== HEDERA_TESTNET_CHAIN_ID) {
      const switched = await switchToHederaTestnet(provider);
      if (!switched) {
        return {
          data: null,
          error: new Error(
            "Please switch your MetaMask network to Hedera Testnet.\n\n" +
            "To add it manually:\n" +
            "1. Open MetaMask > Network dropdown > Add Network > Add Network Manually\n" +
            "2. Network Name: Hedera Testnet\n" +
            "3. RPC URL: https://testnet.hashio.io/api\n" +
            "4. Chain ID: 296\n" +
            "5. Currency Symbol: HBAR\n" +
            "6. Block Explorer: https://hashscan.io/testnet\n" +
            "7. Click Save, then switch to Hedera Testnet and try again."
          ),
        };
      }
    }

    // 3. Authenticate with Supabase Web3 Auth
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: "ethereum",
      statement: statement || "Sign in to AgroDex with your MetaMask wallet.",
      options: {
        url: "https://agro-dex-1u85.vercel.app",
      },
    });

    return { data, error };
  } catch (err: unknown) {
    console.error("MetaMask sign-in error:", err);
    const message = err instanceof Error ? err.message : "MetaMask authentication failed";
    return {
      data: null,
      error: new Error(message),
    };
  }
}

/**
 * Discover EIP-6963 compliant wallets installed in the browser
 */
export function discoverWallets(callback: (providers: EIP6963ProviderDetail[]) => void): () => void {
  const providers: EIP6963ProviderDetail[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAnnounce = (event: any) => {
    if (providers.some((p) => p.info.uuid === event.detail.info.uuid)) return;
    providers.push(event.detail);
    callback([...providers]);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("eip6963:announceProvider", handleAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("eip6963:announceProvider", handleAnnounce);
    }
  };
}
