import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { verifyBatch } from "@/lib/api";
import type { VerifyBatchResult, VerifyBatchResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sparkles,
  Award,
  MessageCircle,
  Send,
  Globe,
  ExternalLink,
  Search,
  Hash,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

type NotFoundResult = Extract<VerifyBatchResult, { reason: "not_found" }>;

const isNotFoundResult = (
  result: VerifyBatchResult | undefined | null,
): result is NotFoundResult =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Boolean(result && (result as any).reason === "not_found");

const isVerifiedResponse = (
  result: VerifyBatchResult | undefined | null,
): result is VerifyBatchResponse =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Boolean(result && (result as any).success === true);

export default function BatchVerify() {
  const params = useParams<{ tokenId?: string; serialNumber?: string }>();
  const navigate = useNavigate();
  const [tokenId, setTokenId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [question, setQuestion] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [qaResponse, setQaResponse] = useState<any>(null);
  const [qaLoading, setQaLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const { toast } = useToast();

  // Determine if we should show results or form
  const showResults = params.tokenId && params.serialNumber;

  // Auto-verify if URL params are present
  useEffect(() => {
    if (params.tokenId && params.serialNumber) {
      mutation.mutate({
        tokenId: params.tokenId,
        serialNumber: params.serialNumber,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.tokenId, params.serialNumber]);

  const mutation = useMutation<
    VerifyBatchResult,
    Error,
    { tokenId: string; serialNumber: string }
  >({
    mutationFn: ({ tokenId, serialNumber }) =>
      verifyBatch(tokenId, serialNumber),
    onSuccess: (result) => {
      if (isNotFoundResult(result)) {
        toast({
          title: "Lot not found",
          description: "This batch is not yet listed in AgroDex.",
        });
        return;
      }

      toast({
        title: "Batch verified",
        description: "Authenticity confirmed and record loaded.",
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Verification Error";
      toast({
        title: "Verification Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const verificationResult = mutation.data;
  const isNotFound = isNotFoundResult(verificationResult);
  const verifiedResult = isVerifiedResponse(verificationResult)
    ? verificationResult
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to results page instead of showing results inline
    navigate(`/verify/${tokenId}/${serialNumber}`);
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !verifiedResult?.hcsMessages?.length) return;

    setQaLoading(true);
    setQaResponse(null);

    try {
      const response = await axios.post("/api/ai/buyer-qa", {
        question,
        hcsTimeline: verifiedResult.hcsMessages,
      });

      setQaResponse(response.data.data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Question unavailable",
        description: error.response?.data?.error || error.message,
        variant: "destructive",
      });
    } finally {
      setQaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-background dark:to-indigo-950/20 dark:bg-background text-foreground">
      <Helmet>
        <title>Verify Batch | AgroDex</title>
      </Helmet>
      <Navbar />
      <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block p-3 bg-blue-100 dark:bg-blue-950/50 rounded-2xl mb-2">
            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Verify Batch Authenticity
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Validate product provenance and trace complete supply chain history
          </p>
        </div>

        {/* Illustration */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://assets-gen.codenut.dev/images/1761555183_d10ca27c.png"
            alt="Batch Verification"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Verification Form - Only show if no URL params */}
        {!showResults && (
          <Card className="shadow-xl border-0 bg-card text-card-foreground dark:border dark:border-slate-800">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl flex items-center gap-2 text-gray-900 dark:text-white">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                Verify Certificate
              </CardTitle>
              <CardDescription className="text-base text-slate-500 dark:text-slate-400">
                Enter NFT credentials to validate batch authenticity and view
                complete provenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="tokenId"
                      className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Token ID
                    </Label>
                    <Input
                      id="tokenId"
                      placeholder="0.0.123456"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      className="h-11 font-mono border-gray-300 dark:border-slate-800 dark:bg-slate-900 text-foreground focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="serialNumber"
                      className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Serial Number
                    </Label>
                    <Input
                      id="serialNumber"
                      placeholder="1"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="h-11 font-mono border-gray-300 dark:border-slate-800 dark:bg-slate-900 text-foreground focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying on Hedera...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-2 h-5 w-5" />
                      Verify Authenticity
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Verification Results - Only show if URL params present */}
        {showResults && (
          <Card className="shadow-xl border-0 bg-card text-card-foreground dark:border dark:border-slate-800">
            <CardContent className="pt-6">
              {mutation.isPending && (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 dark:text-blue-400 mb-4" />
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Loading Verification Data...
                  </h2>
                  <p className="text-gray-600 dark:text-slate-300 mt-2">
                    Contacting Hedera Mirror Node and AI...
                  </p>
                </div>
              )}

              {mutation.isSuccess && verificationResult && (
                <div className="mt-6 space-y-6">
                  {/* Handle batch not found (404 business logic) */}
                  {isNotFound ? (
                    <Alert className="border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 shadow-md">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <AlertDescription className="text-amber-900 dark:text-amber-300">
                        <div className="space-y-2">
                          <span className="text-lg font-bold block">
                            Lot not found / not registered
                          </span>
                          <p className="text-sm">
                            No batch matches this Token ID and Serial Number in
                            AgroDex at the moment.
                          </p>
                          <div className="bg-white/50 dark:bg-slate-900/50 p-3 rounded border border-amber-200 dark:border-slate-800 mt-3">
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                              Token ID : {params.tokenId}
                            </p>
                            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                              Serial Number : {params.serialNumber}
                            </p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : verifiedResult ? (
                    <Alert className="border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 shadow-md">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <AlertDescription className="text-emerald-900 dark:text-emerald-300">
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold">
                            Lot verified
                          </span>
                          {verifiedResult.cached && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-semibold"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Result a cache
                            </Badge>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-blue-200 bg-blue-50 shadow-md">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        Verification data unavailable. Please try again.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Only show details if batch was found */}
                  {verifiedResult && (
                    <Card className="border-blue-200 dark:border-blue-950/30 bg-card text-card-foreground shadow-lg">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                          Verification Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                              Token ID
                            </p>
                            <p className="font-mono font-bold text-gray-900 dark:text-white">
                              {verifiedResult.tokenId}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                              Serial Number
                            </p>
                            <p className="font-mono font-bold text-gray-900 dark:text-white">
                              {verifiedResult.serialNumber}
                            </p>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                              Status
                            </p>
                            <Badge className="bg-emerald-600 text-white font-semibold">
                              {verifiedResult.status}
                            </Badge>
                          </div>
                          <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800">
                            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Verified on
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {new Date(
                                verifiedResult.verifiedAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                          <p className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            HCS Transaction Trail
                          </p>
                          <div className="space-y-2">
                            {verifiedResult.hcsTransactionIds.length === 0 && (
                              <p className="text-sm text-gray-600 dark:text-slate-400">
                                No HCS transactions found for this batch.
                              </p>
                            )}
                            {verifiedResult.hcsTransactionIds.map(
                              (txId: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={`https://hashscan.io/testnet/transaction/${txId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono flex items-center gap-1 hover:underline"
                                >
                                  {txId} <ExternalLink className="h-3 w-3" />
                                </a>
                              ),
                            )}
                          </div>
                        </div>

                        {verifiedResult.ai_summary && (
                          <div className="border-t border-gray-200 dark:border-slate-800 pt-4 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                  AI Provenance Summary
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-gray-500" />
                                <Button
                                  size="sm"
                                  variant={
                                    language === "en" ? "default" : "outline"
                                  }
                                  className={
                                    language === "en" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-300 dark:border-slate-800 text-gray-700 dark:text-slate-300"
                                  }
                                  onClick={() => setLanguage("en")}
                                >
                                  English
                                </Button>
                              </div>
                            </div>

                            {verifiedResult.ai_summary.trustScore !== null &&
                              verifiedResult.ai_summary.trustScore !==
                                undefined && (
                                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-950/20 dark:to-blue-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30 shadow-sm">
                                  <Award className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                                  <div className="flex-1">
                                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                      Trust Score:{" "}
                                      {verifiedResult.ai_summary.trustScore}/100
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-slate-300 mt-1">
                                      {
                                        verifiedResult.ai_summary
                                          .trustExplanation
                                      }
                                    </div>
                                  </div>
                                </div>
                              )}

                            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-950 p-5 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                              <p className="text-base text-gray-800 dark:text-slate-350 leading-relaxed">
                                {language === "en"
                                  ? verifiedResult.ai_summary.summary_en
                                  : verifiedResult.ai_summary.summary_fr}
                              </p>
                            </div>

                            {verifiedResult.ai_summary.timeline &&
                              verifiedResult.ai_summary.timeline.length > 0 && (
                                <div>
                                  <p className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    Supply Chain Timeline
                                  </p>
                                  <div className="space-y-3 relative before:absolute before:left-4 before:top-8 before:bottom-8 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-950">
                                    {verifiedResult.ai_summary.timeline.map(
                                      (item, idx: number) => (
                                        <div
                                          key={idx}
                                          className="flex items-start gap-4 relative"
                                        >
                                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">
                                            {idx + 1}
                                          </div>
                                          <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-lg border border-gray-200 dark:border-slate-800 shadow-sm">
                                            <div className="font-bold text-gray-900 dark:text-white">
                                              {item.event}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              {new Date(
                                                item.timestamp,
                                              ).toLocaleString()}
                                            </div>
                                            <a
                                              href={`https://hashscan.io/testnet/transaction/${item.txId}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-mono flex items-center gap-1 mt-2 hover:underline"
                                            >
                                              {item.txId}{" "}
                                              <ExternalLink className="h-3 w-3" />
                                            </a>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        )}

                        {verifiedResult.hcsMessages &&
                          verifiedResult.hcsMessages.length > 0 && (
                            <div className="border-t border-gray-200 dark:border-slate-800 pt-4">
                              <div className="flex items-center gap-2 mb-4">
                                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                  Ask About This Product
                                </p>
                              </div>

                              <div className="space-y-4">
                                <div className="flex gap-2">
                                  <Textarea
                                    placeholder="Ask a question about this product's provenance... (e.g., 'When was this harvested?', 'What certifications does it have?')"
                                    value={question}
                                    onChange={(e) =>
                                      setQuestion(e.target.value)
                                    }
                                    rows={3}
                                    className="flex-1 border-gray-300 dark:border-slate-800 dark:bg-slate-900 text-foreground focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <Button
                                    onClick={handleAskQuestion}
                                    disabled={qaLoading || !question.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 h-auto px-4"
                                  >
                                    {qaLoading ? (
                                      <Loader2 className="h-5 w-5 animate-spin" />
                                    ) : (
                                      <Send className="h-5 w-5" />
                                    )}
                                  </Button>
                                </div>

                                {qaResponse && (
                                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-5 rounded-lg border border-blue-200 dark:border-blue-900/30 shadow-sm space-y-3">
                                    <p className="text-base text-gray-900 dark:text-white font-medium leading-relaxed">
                                      {qaResponse.answer}
                                    </p>
                                    {qaResponse.evidenceTxIds &&
                                      qaResponse.evidenceTxIds.length > 0 && (
                                        <div className="pt-3 border-t border-blue-200 dark:border-blue-900/20">
                                          <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">
                                            Evidence:
                                          </p>
                                          <div className="flex flex-wrap gap-2">
                                            {qaResponse.evidenceTxIds.map(
                                              (txId: string, idx: number) => (
                                                <a
                                                  key={idx}
                                                  href={`https://hashscan.io/testnet/transaction/${txId}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-350 px-2 py-1 rounded border border-blue-300 dark:border-blue-900/30 hover:bg-blue-105 hover:dark:bg-slate-800 flex items-center gap-1"
                                                >
                                                  {txId.substring(0, 20)}...{" "}
                                                  <ExternalLink className="h-3 w-3" />
                                                </a>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    {qaResponse.ms && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400">
                                        Answered in {qaResponse.ms}ms
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                        {verifiedResult.nftMetadata && (
                          <details className="border-t border-gray-200 dark:border-slate-800 pt-4">
                            <summary className="font-semibold mb-2 cursor-pointer text-gray-900 dark:text-white">
                              NFT Metadata
                            </summary>
                            <pre className="bg-gray-50 dark:bg-slate-900 p-3 rounded border border-gray-200 dark:border-slate-800 text-xs overflow-auto max-h-48 text-foreground">
                              {JSON.stringify(
                                verifiedResult.nftMetadata,
                                null,
                                2,
                              )}
                            </pre>
                          </details>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {mutation.isError && (
                <Alert className="mt-6 border-red-200 bg-red-50 dark:bg-red-950/20 shadow-md">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="text-red-900 dark:text-red-300 font-semibold">
                    {" "}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}{" "}
                    {(mutation.error as any)?.response?.data?.details ||
                      mutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
}
