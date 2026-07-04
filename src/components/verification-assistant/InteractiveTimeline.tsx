import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/CopyButton";
import { EducationalTooltip } from "./EducationalTooltip";
import { useVerificationAssistant, type TimelineStep } from "@/context/VerificationAssistantContext";
import { useTranslation } from "react-i18next";

const statusIcons = {
  verified: CheckCircle2,
  pending: Clock,
  failed: XCircle,
};



function TimelineStepCard({
  step,
  event,
  timestamp,
  txId,
  status,
  index,
}: TimelineStep & { index: number }) {
  const [expanded, setExpanded] = useState(false);
  const { state } = useVerificationAssistant();
  const isIndonesian = state.assistantLanguage === "id";
  const Icon = statusIcons[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="relative pl-10 pb-6 last:pb-0"
    >
      <div className="absolute left-[15px] top-2 bottom-0 w-px bg-gradient-to-b from-emerald-300 via-blue-200 to-transparent dark:from-emerald-700 dark:via-blue-800 last:hidden" />

      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-600 flex items-center justify-center shadow-sm z-10">
        <Icon className={`h-4 w-4 ${
          status === "verified" ? "text-emerald-600 dark:text-emerald-400" :
          status === "pending" ? "text-amber-600 dark:text-amber-400" :
          "text-red-600 dark:text-red-400"
        }`} />
      </div>

      <div
        className="rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                  #{step}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 h-4 ${
                    status === "verified"
                      ? "border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      : status === "pending"
                        ? "border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                        : "border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                  }`}
                >
                  {isIndonesian ? (status === "verified" ? "Terverifikasi" : status === "pending" ? "Tertunda" : "Gagal") : (status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Failed")}
                </Badge>
              </div>
              <p className="font-semibold text-sm text-foreground">{event}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {new Date(timestamp).toLocaleString()}
              </p>
            </div>
            <div className="shrink-0 mt-0.5">
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <div
          className={`grid transition-all duration-200 ${
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <EducationalTooltip term="HCSMessage">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {isIndonesian ? "ID Transaksi" : "Transaction ID"}
                    </span>
                  </EducationalTooltip>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-foreground truncate max-w-[160px]">
                      {txId}
                    </span>
                    <CopyButton value={txId} successMessage={isIndonesian ? "ID Tx disalin!" : "Tx ID copied!"} size="sm" className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <a
                    href={`https://hashscan.io/testnet/transaction/${txId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isIndonesian ? "Lihat di HashScan" : "View on HashScan"} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface InteractiveTimelineProps {
  steps: TimelineStep[];
}

export function InteractiveTimeline({ steps }: InteractiveTimelineProps) {
  const { t } = useTranslation();
  const { state } = useVerificationAssistant();

  if (steps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{t("verify.noTimeline", "No blockchain events recorded for this batch.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${(steps.filter((s) => s.status === "verified").length / Math.max(steps.length, 1)) * 100}%`,
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-blue-500"
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground shrink-0">
          {steps.filter((s) => s.status === "verified").length}/{steps.length}
        </span>
      </div>

      <div className="space-y-0">
        {steps.map((step, idx) => (
          <TimelineStepCard key={step.step} {...step} index={idx} />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          {state.assistantLanguage === "id" ? "Terverifikasi" : "Verified"}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-amber-500" />
          {state.assistantLanguage === "id" ? "Tertunda" : "Pending"}
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3 w-3 text-red-500" />
          {state.assistantLanguage === "id" ? "Gagal" : "Failed"}
        </div>
      </div>
    </div>
  );
}
