import { motion } from "framer-motion";
import {
  Lightbulb,
  Camera,
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useVerificationAssistant } from "@/context/VerificationAssistantContext";

export interface Recommendation {
  id: string;
  icon: typeof Lightbulb;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  priority: "high" | "medium" | "low";
}

const priorityStyles = {
  high: {
    border: "border-emerald-200 dark:border-emerald-900/30",
    bg: "bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-900",
    badge: "bg-emerald-600",
    badgeText: "Recommended",
    badgeTextId: "Direkomendasikan",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  medium: {
    border: "border-blue-200 dark:border-blue-900/30",
    bg: "bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900",
    badge: "bg-blue-600",
    badgeText: "Suggestion",
    badgeTextId: "Saran",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  low: {
    border: "border-slate-200 dark:border-slate-800",
    bg: "bg-card",
    badge: "bg-slate-500",
    badgeText: "Tip",
    badgeTextId: "Tip",
    iconClass: "text-slate-500 dark:text-slate-400",
  },
};

export function generateRecommendations(
  verified: boolean,
  trustScore: number | null | undefined,
  status: string,
  hasHcsMessages: boolean,
  assistantLanguage: "en" | "id",
): Recommendation[] {
  const recommended: Recommendation[] = [];

  // Always show Scan QR — accessible regardless of verification state
  recommended.push({
    id: "scan-qr",
    icon: Camera,
    title: assistantLanguage === "id" ? "Pindai Kode QR" : "Scan QR Code",
    description:
      assistantLanguage === "id"
        ? "Gunakan kamera ponsel Anda untuk memindai kode QR pada kemasan produk. Ini akan langsung membuka halaman verifikasi."
        : "Use your phone camera to scan the QR code on the product packaging. This will open the verification page instantly.",
    priority: "high",
    action: {
      label: assistantLanguage === "id" ? "Buka Pemindai" : "Open Scanner",
    },
  });

  if (status === "verified" || status === "registered") {
    recommended.push({
      id: "export-pdf",
      icon: FileText,
      title: assistantLanguage === "id" ? "Unduh Sertifikat" : "Download Certificate",
      description:
        assistantLanguage === "id"
          ? "Simpan hasil verifikasi sebagai PDF yang dapat dibagikan kepada pembeli atau otoritas regulasi."
          : "Save the verification result as a PDF that can be shared with buyers or regulatory authorities.",
      priority: "high",
      action: {
        label: assistantLanguage === "id" ? "Unduh PDF" : "Download PDF",
      },
    });
  }

  // Share proof — show when batch is verified/registered (always available once loaded)
  if (verified && (status === "verified" || status === "registered")) {
    recommended.push({
      id: "share-report",
      icon: Download,
      title: assistantLanguage === "id" ? "Bagikan Bukti" : "Share Proof",
      description:
        assistantLanguage === "id"
          ? "Bagikan laporan verifikasi ini dengan mitra rantai pasok Anda melalui tautan."
          : "Share this verification report with your supply chain partners via a link.",
      priority: "medium",
      action: {
        label: assistantLanguage === "id" ? "Bagikan" : "Share",
      },
    });
  }

  if (trustScore !== null && trustScore !== undefined && trustScore < 60) {
    recommended.push({
      id: "review-alert",
      icon: ShieldCheck,
      title: assistantLanguage === "id" ? "Periksa Peringatan" : "Review Alert",
      description:
        assistantLanguage === "id"
          ? "Skor kepercayaan rendah terdeteksi. Hubungi pemasok untuk verifikasi dokumen tambahan sebelum melanjutkan transaksi."
          : "Low trust score detected. Contact the supplier for additional document verification before proceeding with the transaction.",
      priority: "high",
    });
  }

  if (hasHcsMessages) {
    recommended.push({
      id: "learn-more",
      icon: ExternalLink,
      title: assistantLanguage === "id" ? "Jelajahi Rantai Pasok" : "Explore Supply Chain",
      description:
        assistantLanguage === "id"
          ? "Lihat peta interaktif dan timeline lengkap perjalanan batch ini dari petani ke konsumen."
          : "View the interactive map and full timeline of this batch's journey from farm to consumer.",
      priority: "low",
      action: {
        label: assistantLanguage === "id" ? "Lihat Perjalanan" : "View Journey",
      },
    });
  }

  return recommended;
}

interface ContextualRecommendationsProps {
  recommendations: Recommendation[];
}

export function ContextualRecommendations({ recommendations }: ContextualRecommendationsProps) {
  const { state } = useVerificationAssistant();

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      {recommendations.map((rec, idx) => {
        const styles = priorityStyles[rec.priority];
        const Icon = rec.icon;

        return (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            className={`rounded-xl border ${styles.border} ${styles.bg} p-4 shadow-sm`}
          >
            <div className="flex items-start gap-3">
              <div className={`shrink-0 mt-0.5 ${styles.iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm text-foreground">{rec.title}</p>
                  <Badge className={`${styles.badge} text-white text-[10px] px-1.5 py-0 h-4`}>
                    {state.assistantLanguage === "id" ? styles.badgeTextId : styles.badgeText}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {rec.description}
                </p>
                {rec.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs font-semibold gap-1 text-primary hover:text-primary/80"
                    onClick={rec.action.onClick}
                  >
                    {rec.action.label}
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
