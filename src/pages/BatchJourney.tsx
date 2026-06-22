import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  Coins,
  ExternalLink,
  FileCheck2,
  FileText,
  Hash,
  MapPin,
  PackageCheck,
  Route,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CopyButton } from "@/components/CopyButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getFraudByBatch, type FraudScore, verifyBatchById } from "@/lib/api";
import type { VerifyBatchResponse, VerifyBatchResult } from "@/lib/api";

type TimelineStatus = "complete" | "attention" | "pending";

interface JourneyEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  location: string;
  actor: string;
  txId?: string;
  status: TimelineStatus;
  category: "registration" | "quality" | "tokenization" | "transport" | "distribution" | "verification";
}

interface LocationStop {
  name: string;
  timestamp: string;
  note: string;
  status: TimelineStatus;
}

const sampleEvents: JourneyEvent[] = [
  {
    id: "registration",
    title: "Batch Registration",
    description: "Organic Arabica Coffee batch registered with farm origin, quantity, harvest date, and initial photo evidence.",
    timestamp: "2026-06-10T08:15:00Z",
    location: "Nyeri County, Kenya",
    actor: "Farm Cooperative",
    txId: "0.0.4759821@1718007300.441892000",
    status: "complete",
    category: "registration",
  },
  {
    id: "quality",
    title: "Quality Validation",
    description: "Moisture, grade, and packaging checks passed. AI inspection found no visible anomalies in the uploaded batch record.",
    timestamp: "2026-06-11T11:40:00Z",
    location: "Nairobi Quality Lab",
    actor: "Quality Validator",
    txId: "0.0.4759821@1718106000.109421000",
    status: "complete",
    category: "quality",
  },
  {
    id: "tokenization",
    title: "NFT Tokenization",
    description: "Batch certificate minted as a Hedera token and linked to the verified HCS registration trail.",
    timestamp: "2026-06-12T09:25:00Z",
    location: "Hedera Testnet",
    actor: "AgroDex Tokenization Service",
    txId: "0.0.4759821@1718184300.778221000",
    status: "complete",
    category: "tokenization",
  },
  {
    id: "transport",
    title: "Transportation Update",
    description: "Sealed cargo departed Nairobi distribution hub. Temperature and route checkpoint data were recorded.",
    timestamp: "2026-06-13T16:10:00Z",
    location: "Mombasa Corridor",
    actor: "Logistics Partner",
    txId: "0.0.4759821@1718295000.351990000",
    status: "attention",
    category: "transport",
  },
  {
    id: "distribution",
    title: "Distribution Event",
    description: "Importer intake confirmed with quantity reconciliation. One checkpoint arrived later than the expected route window.",
    timestamp: "2026-06-15T13:35:00Z",
    location: "Mumbai Port Warehouse",
    actor: "Distribution Partner",
    txId: "0.0.4759821@1718458500.913550000",
    status: "attention",
    category: "distribution",
  },
  {
    id: "verification",
    title: "Product Verification",
    description: "Buyer-facing verification completed and provenance trail reviewed against blockchain records.",
    timestamp: "2026-06-16T10:05:00Z",
    location: "Retail Verification",
    actor: "Buyer QR Scan",
    txId: "0.0.4759821@1718532300.223714000",
    status: "complete",
    category: "verification",
  },
];

const sampleLocations: LocationStop[] = [
  { name: "Nyeri County", timestamp: "Jun 10", note: "Harvest origin recorded", status: "complete" },
  { name: "Nairobi Lab", timestamp: "Jun 11", note: "Quality validation passed", status: "complete" },
  { name: "Mombasa Corridor", timestamp: "Jun 13", note: "Transport checkpoint delayed", status: "attention" },
  { name: "Mumbai Warehouse", timestamp: "Jun 15", note: "Distribution intake confirmed", status: "attention" },
  { name: "Retail Verification", timestamp: "Jun 16", note: "Buyer scan completed", status: "complete" },
];

const categoryIcon = {
  registration: FileText,
  quality: FileCheck2,
  tokenization: Coins,
  transport: Truck,
  distribution: PackageCheck,
  verification: ShieldCheck,
};

const statusStyle: Record<TimelineStatus, string> = {
  complete: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900/40",
  attention: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900/40",
  pending: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800",
};

