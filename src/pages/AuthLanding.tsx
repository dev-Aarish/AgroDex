import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Mail, Lock, CheckCircle } from "lucide-react";
import WalletButton from "@/components/WalletButton";
import { Helmet } from "react-helmet-async";
import logoUrl from "@/assets/agritrust-logo.svg";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLanding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { isConnected } = useWallet();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    if (!loading && (user || isConnected)) {
      navigate("/");
    }
  }, [user, loading, isConnected, navigate]);

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
          setShowEmailForm(false);
        } else {
          navigate("/");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    catch (error: any) {
      setAuthError(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-950 dark:via-slate-900 dark:to-blue-950">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent mx-auto"></div>
          <p className="mt-4 text-white dark:text-slate-200">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-950 dark:via-slate-900 dark:to-blue-950">
      <Helmet>
        <title>Welcome | AgroDex</title>
      </Helmet>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={logoUrl}
              alt="AgroDex"
              className="h-9 w-auto drop-shadow-sm brightness-0 invert bg-white/80 dark:bg-white/10 dark:backdrop-blur-sm p-1 rounded-md"
            />
            <span className="sr-only">AgroDex</span>
            <span className="ml-2 rounded-full bg-white/10 px-2.5 py-1 text-xs text-emerald-50 ring-1 ring-white/20 whitespace-nowrap">
              Hedera Verified • Testnet
            </span>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-white hover:text-emerald-100">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white ring-1 ring-white/20 hover:bg-white/15 transition-colors"
            >
              {isSignUp ? "Sign In" : "Create account"}
            </button>
          </div>
        </div>

        {/* Outer Split Layout */}
        <div className="mt-8 sm:mt-10 grid items-center gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Left: Hero copy + features */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white"
            >
              AgroDex
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-3 mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-emerald-50/90"
            >
              AI-Powered Agricultural Traceability on Hedera
            </motion.p>

            {/* Features */}
            <div className="mt-6 sm:mt-8 space-y-4 max-w-md mx-auto lg:mx-0 text-left">
              <Feature
                title="Hedera Blockchain"
                desc="Immutable proof of every step on HCS & HTS."
              />
              <Feature
                title="Gemini 2.5 AI"
                desc="Real-time audits, Trust Scores, and buyer Q&A."
              />
              <Feature
                title="Multilingual"
                desc="AI-generated audit reports in English & French."
              />
            </div>

            {/* AI insight card */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-6 mx-auto lg:mx-0 max-w-xl rounded-xl border border-white/20 bg-white/10 p-4 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-left"
            >
              <p className="italic text-sm sm:text-base">
                "This batch shows consistent traceability across 3 harvest stages with high confidence."
              </p>
              <p className="mt-1 text-xs text-emerald-100/80">
                — Generated by Gemini 2.5 Flash
              </p>
            </motion.div>
          </div>

          {/* Right: Illustration + Auth card */}
          <div className="flex items-center justify-center w-full">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-[520px]"
            >
              <div className="rounded-3xl bg-white/60 dark:bg-slate-800/40 p-1 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-sm">
                <div className="grid gap-6 rounded-3xl bg-white dark:bg-slate-900 p-4 sm:p-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {/* Illustration Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.05 }}
                    className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 via-lime-400 to-amber-300 p-4 min-h-[160px] sm:min-h-0"
                  >
                    <motion.img
                      src="https://assets-gen.codenut.dev/images/1761557179_721de6c2.png"
                      alt="Secure blockchain traceability"
                      className="max-h-40 sm:max-h-56 w-full object-contain drop-shadow-md"
                      loading="eager"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </motion.div>

                  {/* Auth panel */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {isSignUp ? "Create Account" : "Welcome Back"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {isSignUp
                        ? "Start tracking your agricultural batches"
                        : "Sign in to access your account."}
                    </p>

                    {authError && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}

                    {authSuccess && (
                      <Alert className="mt-4 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <AlertDescription>{authSuccess}</AlertDescription>
                      </Alert>
                    )}

                    {!showEmailForm ? (
                      <div className="mt-4 space-y-3">
                        <button
                          onClick={() => setShowEmailForm(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500 transition-colors font-medium text-sm"
                        >
                          <Mail className="h-4 w-4" />
                          Email Login
                        </button>
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-slate-800"></div>
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-white dark:bg-slate-900 px-2 text-gray-500 dark:text-slate-400">
                              or
                            </span>
                          </div>
                        </div>
                        <WalletButton />
                        <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 text-center">
                          Your identity stays secure — HashPack Wallet.
                        </p>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleEmailAuth}
                        className="mt-4 space-y-4"
                      >
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700 dark:text-slate-300"
                          >
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 dark:bg-slate-950 dark:border-slate-800 dark:text-white text-sm"
                              placeholder="you@example.com"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700 dark:text-slate-300"
                          >
                            Password
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="password"
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10 dark:bg-slate-950 dark:border-slate-800 dark:text-white text-sm"
                              placeholder="••••••••"
                              required
                            />
                          </div>
                        </div>
                        <Button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-sm"
                          disabled={authLoading}
                        >
                          {authLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              {isSignUp ? "Creating account..." : "Signing in..."}
                            </div>
                          ) : isSignUp ? (
                            "Create Account"
                          ) : (
                            "Sign In"
                          )}
                        </Button>
                        <button
                          type="button"
                          onClick={() => setShowEmailForm(false)}
                          className="w-full text-xs sm:text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                        >
                          ← Back to options
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white ring-1 ring-white/30">
                  🌗 Theme ready
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-start gap-3"
    >
      <div className="mt-1 h-5 w-5 rounded-full bg-emerald-400/90 ring-2 ring-white/30 flex-shrink-0" />
      <div>
        <p className="text-white font-semibold text-sm sm:text-base">{title}</p>
        <p className="text-emerald-50/90 text-xs sm:text-sm">{desc}</p>
      </div>
    </motion.div>
  );
}