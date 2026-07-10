/**
 * =============================================================================
 * Login Page — Email + HashPack Wallet + MetaMask Wallet Authentication
 * =============================================================================
 *
 * Supports three login methods:
 *  1. Email/Password via Supabase (existing, unchanged)
 *  2. HashPack Wallet via HashConnect v3 (existing)
 *  3. MetaMask Wallet via Supabase Web3 Auth (EIP-4361)
 *
 * The wallet tab now shows both HashPack and MetaMask options.
 */




import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useCoreWallet } from "@/hooks/useCoreWallet";
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '@/components/LanguageSelector';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, Shield, Sparkles, Globe, CheckCircle, Eye, EyeOff, Wallet } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import MetaMaskButton from "@/components/MetaMaskButton";
import ErrorBoundary from "@/components/ErrorBoundary";
import CoreWalletButton from "@/components/CoreWalletButton";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import logoUrl from "@/assets/agritrust-logo.png";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { isConnected: isHashPackConnected } = useWallet();
  const { isConnected: isCoreConnected } = useCoreWallet();
  const isConnected = isHashPackConnected || isCoreConnected;
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [deletionMessage, setDeletionMessage] = useState<string | null>(null);
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);


  // Check for deletion success message from navigation state
  useEffect(() => {
    const message = location.state?.message;
    if (message) {
      setDeletionMessage(message);
      // Clear the message from history to prevent it showing on refresh/back navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Auto-redirect if authenticated via either method
  useEffect(() => {
    if (!loading && (user || isConnected)) {
      navigate("/dashboard");
    }
  }, [user, loading, isConnected, navigate]);

  // Existing email auth handler — unchanged
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    setAuthLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });

        if (error) throw error;

        if (data.user && !data.session) {
          setAuthSuccess("Please check your email and verify your account before signing in.");
          setIsSignUp(false);
        } else {
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (error: any) {
      setAuthError(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 dark:bg-slate-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 dark:border-emerald-400 border-t-transparent mx-auto"></div>
          <p className="mt-4 font-body text-gray-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-white dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-slate-950 dark:bg-slate-950 relative overflow-hidden">
      <Helmet>
        <title>Login | AgroDex</title>
      </Helmet>
      {/* Theme Toggle in top-right */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-200 dark:bg-emerald-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-200 dark:bg-blue-900/10 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-blue-700 p-12 flex-col justify-between relative overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Hexagon Pattern Background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(https://assets-gen.codenut.dev/images/1761634637_f0ea57c4.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Animated Gradient Orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse" />
        <div
          className="absolute bottom-20 left-20 w-64 h-64 bg-emerald-400 rounded-full mix-blend-overlay filter blur-3xl opacity-40 animate-pulse"
          style={{ animationDelay: "1.5s" }}
        />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10"
        >
          <div className="mb-8">
            <img
              src={logoUrl}
              alt="AgroDex"
              className="h-16 w-auto drop-shadow-2xl bg-white/90 dark:bg-white/10 dark:backdrop-blur-md p-2 rounded-xl"
            />
          </div>
          <h1 className="text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
            AgroDex
          </h1>
          <p className="text-2xl text-emerald-50 font-body leading-relaxed drop-shadow-lg">
            Secure agricultural traceability powered by AI and Hedera
          </p>

          {/* Stats Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 grid grid-cols-3 gap-6 bg-white/10 backdrop-blur-md rounded-2xl p-8 border-2 border-white/30 shadow-2xl"
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3">
                <Shield className="h-7 w-7 text-emerald-200" />
              </div>
              <div className="text-sm text-emerald-100 font-semibold">
                Blockchain Hedera
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3">
                <Sparkles className="h-7 w-7 text-blue-200" />
              </div>
              <div className="text-sm text-blue-100 font-semibold">
                Gemini 3.1 Flash Lite
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-xl mb-3">
                <Globe className="h-7 w-7 text-purple-200" />
              </div>
              <div className="text-sm text-purple-100 font-semibold">
                Multilingual
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Bottom Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative z-10"
        >
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-2xl blur-xl opacity-50" />
            <img
              src="https://assets-gen.codenut.dev/images/1761634617_bb2f7a28.png"
              alt="African agricultural landscape"
              className="relative rounded-2xl shadow-2xl border-4 border-white/30"
            />
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Forms */}
      <div className="flex-1 p-6 lg:p-12 relative z-10 h-full overflow-y-auto flex flex-col">
        <motion.div
          className="w-full max-w-md m-auto"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <img
                src={logoUrl}
                alt="AgroDex"
                className="h-16 w-auto mx-auto mb-4 lg:hidden bg-white dark:bg-slate-800 p-2 rounded-xl"
              />
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {t('auth.welcomeBack')}
              </h2>
              <p className="text-gray-600 dark:text-slate-400 font-body">
                {t('auth.signInDesc')}.
              </p>
            </motion.div>
          </div>

          {/* Account Deletion Success Message */}
          {deletionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <Alert className="border-2 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <AlertDescription className="font-body text-base ml-2 text-emerald-700 dark:text-emerald-300">
                  {deletionMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          <Tabs defaultValue="email" className="w-full relative z-20">
            <TabsList className="flex h-auto w-full mb-8 bg-slate-100 dark:bg-[#111827] p-1.5 rounded-full border border-slate-200 dark:border-slate-800">
              <TabsTrigger
                value="email"
                className="flex-1 text-sm font-semibold rounded-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E293B] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none"
              >
                <Mail className="w-4 h-4" />
                {t('auth.signIn')}
              </TabsTrigger>
              <TabsTrigger
                value="wallet"
                className="flex-1 text-sm font-semibold rounded-full py-3 flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-all duration-200 data-[state=active]:bg-white dark:data-[state=active]:bg-[#1E293B] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm dark:data-[state=active]:shadow-none"
              >
                <Wallet className="w-4 h-4" />
                {t('auth.connectWallet')}
              </TabsTrigger>
            </TabsList>

            {/* ===== EMAIL TAB ===== */}
            <TabsContent value="email">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0B0F19] shadow-xl dark:shadow-2xl rounded-2xl overflow-hidden transition-colors">
                  <CardHeader className="pb-4 pt-8 px-7">
                    <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight transition-colors">
                      {isSignUp ? t('auth.createAccount') : t('auth.signIn')}
                    </CardTitle>
                    <CardDescription className="font-body text-sm text-slate-500 dark:text-slate-400 mt-1.5 transition-colors">
                      {isSignUp
                        ? "Create a new account to AgroDex"
                        : "Enter your credentials to access your account"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-7 pb-8">
                    <form onSubmit={handleEmailAuth} className="space-y-5">
                      <div className="space-y-1.5 group">
                        <Label
                          htmlFor="email"
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors"
                        >
                          {t('auth.email')}
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-12 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl font-body text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 focus:bg-emerald-50/30 dark:focus:bg-slate-900 transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5 group">
                        <Label
                          htmlFor="password"
                          className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400 transition-colors"
                        >
                          {t('auth.password')}
                        </Label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="h-4 w-4 text-slate-400 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors" />
                          </div>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-11 h-12 bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700/50 text-slate-900 dark:text-white rounded-xl font-body text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:border-emerald-500 dark:focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/20 dark:focus:ring-emerald-500/30 focus:bg-emerald-50/30 dark:focus:bg-slate-900 transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/50"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {authError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Alert
                            variant="destructive"
                            className="border border-red-900/50 bg-red-950/20 text-red-400 rounded-xl"
                          >
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription className="font-body text-sm font-medium">
                              {authError}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      {authSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Alert
                            className="border border-emerald-900/50 bg-emerald-950/20 text-emerald-400 rounded-xl"
                          >
                            <CheckCircle className="h-5 w-5 text-emerald-400" />
                            <AlertDescription className="font-body text-sm font-medium ml-2">
                              {authSuccess}
                            </AlertDescription>
                          </Alert>
                        </motion.div>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="pt-1"
                      >
                        <Button
                          type="submit"
                          className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base rounded-xl shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.35)] transition-all"
                          disabled={authLoading}
                        >
                          {authLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              <span>{t('general.loading')}</span>
                            </div>
                          ) : isSignUp ? (
                            t('auth.signUp')
                          ) : (
                            t('auth.signIn')
                          )}
                        </Button>
                      </motion.div>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-sm text-slate-500 hover:text-emerald-400 font-medium font-body transition-colors"
                        >
                          {isSignUp
                            ? t('auth.hasAccount')
                            : t('auth.noAccount')}
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* ===== WALLET TAB ===== */}
            <TabsContent value="wallet">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* MetaMask Option */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}>                  <Card className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0B0F19] hover:border-orange-500/40 dark:hover:border-orange-500/40 transition-all duration-300 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-md dark:shadow-none">
                    <CardHeader className="pb-3 pt-5 px-6">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors">
                        MetaMask
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700/50 group-hover:border-orange-500/30 transition-colors duration-300">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
                        </div>
                      </CardTitle>
                      <CardDescription className="font-body text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                        Connect with your MetaMask wallet (Hedera EVM)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                      <ErrorBoundary>
                        <MetaMaskButton />
                      </ErrorBoundary>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center my-1 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent flex-1"></div>
                  <span className="px-3 text-[10px] tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold uppercase">or</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent flex-1"></div>
                </div>

                {/* HashPack Option */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}>                  <Card className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0B0F19] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-md dark:shadow-none">
                    <CardHeader className="pb-3 pt-5 px-6">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors">
                        HashPack
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700/50 group-hover:border-emerald-500/30 transition-colors duration-300">
                          <img src="https://www.google.com/s2/favicons?domain=hashpack.app&sz=128" alt="HashPack" className="w-5 h-5 rounded-md" />
                        </div>
                      </CardTitle>
                      <CardDescription className="font-body text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                        Connect with your HashPack wallet (Hedera native)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                      <WalletButton />
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center my-1 px-2">
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent flex-1"></div>
                  <span className="px-3 text-[10px] tracking-[0.2em] text-slate-400 dark:text-slate-500 font-semibold uppercase">or</span>
                  <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700/60 to-transparent flex-1"></div>
                </div>

                {/* Core Option */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}>                  <Card className="border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0B0F19] hover:border-purple-500/40 dark:hover:border-purple-500/40 transition-all duration-300 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-md dark:shadow-none">
                    <CardHeader className="pb-3 pt-5 px-6">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between transition-colors">
                        Core
                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800/80 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700/50 group-hover:border-purple-500/30 transition-colors duration-300">
                          <img src="https://www.google.com/s2/favicons?domain=core.app&sz=128" alt="Core Wallet" className="w-5 h-5 rounded-md" />
                        </div>
                      </CardTitle>
                      <CardDescription className="font-body text-xs text-slate-500 dark:text-slate-400 mt-0.5 transition-colors">
                        Connect with your Core wallet (Hedera EVM)
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                      <CoreWalletButton />
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