const isVerifiedResponse = (
  result: VerifyBatchResult | undefined | null,
): result is VerifyBatchResponse =>
  Boolean(result && "success" in result && result.success === true);

const formatDateTime = (value?: string) => {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const shortId = (value?: string) => {
  if (!value) return "Not recorded";
  if (value.length <= 22) return value;
  return `${value.slice(0, 12)}...${value.slice(-8)}`;
};

function buildEvents(batch?: VerifyBatchResponse | null): JourneyEvent[] {
  if (!batch?.batch) return sampleEvents;

  const record = batch.batch;
  const registrationTx = record.hcs_tx_id || batch.hcsTransactionIds?.[0];
  const tokenTx = batch.hcsTransactionIds?.[1] || registrationTx;
  const verifiedAt = batch.verifiedAt || new Date().toISOString();

  return [
    {
      id: "registration",
      title: "Batch Registration",
      description: `${record.product_type || "Agricultural product"} batch registered with quantity ${record.quantity || "not specified"}.`,
      timestamp: record.created_at || record.harvest_date,
      location: record.location || "Origin location not recorded",
      actor: "Farm or producer account",
      txId: registrationTx,
      status: registrationTx ? "complete" : "attention",
      category: "registration",
    },
    {
      id: "quality",
      title: "Quality Validation",
      description: batch.ai_summary?.trustExplanation || "Quality evidence is tied to the registration record and available verification metadata.",
      timestamp: record.created_at || verifiedAt,
      location: record.location || "Quality checkpoint not recorded",
      actor: "AgroDex AI review",
      txId: registrationTx,
      status: batch.ai_summary ? "complete" : "attention",
      category: "quality",
    },
    {
      id: "tokenization",
      title: "NFT Tokenization",
      description: "Batch certificate minted and associated with Hedera token metadata.",
      timestamp: record.tokenized_at || verifiedAt,
      location: "Hedera network",
      actor: "AgroDex tokenization service",
      txId: tokenTx,
      status: record.hedera_token_id || batch.tokenId ? "complete" : "pending",
      category: "tokenization",
    },
    {
      id: "transport",
      title: "Transportation Updates",
      description: "No dedicated transportation feed is attached yet. Add logistics checkpoints to strengthen traceability.",
      timestamp: verifiedAt,
      location: "In transit",
      actor: "Logistics partner",
      status: "attention",
      category: "transport",
    },
    {
      id: "distribution",
      title: "Distribution Events",
      description: "Distribution handoff history is not yet linked for this batch.",
      timestamp: verifiedAt,
      location: "Distribution checkpoint",
      actor: "Distributor",
      status: "attention",
      category: "distribution",
    },
    {
      id: "verification",
      title: "Product Verification",
      description: `Verification status: ${batch.status || "verified"}. Buyer-facing lookup completed successfully.`,
      timestamp: verifiedAt,
      location: "Verifier device",
      actor: "AgroDex verification",
      txId: registrationTx,
      status: "complete",
      category: "verification",
    },
  ];
}

function buildLocations(batch?: VerifyBatchResponse | null): LocationStop[] {
  if (!batch?.batch) return sampleLocations;

  const origin = batch.batch.location || "Origin location";
  return [
    { name: origin, timestamp: "Origin", note: "Batch registration point", status: "complete" },
    { name: "Quality checkpoint", timestamp: "Validation", note: batch.ai_summary ? "AI summary available" : "Quality details incomplete", status: batch.ai_summary ? "complete" : "attention" },
    { name: "Transport checkpoint", timestamp: "Transit", note: "Logistics feed not connected", status: "attention" },
    { name: "Verification point", timestamp: "Verified", note: "Consumer record loaded", status: "complete" },
  ];
}

function RiskBadge({ risk }: { risk?: FraudScore | null }) {
  if (!risk) {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
        Risk data pending
      </Badge>
    );
  }

  const isHighRisk = ["HIGH", "CRITICAL"].includes(risk.riskLevel);
  return (
    <Badge className={isHighRisk ? "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"}>
      {risk.riskLevel} risk · {risk.riskScore}/100
    </Badge>
  );
}

