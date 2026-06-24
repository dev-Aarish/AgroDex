export type CoreWalletStatus = "disconnected" | "connecting" | "connected" | "error";

export interface CoreWalletState {
  status: CoreWalletStatus;
  address: string | null;
  chainId: string | null;
  errorMessage: string | null;
  isInstalled: boolean;
}

const CORE_WALLET_CHAIN_NAMES: Record<string, string> = {
  '0xa86a': 'Avalanche C-Chain',
  '0xa869': 'Avalanche Fuji Testnet',
};

export function getProvider() {
  if (typeof window === 'undefined') return null;
  if ((window as any).avalanche) return (window as any).avalanche;
  if ((window as any).ethereum?.isAvalanche) return (window as any).ethereum;
  return null;
}

export function isCoreWalletInstalled(): boolean {
  return getProvider() !== null;
}

export async function connectCoreWallet(): Promise<{ address: string; chainId: string }> {
  const provider = getProvider();
  if (!provider) {
    throw new Error('Core wallet is not installed. Please install the Core browser extension.');
  }

  const accounts: string[] = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found. Please unlock your Core wallet.');
  }

  const chainId: string = await provider.request({ method: 'eth_chainId' });

  return {
    address: accounts[0].toLowerCase(),
    chainId,
  };
}

export function getChainName(chainId: string): string {
  return CORE_WALLET_CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;
}

// Listen for account or chain changes
export function listenToWalletChanges(
  onAccountsChanged: (accounts: string[]) => void,
  onChainChanged: (chainId: string) => void,
): () => void {
  const provider = getProvider();
  if (!provider) return () => {};

  const handleAccounts = (accounts: string[]) => onAccountsChanged(accounts);
  const handleChain = (chainId: string) => onChainChanged(chainId);

  provider.on('accountsChanged', handleAccounts);
  provider.on('chainChanged', handleChain);

  return () => {
    provider.removeListener('accountsChanged', handleAccounts);
    provider.removeListener('chainChanged', handleChain);
  };
}
