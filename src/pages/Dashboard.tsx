import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Coins,
  ShieldCheck,
  Activity,
  Zap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { getDashboardStats, getDashboardHealth } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import logoUrl from "@/assets/agritrust-logo.svg";

interface DashboardKPIs {
  totalBatches: number;
  totalNfts: number;
  totalVerifications: number;
  aiVerified: number;
}

interface AuditLot {
  token_id: string;
  serial_number: string;
  score: number;
  rationale?: string;
  trustExplanation?: string;
  verified_at?: string;
}

interface DashboardAudit {
  approvedLots: AuditLot[];
  flaggedLots: AuditLot[];
}

interface ServiceStatus {
  ok: boolean;
  ms: number;
  model?: string;
  error?: string;
}

interface HealthStatus {
  supabase: ServiceStatus;
  hedera: ServiceStatus;
  gemini: ServiceStatus;
}

interface AIInsight {
  insight_en?: string;
  error?: string;
}

export default function Dashboard() {
  
  const { t, i18n } = useTranslation();
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchOnWindowFocus: false,
  });

  const healthQuery = useQuery({
    queryKey: ["dashboard-health"],
    queryFn: getDashboardHealth,
    refetchOnWindowFocus: false,
  });

  const statsData = statsQuery.data;
  const healthData = healthQuery.data;

  const kpis: DashboardKPIs = {
    totalBatches: statsData?.kpis?.totalBatches ?? 0,
    totalNfts: statsData?.kpis?.totalNfts ?? 0,
    totalVerifications:
      statsData?.kpis?.totalVerifications ?? statsData?.kpis?.aiVerified ?? 0,
    aiVerified:
      statsData?.kpis?.aiVerified ?? statsData?.kpis?.totalVerifications ?? 0,
  };

  const audit: DashboardAudit = {
    approvedLots: statsData?.audit?.approvedLots ?? [],
    flaggedLots: statsData?.audit?.flaggedLots ?? [],
  };
  const recentActivities = [
    ...audit.approvedLots.map((lot) => ({
      type: "approved",
      title: `Lot ${lot.token_id}/${lot.serial_number} approved`,
      timestamp: lot.verified_at,
    })),
    ...audit.flaggedLots.map((lot) => ({
      type: "flagged",
      title: `Lot ${lot.token_id}/${lot.serial_number} flagged`,
      timestamp: lot.verified_at,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() -
        new Date(a.timestamp || 0).getTime(),
    )
    .slice(0, 10);
  const aiInsight = (statsData?.aiInsight ?? null) as AIInsight | null;
  const aiInsightText = aiInsight
    ? i18n.language === "en"
      ? aiInsight.insight_en || null
      : null
    : null;

  const statsError =
    statsQuery.error instanceof Error
      ? statsQuery.error.message
      : statsQuery.error
        ? "Failed to load dashboard stats"
        : null;

  const healthError =
    healthQuery.error instanceof Error
      ? healthQuery.error.message
      : healthQuery.error
        ? "Failed to load service status"
        : null;

  const healthStatus = healthData?.status as HealthStatus | undefined;
  const statsLoading = statsQuery.isLoading;
  const healthLoading = healthQuery.isLoading;
  const aiInsightError = aiInsight?.error;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Dashboard | AgroDex</title>
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-white dark:from-emerald-950/20 dark:via-blue-950/20 dark:to-background">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        <div className="container mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Logo + Brand Name */}
              <motion.div
                className="flex items-center gap-4 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
              >
                <img
                  src={logoUrl}
                  alt="AgroDex logo"
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl shadow-lg object-cover bg-white dark:bg-slate-900 p-2"
                />
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    AgroDex
                  </h2>
                  <p className="text-sm sm:text-base text-emerald-600 font-semibold mt-0.5">
                    {t('dashboard.hero.subtitle')}
                  </p>
                </div>
              </motion.div>

              <motion.div
                className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('dashboard.hero.poweredBy')}
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {t('dashboard.hero.fighting')}<span className="text-emerald-600">{t('dashboard.hero.fraud')}</span> in
                {t('dashboard.hero.location')}
              </h1>

              <p className="text-xl sm:text-2xl font-body text-gray-600 dark:text-slate-300 leading-relaxed">
                {t('dashboard.hero.description')}
              </p>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-3xl blur-2xl opacity-20" />
              <img
                src="https://assets-gen.codenut.dev/images/1761634617_bb2f7a28.png"
                alt="Producteur africain avec grains de café"
                className="relative w-full h-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <Card className="border-2 border-emerald-100 dark:border-emerald-950/30 bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {t('dashboard.stats.registeredBatches')}
                </CardTitle>
                <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white min-h-[1.5rem] flex items-center">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                ) : (
                  kpis.totalBatches.toLocaleString()
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{t('dashboard.stats.totalOnPlatform')}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 dark:border-blue-950/30 bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {t('dashboard.stats.nftsCreated')}
                </CardTitle>
                <div className="bg-blue-100 dark:bg-blue-950/50 p-2 rounded-lg">
                  <Coins className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white min-h-[1.5rem] flex items-center">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                ) : (
                  kpis.totalNfts.toLocaleString()
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {t('dashboard.stats.tokenizedCertificates')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 dark:border-purple-950/30 bg-card text-card-foreground">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {t('dashboard.stats.aiVerifications')}
                </CardTitle>
                <div className="bg-purple-100 dark:bg-purple-950/50 p-2 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white min-h-[1.5rem] flex items-center">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                ) : (
                  kpis.aiVerified.toLocaleString()
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                {t('dashboard.stats.verifiedBatches')}
              </p>
            </CardContent>
          </Card>
        </div>

        {!statsLoading && !statsError && (
          <p className="text-xs text-gray-500 mb-8">
            {kpis.totalVerifications.toLocaleString()} verifications IA
            realisees, dont {audit.flaggedLots.length} lot(s) a surveiller.
          </p>
        )}        {/* AI Insight Card */}
        <Card className="mb-8 border-2 border-purple-200 dark:border-purple-950/30 bg-gradient-to-br from-purple-50 via-white to-white dark:from-purple-950/20 dark:via-slate-900/10 dark:to-card bg-card text-card-foreground">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {t('dashboard.aiInsight.title')}
              </CardTitle>
              <div className="flex items-center gap-2">
                
                <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full">
                  <Sparkles className="h-3 w-3" />
                  Generated by Gemini AI
                </div>
              </div>
            </div>
            <CardDescription className="text-gray-500 dark:text-slate-400">
              {t('dashboard.aiInsight.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-4 text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                {t('dashboard.aiInsight.loading')}
              </div>
            ) : statsError ? (
              <div className="text-center py-4 text-red-600 dark:text-red-400 font-semibold">
                Error: {statsError}
              </div>
            ) : aiInsightText ? (
              <>
                <p className="text-base text-gray-800 dark:text-slate-200 leading-relaxed italic">
                  “{aiInsightText}”
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
                  {t('dashboard.aiInsight.generatedOn')}{" "}
                  {new Date(
                    statsData?.generatedAt ?? Date.now(),
                  ).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-base text-gray-600 dark:text-slate-400 italic">
                {t('dashboard.aiInsight.unavailable')}
              </p>
            )}
            {aiInsightError && !statsLoading && !statsError && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
                AI Note: {aiInsightError}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Audit Journal & Service Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Audit Journal Card */}
          <Card className="bg-card text-card-foreground dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {t('dashboard.audit.title')}
              </CardTitle>
              <CardDescription className="text-gray-500 dark:text-slate-400">
                {t('dashboard.audit.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  Change in the AI log...
                </div>
              ) : statsError ? (
                <div className="text-center py-8 text-red-600 dark:text-red-400 font-semibold">
                  Error: {statsError}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Approved Lots */}
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('dashboard.audit.approved')}
                    </h3>
                    {audit.approvedLots.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                        {t('dashboard.audit.noApproved')}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {audit.approvedLots.map((lot, idx) => {
                          const score = Math.round(lot.score || 0);
                          return (
                            <li
                              key={`${lot.token_id}-${lot.serial_number}-${idx}`}
                              className="flex items-start gap-2 text-sm p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded border border-emerald-200 dark:border-emerald-900/30"
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                              <span className="flex-1 text-gray-800 dark:text-slate-200">
                                Lot{" "}
                                <a
                                  href={`https://hashscan.io/testnet/token/${lot.token_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                  {lot.token_id}/{lot.serial_number}
                                </a>{" "}
                                - Score {score}/100
                                {lot.trustExplanation && (
                                  <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {lot.trustExplanation}
                                  </span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Flagged Lots */}
                  <div>
                    <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t('dashboard.audit.flagged')}
                    </h3>
                    {audit.flaggedLots.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-slate-400 italic">
                        {t('dashboard.audit.noFlagged')}
                      </p>
                    ) : (
                      <TooltipProvider>
                        <ul className="space-y-2">
                          {audit.flaggedLots.map((lot, idx) => {
                            const score = Math.round(lot.score || 0);
                            return (
                              <li
                                key={`${lot.token_id}-${lot.serial_number}-${idx}`}
                                className="flex items-start gap-2 text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-900/30"
                              >
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs bg-popover text-popover-foreground border border-border">
                                    <p className="text-xs font-semibold mb-1">
                                      Reason for flagging:
                                    </p>
                                    <p className="text-xs">{lot.rationale}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <span className="flex-1 text-gray-800 dark:text-slate-200">
                                  Lot{" "}
                                  <a
                                    href={`https://hashscan.io/testnet/token/${lot.token_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  >
                                    {lot.token_id}/{lot.serial_number}
                                  </a>{" "}
                                  - Score {score}/100
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Status Card */}
          <Card className="bg-card text-card-foreground dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {t('dashboard.status.title')}
              </CardTitle>
              <CardDescription className="text-slate-500 dark:text-slate-400">{t('dashboard.status.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {healthLoading ? (
                <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                  Verification des services...
                </div>
              ) : healthError ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
                    ⚠️ Connection Error
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">{healthError}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Verifier que le backend est demarre et accessible.
                  </p>
                </div>
              ) : !healthStatus ? (
                <div className="text-center py-8">
                  <p className="text-red-600 dark:text-red-400 font-semibold mb-2">⚠️ No Data</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    Unable to retrieve service status.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Hedera Mirror Node */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${healthStatus.hedera.ok
                          ? "bg-emerald-500"
                          : "bg-red-500"
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Hedera Mirror Node
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {healthStatus.hedera.ok ? "Operational" : "Offline"}
                        </p>
                        {!healthStatus.hedera.ok &&
                          healthStatus.hedera.error && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                              {healthStatus.hedera.error}
                            </p>
                          )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        {healthStatus.hedera.ms}ms
                      </p>
                    </div>
                  </div>

                  {/* Supabase DB */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${healthStatus.supabase.ok
                          ? "bg-emerald-500"
                          : "bg-red-500"
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Supabase DB
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {healthStatus.supabase.ok ? "Operational" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        {healthStatus.supabase.ms}ms
                      </p>
                    </div>
                  </div>

                  {/* Gemini AI */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${healthStatus.gemini.ok
                          ? "bg-emerald-500"
                          : "bg-red-500"
                          }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Gemini AI{" "}
                          {healthStatus.gemini.model
                            ? `(${healthStatus.gemini.model})`
                            : ""}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {healthStatus.gemini.ok ? "Operational" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700 dark:text-slate-300">
                        {healthStatus.gemini.ms}ms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="mb-8 bg-card text-card-foreground dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest actions across the platform
            </CardDescription>
          </CardHeader>

          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No recent activity yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {activity.title}
                      </p>

                      <p
                        className={`text-xs mt-1 ${activity.type === "approved"
                            ? "text-emerald-600"
                            : "text-orange-600"
                          }`}
                      >
                        {activity.type === "approved"
                          ? "Approved"
                          : "Flagged for Review"}
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp
                        ? new Date(activity.timestamp).toLocaleString()
                        : "Unknown time"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="bg-card text-card-foreground dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Technology Stack</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">
              Technologies used for traceability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-slate-900/30 rounded-lg border border-emerald-100/50 dark:border-emerald-900/20">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 mb-1">
                  Hedera HCS
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">Immutable consensus</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-slate-900/30 rounded-lg border border-blue-100/50 dark:border-blue-900/20">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-1">
                  Hedera HTS
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-500">NFT Tokenization</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-slate-900/30 rounded-lg border border-purple-100/50 dark:border-purple-900/20">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-400 mb-1">
                  Gemini AI 2.5
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-500">Analysis & Provenance</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-slate-900/30 rounded-lg border border-orange-100/50 dark:border-orange-900/20">
                <p className="text-sm font-semibold text-orange-900 dark:text-orange-400 mb-1">
                  Supabase
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-500">Database</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
