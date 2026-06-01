import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { hashPackService } from "@/lib/hashpack";
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
import {
  Wallet,
  Mail,
  Link as LinkIcon,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

interface UserProfile {
  username: string | null;
  full_name: string | null;
  hedera_account_id: string | null;
  auth_method: string;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, linkHederaWallet } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

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
      const accountId = await hashPackService.connectWallet();

      if (!accountId) {
        throw new Error("No account ID received from wallet");
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
              Manage your account and linked Hedera wallet
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

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Username
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {profile?.username || "Not set"}
                </p>
              </div>

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

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Hedera Wallet
                </label>
                {profile?.hedera_account_id ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-gray-900 dark:text-white font-mono text-sm">
                      {profile.hedera_account_id}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-green-605 border-green-600 dark:text-green-400 dark:border-green-400"
                    >
                      Linked
                    </Badge>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                      No wallet linked. Connect your HashPack wallet to enable
                      hybrid authentication.
                    </p>
                    <Button
                      onClick={handleLinkWallet}
                      disabled={linking}
                      variant="outline"
                      className="border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      {linking ? "Linking..." : "Link Hedera Wallet"}
                    </Button>
                  </div>
                )}
              </div>

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

              <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                <Button
                  onClick={() => navigate("/session-settings")}
                  variant="outline"
                  className="w-full border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Manage session duration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