export default function BatchJourney() {
  const { batchId = "sample-batch" } = useParams<{ batchId: string }>();
  const isSample = batchId === "sample-batch";

  const batchQuery = useQuery({
    queryKey: ["batch-journey", batchId],
    queryFn: () => verifyBatchById(batchId),
    enabled: !isSample,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const riskQuery = useQuery({
    queryKey: ["batch-risk", batchId],
    queryFn: () => getFraudByBatch(batchId),
    enabled: !isSample,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const verifiedBatch = isVerifiedResponse(batchQuery.data) ? batchQuery.data : null;
  const events = useMemo(() => buildEvents(verifiedBatch), [verifiedBatch]);
  const locations = useMemo(() => buildLocations(verifiedBatch), [verifiedBatch]);
  const [selectedId, setSelectedId] = useState(events[0]?.id ?? "registration");
  const selectedEvent = events.find((event) => event.id === selectedId) ?? events[0];
  const riskData = isSample ? null : riskQuery.data?.data ?? null;

  const productName = verifiedBatch?.batch?.batch_name || verifiedBatch?.batch?.product_type || "Organic Arabica Coffee";
  const productOrigin = verifiedBatch?.batch?.location || "Nyeri County, Kenya";
  const tokenId = verifiedBatch?.batch?.hedera_token_id || verifiedBatch?.tokenId || "0.0.6124839";
  const verificationRecords = verifiedBatch?.hcsTransactionIds?.length || sampleEvents.filter((event) => event.txId).length;
  const qualityInsight = verifiedBatch?.ai_summary?.trustExplanation || "Quality evidence is consistent across registration, validation, tokenization, and verification checkpoints.";
  const highlights = verifiedBatch?.ai_summary?.summary_en
    ? [verifiedBatch.ai_summary.summary_en]
    : [
        "Origin and tokenization records are anchored to Hedera.",
        "One transport and distribution checkpoint needs review.",
        "Buyer verification completed with matching token evidence.",
      ];

  const riskWarnings = riskData?.triggeredSignals?.length
    ? riskData.triggeredSignals.map((signal) => signal.description)
    : isSample
      ? [
          "Transport checkpoint exceeded the expected route window.",
          "Distribution intake has a delayed handoff timestamp.",
          "No cold-chain sensor packet attached to the final verification event.",
        ]
      : ["No dedicated logistics risk feed is connected for this batch yet."];

  return (
    <div className="min-h-screen bg-slate-50 text-foreground dark:bg-slate-950">
      <Helmet>
        <title>Batch Journey | AgroDex</title>
      </Helmet>
      <Navbar />

      <main className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-8 lg:py-10">
        <section className="mb-8 grid gap-6 lg:grid-cols-[1.45fr_0.55fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              <Route className="h-4 w-4" />
              Batch Journey Dashboard
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Supply chain timeline for {productName}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 dark:text-slate-300">
              Follow batch {batchId} from origin registration through quality review, Hedera tokenization, logistics, distribution, and buyer verification.
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Traceability health</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{isSample ? "82%" : verifiedBatch ? "Live" : "Loading"}</p>
              </div>
              <RiskBadge risk={riskData} />
            </div>
          </div>
        </section>

        {batchQuery.isError && !isSample && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            Live batch history could not be loaded, so the dashboard is showing the standard journey structure with missing-data indicators.
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Product Origin", value: productOrigin, icon: MapPin },
            { label: "Hedera Token", value: tokenId, icon: Hash },
            { label: "Verification Records", value: `${verificationRecords}`, icon: ShieldCheck },
            { label: "Last Event", value: formatDateTime(events[events.length - 1]?.timestamp), icon: Clock },
          ].map((metric) => (
            <Card key={metric.label} className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</CardTitle>
                  <metric.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-2">
                  <p className="break-words text-lg font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  {metric.label === "Hedera Token" && metric.value && metric.value !== "Not recorded" && (
                    <CopyButton value={metric.value} successMessage="Token ID copied!" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mb-8 grid min-w-0 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="min-w-0 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Route className="h-5 w-5 text-emerald-600" />
                Interactive Timeline
              </CardTitle>
              <CardDescription>Select any checkpoint to inspect its blockchain and operational context.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid min-w-0 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-3">
                  {events.map((event, index) => {
                    const Icon = categoryIcon[event.category];
                    const isSelected = event.id === selectedEvent.id;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedId(event.id)}
                        className={`group grid w-full grid-cols-[2.25rem_1fr_auto] items-center gap-3 rounded-lg border p-3 text-left transition ${
                          isSelected
                            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                            : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-900/50"
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-full border ${statusStyle[event.status]}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-gray-900 dark:text-white">{event.title}</span>
                          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{formatDateTime(event.timestamp)}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className={statusStyle[event.status]}>{event.status}</Badge>
                          {index < events.length - 1 && <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <motion.div
                  key={selectedEvent.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDateTime(selectedEvent.timestamp)}</p>
                    </div>
                    <Badge variant="outline" className={statusStyle[selectedEvent.status]}>{selectedEvent.status}</Badge>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedEvent.description}</p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase text-slate-500">Location</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedEvent.location}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase text-slate-500">Actor</p>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedEvent.actor}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-3 sm:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase text-slate-500">Hedera Transaction ID</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="break-words font-mono text-sm text-gray-900 dark:text-white">{selectedEvent.txId || "Not recorded for this checkpoint"}</p>
                        {selectedEvent.txId && (
                          <CopyButton value={selectedEvent.txId} successMessage="Transaction ID copied!" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Sparkles className="h-5 w-5 text-blue-600" />
                AI Provenance Summary
              </CardTitle>
              <CardDescription>Origin, highlights, traceability, and quality insights.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-950/30">
                <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Product Origin</p>
                <p className="mt-1 font-bold text-gray-900 dark:text-white">{productOrigin}</p>
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Journey Highlights</p>
                <div className="space-y-2">
                  {highlights.map((item) => (
                    <div key={item} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Traceability Information</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {verificationRecords} blockchain-backed record{verificationRecords === 1 ? "" : "s"} connect origin, token, and verification milestones.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Quality Insights</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{qualityInsight}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                Risk Intelligence Integration
              </CardTitle>
              <CardDescription>Alerts, suspicious activity indicators, missing data warnings, and risk events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Current risk posture</span>
                <RiskBadge risk={riskData} />
              </div>
              {riskWarnings.map((warning) => (
                <div key={warning} className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{warning}</span>
                </div>
              ))}
              {riskQuery.isError && !isSample && (
                <div className="flex gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">
                  <CircleDashed className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Risk service was unavailable for this batch during page load.</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Location History
              </CardTitle>
              <CardDescription>Locations visited and journey progression markers.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <div key={`${location.name}-${index}`} className="grid grid-cols-[1.75rem_1fr] gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`h-7 w-7 rounded-full border ${statusStyle[location.status]}`} />
                      {index < locations.length - 1 && <span className="mt-2 h-full min-h-8 w-px bg-slate-200 dark:bg-slate-800" />}
                    </div>
                    <div className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-gray-900 dark:text-white">{location.name}</p>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{location.timestamp}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{location.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Hash className="h-5 w-5 text-slate-700 dark:text-slate-300" />
                Blockchain Records
              </CardTitle>
              <CardDescription>Hedera identifiers and event timestamps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500">Token ID</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="mt-1 break-words font-mono text-sm font-bold text-gray-900 dark:text-white">{tokenId}</p>
                    {tokenId && tokenId !== "Not recorded" && (
                      <CopyButton value={tokenId} successMessage="Token ID copied!" />
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <p className="text-xs font-semibold uppercase text-slate-500">Serial Number</p>
                  <p className="mt-1 font-mono text-sm font-bold text-gray-900 dark:text-white">{verifiedBatch?.serialNumber || "1"}</p>
                </div>
              </div>
              {events.filter((event) => event.txId).map((event) => (
                <div key={`${event.id}-chain`} className="flex flex-col gap-1 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{event.title}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(event.timestamp)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="break-words font-mono text-xs text-slate-600 dark:text-slate-300">{shortId(event.txId)}</span>
                    {event.txId && (
                      <CopyButton value={event.txId} successMessage="Transaction ID copied!" size="sm" className="h-6 w-6" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Verification Actions</CardTitle>
              <CardDescription>Continue into existing AgroDex verification and risk workflows.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-emerald-600 text-white hover:bg-emerald-700">
                <Link to={`/verify/${batchId}`}>
                  Verify Batch
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/risk-intelligence">
                  Risk Dashboard
                  <ShieldAlert className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
