import { useEffect, useMemo, useState } from 'react';
import { wallet } from '../lib/hashpack';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Wallet, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';

function inIframe() {
  return false;
}

function NewTabHint() {
  const openTab = () => window.open(window.location.href, '_blank', 'noopener,noreferrer');
  return (
    <Alert variant="default" className="bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <span>This application is embedded. Extensions cannot be injected into iframes.</span>
          <Button 
            onClick={openTab} 
            variant="outline" 
            size="sm"
            className="ml-2 bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Open in a new tab
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

function HelpPanel({ network }: { network: string }) {
  return (
    <div className="space-y-3 p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/50">
      <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          No account <span className="uppercase font-bold text-blue-700 dark:text-blue-400">{network}</span> available
      </div>
      
      <div className="text-sm text-gray-700 dark:text-slate-300 space-y-2">
        <p className="font-medium">To connect your HashPack wallet, follow these steps:</p>
        <ol className="list-decimal ml-5 space-y-2">
          <li>
            <strong>Install the HashPack extension</strong>
            <br />
            <a
              className="text-blue-700 dark:text-blue-400 underline hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center gap-1"
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
              className="text-blue-700 dark:text-blue-400 underline hover:text-blue-900 dark:hover:text-blue-300 inline-flex items-center gap-1"
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
            <span className="text-gray-600 dark:text-slate-400">
              HashPack → Settings → Networks → <strong>Testnet</strong> → <em>Import an account</em> (paste your private key from the portal)
            </span>
          </li>
          <li>
            <strong>Login back</strong>
            <br />
            <span className="text-gray-600 dark:text-slate-400">Come back here and click "Retry"</span>
          </li>
        </ol>
      </div>

      <div className="flex gap-2 flex-wrap pt-2">
        <Button asChild variant="default" size="sm" className="bg-black hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700">
          <a
            target="_blank"
            rel="noreferrer"
            href="https://chromewebstore.google.com/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Install HashPack
          </a>
        </Button>
        <Button asChild variant="default" size="sm" className="bg-black hover:bg-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700">
          <a target="_blank" rel="noreferrer" href="https://portal.hedera.com/register">
            <ExternalLink className="h-3 w-3 mr-1" />
            Create a Testnet account
          </a>
        </Button>
        <Button onClick={() => wallet.connect()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    </div>
  );
}

export default function WalletLogin() {
  const [state, setState] = useState(wallet.getState());
  const embedded = useMemo(() => inIframe(), []);

  useEffect(() => {
    const unsubscribe = wallet.subscribe(setState);
    return unsubscribe;
  }, []);

  const network = (state.status !== 'idle' && 'diag' in state && state.diag?.network) || 'testnet';

  return (
    <div className="space-y-4">
      {embedded && <NewTabHint />}

      {state.status === 'paired' && (
        <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Connected: {state.sessionData?.accountIds?.[0] ?? 'Hedera Account'}
          </AlertDescription>
        </Alert>
      )}

      {state.status === 'connecting' && (
        <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            Connecting… Check the extension popup or use the QR code in the modal.
          </AlertDescription>
        </Alert>
      )}

      {state.status === 'error' && (
        <>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
          <HelpPanel network={network} />
        </>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={() => wallet.connect()} 
          className="flex-1"
          disabled={state.status === 'connecting' || state.status === 'paired'}
        >
          <Wallet className="mr-2 h-4 w-4" />
          {state.status === 'paired' ? 'Connected' : 'Connect Wallet'}
        </Button>
        
        {state.status === 'paired' && (
          <Button 
            onClick={() => wallet.disconnect()} 
            variant="outline"
          >
            DDisconnect
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        💡 Tip: If nothing happens, open the application in a new tab and make sure HashPack is installed and enabled on this site..
      </p>
    </div>
  );
}
