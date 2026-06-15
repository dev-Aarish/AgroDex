import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';
import {
  Shield, ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp,
  Users, MapPin, Activity, Loader2, RefreshCw, Info, ChevronDown, ChevronUp,
  Sparkles, Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { getFraudOverview, type FraudScore, type FraudOverview, type RiskLevel } from '@/lib/api';
import { useState } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, string> = {
  SAFE:     '#10b981',
  LOW:      '#f59e0b',
  MEDIUM:   '#f97316',
  HIGH:     '#ef4444',
  CRITICAL: '#7c3aed',
};

const RISK_BG: Record<RiskLevel, string> = {
  SAFE:     'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  LOW:      'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  MEDIUM:   'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  HIGH:     'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300',
  CRITICAL: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300',
};

const RISK_BORDER: Record<RiskLevel, string> = {
  SAFE:     'border-emerald-200 dark:border-emerald-900/40',
  LOW:      'border-yellow-200 dark:border-yellow-900/40',
  MEDIUM:   'border-orange-200 dark:border-orange-900/40',
  HIGH:     'border-red-200 dark:border-red-900/40',
  CRITICAL: 'border-purple-200 dark:border-purple-900/40',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${RISK_BG[level]}`}>
      {level === 'CRITICAL' && <Zap className="h-3 w-3" />}
      {level === 'HIGH' && <ShieldAlert className="h-3 w-3" />}
      {level === 'SAFE' && <ShieldCheck className="h-3 w-3" />}
      {level}
    </span>
  );
}

function ScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: RISK_COLORS[level] }}
        />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color: RISK_COLORS[level] }}>
        {score}
      </span>
    </div>
  );
}

// ─── Overview Cards ───────────────────────────────────────────────────────────

function OverviewCards({ overview }: { overview: FraudOverview }) {
  const { summary } = overview;
  const cards = [
    {
      label: 'Batches Analyzed',
      value: summary.totalAnalyzed.toLocaleString(),
      icon: Shield,
      color: 'blue',
      bg: 'from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-slate-900/30',
      border: 'border-blue-100 dark:border-blue-900/30',
      iconBg: 'bg-blue-100 dark:bg-blue-950/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      sub: 'Total risk assessments run',
    },
    {
      label: 'Safe Batches',
      value: summary.safeCount.toLocaleString(),
      icon: ShieldCheck,
      color: 'emerald',
      bg: 'from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-slate-900/30',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      sub: `${summary.safeRate}% of all analyzed`,
    },
    {
      label: 'Flagged Batches',
      value: summary.flaggedCount.toLocaleString(),
      icon: ShieldAlert,
      color: 'red',
      bg: 'from-red-50 to-red-100 dark:from-red-950/30 dark:to-slate-900/30',
      border: 'border-red-100 dark:border-red-900/30',
      iconBg: 'bg-red-100 dark:bg-red-950/50',
      iconColor: 'text-red-600 dark:text-red-400',
      sub: `${summary.highCount} HIGH · ${summary.criticalCount} CRITICAL`,
    },
    {
      label: 'Medium Risk',
      value: summary.mediumCount.toLocaleString(),
      icon: AlertTriangle,
      color: 'orange',
      bg: 'from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-slate-900/30',
      border: 'border-orange-100 dark:border-orange-900/30',
      iconBg: 'bg-orange-100 dark:bg-orange-950/50',
      iconColor: 'text-orange-600 dark:text-orange-400',
      sub: 'Require manual review',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <Card className={`bg-gradient-to-br ${card.bg} border ${card.border}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-slate-400">
                  {card.label}
                </CardTitle>
                <div className={`${card.iconBg} p-2 rounded-lg`}>
                  <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{card.sub}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── High Risk Batch Table ────────────────────────────────────────────────────

function HighRiskBatchTable({ batches }: { batches: FraudScore[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <ShieldCheck className="h-12 w-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">No HIGH or CRITICAL risk batches detected</p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">All analyzed batches are within acceptable risk thresholds</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Batch</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Location</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Score</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Level</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Signals</th>
            <th className="text-left py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Analyzed</th>
            <th className="text-center py-3 px-2 font-semibold text-gray-600 dark:text-slate-400">Details</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => {
            const isExpanded = expanded === batch.batchId;
            const triggeredCount = batch.triggeredCount ?? (batch.reasons || []).filter(r => r.detected !== false && r.weight > 0).length;

            return (
              <>
                <tr
                  key={batch.batchId}
                  className={`border-b border-border/50 hover:bg-muted/40 transition-colors ${isExpanded ? 'bg-muted/30' : ''}`}
                >
                  <td className="py-3 px-2">
                    <p className="font-medium text-gray-900 dark:text-white truncate max-w-[160px]" title={batch.batchName || ''}>
                      {batch.batchName || 'Unknown'}
                    </p>
                    {batch.productType && (
                      <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{batch.productType}</p>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate max-w-[120px]" title={batch.location || ''}>{batch.location || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <ScoreBar score={batch.riskScore} level={batch.riskLevel} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <RiskBadge level={batch.riskLevel} />
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${triggeredCount > 0 ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300' : 'bg-gray-100 text-gray-500'}`}>
                      {triggeredCount}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-400 dark:text-slate-500">
                    {batch.generatedAt ? new Date(batch.generatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button
                      id={`expand-batch-${batch.batchId}`}
                      onClick={() => setExpanded(isExpanded ? null : batch.batchId)}
                      className="text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors p-1 rounded"
                      aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>

                {isExpanded && (
                  <tr key={`${batch.batchId}-expanded`} className="bg-muted/20">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Triggered Signals */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                            Detected Fraud Signals
                          </h4>
                          <div className="space-y-1.5">
                            {(batch.reasons || []).filter(r => r.detected !== false && r.weight > 0).map((signal, idx) => (
                              <div key={idx} className={`p-2 rounded border ${RISK_BORDER[batch.riskLevel]} bg-card/50`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-gray-700 dark:text-slate-300">
                                    {signal.signal.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-xs font-bold text-red-600 dark:text-red-400">+{signal.weight}pts</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{signal.description}</p>
                              </div>
                            ))}
                            {(batch.reasons || []).filter(r => r.detected !== false && r.weight > 0).length === 0 && (
                              <p className="text-xs text-gray-400 italic">No fraud signals triggered.</p>
                            )}
                          </div>
                        </div>

                        {/* AI Explanation */}
                        {batch.aiExplanation && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-purple-500" />
                              Gemini AI Explanation
                            </h4>
                            <div className="p-3 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
                              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic">
                                "{batch.aiExplanation}"
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Farmer Risk Ranking ──────────────────────────────────────────────────────

function FarmerRiskRanking({ overview }: { overview: FraudOverview }) {
  if (overview.farmerRanking.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400 dark:text-slate-500">No medium/high-risk farmers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {overview.farmerRanking.map((farmer, idx) => (
        <div
          key={farmer.farmerId}
          className={`flex items-center gap-3 p-3 rounded-lg border ${RISK_BORDER[farmer.worstLevel as RiskLevel]} bg-card/60`}
        >
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
            {idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
              Farmer {farmer.farmerId.slice(0, 8)}…
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              {farmer.batchCount} batch{farmer.batchCount !== 1 ? 'es' : ''} · avg score {farmer.avgScore}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <RiskBadge level={farmer.worstLevel as RiskLevel} />
            <span className="text-xs font-bold text-gray-600 dark:text-slate-300">
              Max: {farmer.maxScore}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Regional Analytics Chart ─────────────────────────────────────────────────

function RegionalAnalyticsChart({ overview }: { overview: FraudOverview }) {
  if (overview.regionalAnalytics.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400 dark:text-slate-500">No regional data available yet</p>
      </div>
    );
  }

  const data = overview.regionalAnalytics.slice(0, 10).map(r => ({
    name: r.displayName.length > 14 ? r.displayName.slice(0, 14) + '…' : r.displayName,
    flagged: r.flaggedBatches,
    safe: r.totalBatches - r.flaggedBatches,
    avgScore: r.avgScore,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: 'currentColor' }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
        <Bar dataKey="flagged" name="Flagged (HIGH/CRITICAL)" stackId="a" fill={RISK_COLORS.HIGH} radius={[0, 0, 0, 0]} />
        <Bar dataKey="safe" name="Safe / Low" stackId="a" fill={RISK_COLORS.SAFE} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Risk Trend Chart ─────────────────────────────────────────────────────────

function RiskTrendChart({ overview }: { overview: FraudOverview }) {
  if (overview.trend.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-10 w-10 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400 dark:text-slate-500">No trend data yet (requires 30-day history)</p>
      </div>
    );
  }

  const data = overview.trend.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          {(['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskLevel[]).map(level => (
            <linearGradient key={level} id={`grad-${level}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RISK_COLORS[level]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={RISK_COLORS[level]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'currentColor' }} />
        <YAxis tick={{ fontSize: 10, fill: 'currentColor' }} />
        <Tooltip
          contentStyle={{
            background: 'hsl(var(--popover))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: '11px' }} />
        <Area type="monotone" dataKey="CRITICAL" name="Critical" stackId="1" stroke={RISK_COLORS.CRITICAL} fill={`url(#grad-CRITICAL)`} strokeWidth={2} />
        <Area type="monotone" dataKey="HIGH"     name="High"     stackId="1" stroke={RISK_COLORS.HIGH}     fill={`url(#grad-HIGH)`}     strokeWidth={2} />
        <Area type="monotone" dataKey="MEDIUM"   name="Medium"   stackId="1" stroke={RISK_COLORS.MEDIUM}   fill={`url(#grad-MEDIUM)`}   strokeWidth={2} />
        <Area type="monotone" dataKey="LOW"      name="Low"      stackId="1" stroke={RISK_COLORS.LOW}      fill={`url(#grad-LOW)`}      strokeWidth={1.5} />
        <Area type="monotone" dataKey="SAFE"     name="Safe"     stackId="1" stroke={RISK_COLORS.SAFE}     fill={`url(#grad-SAFE)`}     strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Level Distribution Donut (visual) ───────────────────────────────────────

function LevelDistribution({ overview }: { overview: FraudOverview }) {
  const { levelCounts } = overview;
  const levels: RiskLevel[] = ['SAFE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const total = Object.values(levelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-2">
      {levels.map(level => {
        const count = levelCounts[level] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={level} className="flex items-center gap-3">
            <div className="w-14 text-right">
              <RiskBadge level={level} />
            </div>
            <div className="flex-1 h-3 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: RISK_COLORS[level] }}
              />
            </div>
            <div className="w-16 text-right text-xs text-gray-500 dark:text-slate-400 font-medium">
              {count} ({pct}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RiskIntelligence() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['fraud-overview'],
    queryFn: () => getFraudOverview().then(r => r.data),
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const overview = data as FraudOverview | undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Risk Intelligence | AgroDex</title>
        <meta
          name="description"
          content="AI-driven fraud pattern detection and risk prediction engine for agricultural batch monitoring on AgroDex."
        />
      </Helmet>

      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-orange-50 to-white dark:from-red-950/20 dark:via-orange-950/10 dark:to-background border-b border-border">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="container mx-auto px-4 py-14 relative z-10">
          <motion.div
            className="max-w-3xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 px-4 py-2 rounded-full text-sm font-bold mb-5 shadow-sm">
              <ShieldAlert className="h-4 w-4" />
              AI-Driven Fraud Detection Engine
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight mb-4">
              Risk <span className="text-red-600 dark:text-red-400">Intelligence</span> Center
            </h1>
            <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
              Deterministic rule-based fraud scoring across all agricultural batches, powered by Hedera HCS/HTS analytics and Gemini AI narrative explanations. Scores are calculated by a transparent weighted rule engine — Gemini explains, never scores.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-border">
                <Activity className="h-4 w-4 text-emerald-500" />
                7 fraud signal detectors
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-border">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Gemini AI explanations
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-border">
                <Shield className="h-4 w-4 text-blue-500" />
                Hedera-anchored scoring
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-8">

        {/* Refresh Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            Live Risk Dashboard
          </h2>
          <button
            id="fraud-overview-refresh"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-red-100 dark:border-red-950/40" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-t-red-500 animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-medium">Loading fraud intelligence data…</p>
            <p className="text-sm text-gray-400 dark:text-slate-500">Running anomaly detection across all batches</p>
          </div>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/40">
              <ShieldAlert className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 dark:text-red-300 font-semibold text-center">Failed to load risk data</p>
              <p className="text-sm text-red-600 dark:text-red-400 text-center mt-1">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        )}

        {overview && !isLoading && (
          <>
            {/* ── Section 1: Overview Cards ── */}
            <OverviewCards overview={overview} />

            {/* ── Section 2: High Risk Table + Level Distribution ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className="xl:col-span-2">
                <Card className="h-full bg-card dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <ShieldAlert className="h-5 w-5 text-red-500" />
                      High-Risk Batch Monitor
                    </CardTitle>
                    <CardDescription>
                      Batches rated HIGH or CRITICAL — click a row to expand fraud signals and AI explanation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <HighRiskBatchTable batches={overview.topRiskyBatches} />
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="h-full bg-card dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <Info className="h-5 w-5 text-blue-500" />
                      Risk Distribution
                    </CardTitle>
                    <CardDescription>
                      Breakdown of all analyzed batches by risk level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <LevelDistribution overview={overview} />
                    <div className="mt-6 pt-4 border-t border-border/50">
                      <p className="text-xs text-gray-400 dark:text-slate-500 leading-relaxed">
                        <strong className="text-gray-600 dark:text-slate-300">Scoring weights:</strong>{' '}
                        Multiple NFT attempts (+30), High frequency (+25), Yield anomaly (+20), Duplicate metadata (+20),
                        Missing lifecycle events (+15), Regional outlier (+15), Historical suspicious activity (+10).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Section 3 & 4: Farmer Ranking + Regional Analytics ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="bg-card dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <Users className="h-5 w-5 text-orange-500" />
                    Farmer Risk Ranking
                  </CardTitle>
                  <CardDescription>
                    Top 10 farmers by worst fraud score — medium risk and above only
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FarmerRiskRanking overview={overview} />
                </CardContent>
              </Card>

              <Card className="bg-card dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    Regional Fraud Analytics
                  </CardTitle>
                  <CardDescription>
                    Flagged vs safe batch counts by geographic region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RegionalAnalyticsChart overview={overview} />
                </CardContent>
              </Card>
            </div>

            {/* ── Section 5: 30-Day Risk Trend ── */}
            <Card className="bg-card dark:border-slate-800 mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  30-Day Risk Trend
                </CardTitle>
                <CardDescription>
                  Daily count of fraud scores by risk level over the last 30 days — stacked area chart
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiskTrendChart overview={overview} />
              </CardContent>
            </Card>

            {/* Footer note */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30 text-sm">
              <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">About This System</p>
                <p className="text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Risk scores are computed deterministically by AgroDex's weighted rule engine — Gemini AI only generates explanatory text and never influences numerical scores.
                  Scores are cached for 1 hour and can be refreshed on-demand. All underlying HCS and HTS data is anchored on the Hedera Testnet.
                  Last data refresh: {new Date(overview.generatedAt).toLocaleString()}.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
