import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { signInWithMetaMask as signInWithMetaMaskService } from "@/lib/metaMaskAuth";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  linkHederaWallet: (accountId: string) => Promise<void>;
  signInWithMetaMask: (statement?: string) => Promise<{ error: Error | null }>;
  isMetaMaskConnected: boolean;
  metaMaskAddress: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if the current user signed in with MetaMask
  const isMetaMaskConnected = user !== null && !user.email && !!user.user_metadata?.address;
  const metaMaskAddress = user?.user_metadata?.address || user?.user_metadata?.sub || undefined;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn("Logout error:", error.message);
      }
    } catch (err) {
      console.error("Caught error during sign out:", err);
    } finally {
      // Always forcefully clear local storage tokens to prevent getting stuck
      if (typeof window !== "undefined") {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
            localStorage.removeItem(key);
          }
        }
      }
      // Forcefully update local React state
      setSession(null);
      setUser(null);
    }
  };

  const linkHederaWallet = async (accountId: string) => {
    if (!user) throw new Error("No user logged in");

    const { error } = await supabase
      .from("profiles")
      .update({
        hedera_account_id: accountId,
        auth_method: session?.user.email ? "hybrid" : "wallet",
      })
      .eq("id", user.id);

    if (error) throw error;
  };

  const signInWithMetaMask = async (statement?: string) => {
    const { error } = await signInWithMetaMaskService(statement);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signOut,
    linkHederaWallet,
    signInWithMetaMask,
    isMetaMaskConnected,
    metaMaskAddress,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
