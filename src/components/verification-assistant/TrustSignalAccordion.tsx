import { motion } from "framer-motion";
import { CheckCircle2, Clock, XCircle, ChevronDown, Info } from "lucide-react";
import { useVerificationAssistant, type TrustSignal } from "@/context/VerificationAssistantContext";
import { useTranslation } from "react-i18next";

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    label: "Verified",
    labelId: "Terverifikasi",
    dotClass: "bg-emerald-500",
    borderClass: "border-emerald-200 dark:border-emerald-900/30",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/20",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    labelId: "Tertunda",
    dotClass: "bg-amber-500",
    borderClass: "border-amber-200 dark:border-amber-900/30",
    bgClass: "bg-amber-50 dark:bg-amber-950/20",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  failed: {
    icon: XCircle,
    label: "Failed",
    labelId: "Gagal",
    dotClass: "bg-red-500",
    borderClass: "border-red-200 dark:border-red-900/30",
    bgClass: "bg-red-50 dark:bg-red-950/20",
    iconClass: "text-red-600 dark:text-red-400",
  },
};

function SignalCard({
  signal,
  isExpanded,
  onToggle,
}: {
  signal: TrustSignal;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = statusConfig[signal.status];
  const Icon = config.icon;
  const { state } = useVerificationAssistant();

  return (
    <motion.div
      layout
      className={`rounded-xl border ${config.borderClass} overflow-hidden transition-colors`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 text-left ${config.bgClass} hover:opacity-90 transition-opacity`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${config.dotClass}`} />
          <Icon className={`h-5 w-5 ${config.iconClass}`} />
          <div>
            <p className="font-semibold text-sm text-foreground">{signal.title}</p>
            <p className="text-xs text-muted-foreground">
              {state.assistantLanguage === "id" ? config.labelId : config.label}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-200 ${
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 border-t border-border space-y-3">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                  {state.assistantLanguage === "id" ? "Apa artinya" : "What this means"}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {signal.plainExplanation}
                </p>
              </div>
            </div>
            <details className="group">
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-1">
                <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                {state.assistantLanguage === "id" ? "Detail teknis" : "Technical detail"}
              </summary>
              <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed font-mono bg-muted/50 p-2 rounded">
                {signal.technicalDetail}
              </p>
            </details>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface TrustSignalAccordionProps {
  signals: TrustSignal[];
}

export function TrustSignalAccordion({ signals }: TrustSignalAccordionProps) {
  const { state, setExpandedSignal } = useVerificationAssistant();
  const { t } = useTranslation();

  if (signals.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Info className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">{t("verify.noSignals", "No verification signals available.")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {signals.map((signal) => (
        <SignalCard
          key={signal.id}
          signal={signal}
          isExpanded={state.expandedSignal === signal.id}
          onToggle={() =>
            setExpandedSignal(
              state.expandedSignal === signal.id ? null : signal.id,
            )
          }
        />
      ))}
    </div>
  );
}
