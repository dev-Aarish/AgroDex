import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Lightbulb, Sprout, Leaf, TreePine, ShieldCheck } from "lucide-react";
import { useVerificationAssistant } from "@/context/VerificationAssistantContext";

const conceptIcons: Record<string, typeof Lightbulb> = {
  "Hedera": ShieldCheck,
  "HCS": TreePine,
  "NFT": Leaf,
  "consensus": Sprout,
  "default": Lightbulb,
};

const educationalConcepts: Record<string, { en: string; id: string }> = {
  "Hedera": {
    en: "Hedera is a public distributed ledger technology — think of it as a digital notary that timestamps and permanently records events. Once data is written, it cannot be altered.",
    id: "Hedera adalah buku besar digital publik — anggap saja sebagai notaris digital yang memberi stempel waktu dan merekam peristiwa secara permanen. Setelah data ditulis, tidak dapat diubah.",
  },
  "HCS": {
    en: "Hedera Consensus Service (HCS) is a tool for ordering and timestamping messages. AgroDex uses it to create an immutable log of every batch event.",
    id: "Hedera Consensus Service (HCS) adalah alat untuk mengurutkan dan memberi stempel waktu pada pesan. AgroDex menggunakannya untuk membuat catatan permanen dari setiap peristiwa batch.",
  },
  "NFT": {
    en: "A Non-Fungible Token (NFT) is a unique digital certificate stored on the blockchain. Each AgroDex NFT represents one specific batch with its own verifiable history.",
    id: "Non-Fungible Token (NFT) adalah sertifikat digital unik yang disimpan di blockchain. Setiap NFT AgroDex mewakili satu batch tertentu dengan riwayatnya yang dapat diverifikasi.",
  },
  "blockchain": {
    en: "A blockchain is a chain of digital records (blocks) linked together. No single person controls it, and once data is added, it can't be erased or changed.",
    id: "Blockchain adalah rantai catatan digital (blok) yang terhubung. Tidak ada satu orang pun yang mengendalikannya, dan setelah data ditambahkan, data tidak dapat dihapus atau diubah.",
  },
  "consensus": {
    en: "Consensus is the process where network participants agree on the validity of transactions before they are permanently recorded.",
    id: "Konsensus adalah proses di mana peserta jaringan menyetujui validitas transaksi sebelum dicatat secara permanen.",
  },
  "trustScore": {
    en: "The trust score is an AI-generated rating (0–100) based on data consistency, supplier history, certification validity, and blockchain anchor integrity.",
    id: "Skor kepercayaan adalah peringkat yang dihasilkan AI (0–100) berdasarkan konsistensi data, riwayat pemasok, validitas sertifikasi, dan integritas jangkar blockchain.",
  },
  "HCSMessage": {
    en: "An HCS message is a record submitted to the Hedera network. Each message is timestamped, ordered, and permanently stored on the ledger.",
    id: "Pesan HCS adalah catatan yang dikirimkan ke jaringan Hedera. Setiap pesan diberi stempel waktu, diurutkan, dan disimpan secara permanen di buku besar.",
  },
  "tokenId": {
    en: "A Token ID is the unique address of an NFT on the Hedera network. It looks like 0.0.123456 and acts like a digital serial number for the certificate.",
    id: "Token ID adalah alamat unik NFT di jaringan Hedera. Bentuknya seperti 0.0.123456 dan berfungsi seperti nomor seri digital untuk sertifikat.",
  },
};

interface EducationalTooltipProps {
  term: string;
  children: React.ReactNode;
}

export function EducationalTooltip({ term, children }: EducationalTooltipProps) {
  const { state } = useVerificationAssistant();
  const concept = educationalConcepts[term];
  const Icon = conceptIcons[term] || conceptIcons.default;

  if (!concept) return <>{children}</>;

  const explanation = state.assistantLanguage === "id" ? concept.id : concept.en;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-amber-400/50 hover:border-amber-500 transition-colors">
          {children}
          <Icon className="h-3 w-3 text-amber-500 shrink-0" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="top"
        className="w-72 p-4 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-slate-900 border-amber-200 dark:border-amber-800/50 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">
              {state.assistantLanguage === "id" ? "Tahukah Anda?" : "Did you know?"}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
