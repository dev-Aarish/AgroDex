import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useCoreWallet } from "@/hooks/useCoreWallet";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { DeleteProfileModal } from "@/components/DeleteProfileModal";

interface UserProfile {
  username: string | null;
  full_name: string | null;
  hedera_account_id: string | null;
  core_wallet_address: string | null;
  auth_method: string;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, linkHederaWallet, isMetaMaskConnected, metaMaskAddress } = useAuth();
  const { accountId, isConnected, connect, network } = useWallet();
  const { address: coreAddress, isConnected: isCoreConnected, connect: coreConnect } = useCoreWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [linkingCore, setLinkingCore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkWallet = async () => {
    setError(null);
    setSuccess(null);
    setLinking(true);

    try {
      if (!isConnected || !accountId) {
        await connect();
        setLinking(false);
        return;
      }

      await linkHederaWallet(accountId);
      setSuccess(`Successfully linked Hedera wallet: ${accountId}`);
      await loadProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Wallet linking error:", err);
      setError(err.message || "Failed to link wallet");
    } finally {
      setLinking(false);
    }
  };

  const handleLinkCoreWallet = async () => {
    setError(null);
    setSuccess(null);
    setLinkingCore(true);

    try {
      if (!isCoreConnected || !coreAddress) {
        await coreConnect();
        setLinkingCore(false);
        return;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          core_wallet_address: coreAddress,
          auth_method: "core_wallet",
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setSuccess(`Successfully linked Core wallet: ${coreAddress}`);
      await loadProfile();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Core wallet linking error:", err);
      setError(err.message || "Failed to link Core wallet");
    } finally {
      setLinkingCore(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-2">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 dark:bg-background text-foreground">
      <Helmet>
        <title>Profile | AgroDex</title>
      </Helmet>
      <Navbar />

      <div className="container mx-auto max-w-2xl py-8 px-4">
        <Card className="bg-card text-card-foreground dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">User Profile</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Manage your account and linked wallets
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 dark:border-green-950/30 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-400">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Email
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-900 dark:text-white">
                    {user?.email || "Anonymous"}
                  </span>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {profile?.username || "Not set"}
                </p>
              </div>

              {/* Authentication Method */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Authentication Method
                </label>
                <div className="mt-1">
                  <Badge
                    variant={
                      profile?.auth_method === "hybrid"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {profile?.auth_method || "email"}
                  </Badge>
                </div>
              </div>

              {/* Linked Wallets */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Linked Wallets
                </label>

                <div className="mt-2 space-y-4">
                  {/* HashPack */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">HashPack</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Hedera</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.hedera_account_id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-600 dark:text-slate-400">
                            {profile.hedera_account_id}
                          </span>
                          <Badge variant="outline" className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400 text-xs">
                            Linked
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          onClick={handleLinkWallet}
                          disabled={linking}
                          variant="outline"
                          size="sm"
                          className="text-xs border-gray-300 dark:border-slate-700"
                        >
                          {linking ? "Linking..." : "Link"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Core */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Core</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Avalanche</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.core_wallet_address ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-600 dark:text-slate-400 truncate max-w-[120px]">
                            {profile.core_wallet_address}
                          </span>
                          <Badge variant="outline" className="text-purple-600 border-purple-600 dark:text-purple-400 dark:border-purple-400 text-xs">
                            Linked
                          </Badge>
                        </div>
                      ) : (
                        <Button
                          onClick={handleLinkCoreWallet}
                          disabled={linkingCore}
                          variant="outline"
                          size="sm"
                          className="text-xs border-gray-300 dark:border-slate-700"
                        >
                          {linkingCore ? "Connecting..." : "Link"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Active sessions */}
                {isConnected && accountId && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/50">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Active HashPack Session</p>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3.5 w-3.5 text-blue-600" />
                      <span className="font-mono text-sm text-blue-800 dark:text-blue-300">{accountId}</span>
                      <span className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold ${network === "testnet" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-green-100 text-green-700"}`}>
                        {network}
                      </span>
                    </div>
                  </div>
                )}

                {isCoreConnected && coreAddress && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900/50">
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Active Core Session</p>
                    <div className="flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-purple-600" />
                      <span className="font-mono text-sm text-purple-800 dark:text-purple-300 truncate">{coreAddress}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* MetaMask Wallet (Web3 Auth) */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  MetaMask Wallet
                </label>
                {isMetaMaskConnected && metaMaskAddress ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-gray-900 dark:text-white font-mono text-sm">
                      {metaMaskAddress}
                    </span>
                    <Badge variant="outline" className="text-orange-600 border-orange-600 dark:text-orange-400 dark:border-orange-400">
                      Authenticated
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    No MetaMask wallet connected.
                  </p>
                )}
              </div>

              {/* Member Since */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Member Since
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>

              {/* Manage Session / Danger Zone */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                <Button
                  onClick={() => navigate("/session-settings")}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 mb-4"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Manage session duration
                </Button>

                <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
                <DeleteProfileModal />
              </div>

            </div> {/* Closes space-y-4 */}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
