import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  FileText,
  Coins,
  ShieldCheck,
  User,
  Settings,
  LogOut,
  Menu,
  BarChart3,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { useServiceStatus } from "@/hooks/useServiceStatus";
import { ThemeToggle } from "@/components/ThemeToggle";
import logoUrl from "@/assets/agritrust-logo.svg";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { accountId, isConnected, network, disconnect } = useWallet();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSuccess, isError } = useServiceStatus();

  // Déterminer la couleur et le texte du tooltip
  let statusColor = "bg-gray-400";
  let statusTooltip = "Connecting to services...";
  if (isSuccess) {
    statusColor = "bg-green-500";
    statusTooltip = "All systems operational.";
  } else if (isError) {
    statusColor = "bg-red-500";
    statusTooltip = "Service disruption detected.";
  }

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { to: "/register", label: "Register", icon: FileText },
    { to: "/tokenize", label: "Tokenize", icon: Coins },
    { to: "/verify", label: "Verify", icon: ShieldCheck },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Display name: prefer email if logged in via Supabase, otherwise show wallet account
  const displayName = user?.email || (isConnected && accountId) || "User";

  // Handle logout: sign out from Supabase AND disconnect wallet
  const handleLogout = async () => {
    if (user) await signOut();
    if (isConnected) await disconnect();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 supports-[backdrop-filter]:dark:bg-slate-950/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src={logoUrl} alt="AgroDex" className="h-10 w-auto" />
            <div className="flex items-center gap-2">
              {/* Status Indicator */}
              <div
                className={`w-3 h-3 rounded-full ${statusColor} transition-colors duration-300`}
                title={statusTooltip}
              />
              <span className="hidden sm:block text-xl font-heading font-bold text-gray-900 dark:text-white">
                AgroDex
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}>
                <Button
                  variant="ghost"
                  className={
                    isActive(to)
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 rounded-full px-4 py-2"
                      : "text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-full px-4 py-2"
                  }
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {/* Wallet indicator (shown when connected via wallet) */}
            {isConnected && accountId && (
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800">
                <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-mono text-blue-700 dark:text-blue-300">
                  {accountId}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    network === "testnet" ? "bg-amber-500" : "bg-green-500"
                  }`}
                  title={network}
                />
              </div>
            )}

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-gray-100 dark:border-slate-800">
              <User className="h-4 w-4 text-gray-600 dark:text-slate-400" />
              <span className="text-sm font-body text-gray-700 dark:text-slate-300 max-w-[150px] truncate">
                {displayName}
              </span>
            </div>
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/session-settings" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6 text-gray-700 dark:text-slate-300" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] dark:bg-slate-950 dark:border-slate-800">
                <div className="flex flex-col gap-6 mt-8">
                  {/* User Info */}
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-900 px-4 py-3 rounded-lg border border-gray-100 dark:border-slate-800">
                    <User className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                    <span className="text-sm font-body text-gray-700 dark:text-slate-300 truncate">
                      {displayName}
                    </span>
                  </div>

                  {/* Wallet info (mobile) */}
                  {isConnected && accountId && (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-mono text-blue-700 dark:text-blue-300 truncate">
                        {accountId}
                      </span>
                      <span
                        className={`ml-auto px-2 py-0.5 text-xs rounded-full font-semibold ${
                          network === "testnet"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {network}
                      </span>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <nav className="flex flex-col gap-2">
                    {navLinks.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Button
                          variant="ghost"
                          className={`w-full justify-start rounded-full ${
                            isActive(to)
                              ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900"
                              : "text-gray-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {label}
                        </Button>
                      </Link>
                    ))}
                  </nav>

                  {/* Divider */}
                  <div className="border-t border-gray-200 dark:border-slate-800" />

                  {/* User Actions */}
                  <div className="flex flex-col gap-2">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </Link>
                    <Link
                      to="/session-settings"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
