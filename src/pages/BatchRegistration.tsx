import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { registerBatch, verifyRegistration } from "@/lib/api";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Tag,
  AlertTriangle,
  Package,
  MapPin,
  Calendar,
  Hash,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit2,
  FileText,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Helmet } from "react-helmet-async";

export default function BatchRegistration() {
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [origin, setOrigin] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [harvestBatch, setHarvestBatch] = useState("");
  const [metadata, setMetadata] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: registerBatch,
    onSuccess: (data) => {
      toast({
        title: "Batch Registered Successfully",
        description: `HCS Transaction ID: ${data.hcsTransactionId}`,
      });
      if (data.batchId) {
        localStorage.setItem("last_registered_batch_id", data.batchId);
      }
      // Reset form
      setProductName("");
      setQuantity("");
      setUnit("");
      setOrigin("");
      setHarvestDate("");
      setHarvestBatch("");
      setMetadata("");
      setVerificationResult(null);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error("Registration error:", error);

      // Extract detailed error message
      let errorMessage = "Unknown error occurred";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleVerifyAndShowModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
    setIsAiLoading(true);
    setAiError(null);
    setVerificationResult(null);
    
    try {
      await runAiVerification();
    } catch (err: unknown) {
      const error = err as Error;
      setAiError(error.message || "An unexpected error occurred during AI verification.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const runAiVerification = async () => {
    setAiError(null);
    setIsAiLoading(true);
    try {
      const res = await verifyRegistration({
        productName,
        harvestBatch,
        quantity,
        unit,
        location: origin,
        harvestDate,
        metadata
      });
      if (res.ok && res.data) {
        setVerificationResult(res.data);
      } else {
        throw new Error(res.data?.error || "Failed to analyze crop details");
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error("AI verify error:", error);
      setAiError(error.message || "Gemini verification service is temporarily unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleConfirmRegistration = () => {
    setIsModalOpen(false);
    mutation.mutate({
      productType: productName,
      quantity: quantity,
      location: origin,
      imageData: "", // Empty image for now to bypass the bug
      harvestDate: harvestDate, // Will be normalized to YYYY-MM-DD in api.ts
      aiVerification: verificationResult // Save audit trail
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/20 dark:via-background dark:to-blue-950/20 dark:bg-background text-foreground">
      <Helmet>
        <title>Register Batch | AgroDex</title>
      </Helmet>
      <Navbar />
      <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-block p-3 bg-emerald-100 dark:bg-emerald-950/50 rounded-2xl mb-2">
            <Package className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
            Register New Batch
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 max-w-2xl mx-auto">
            Record a new proof for your batch. This data will be permanently
            saved on the Hedera Consensus Service (HCS).
          </p>
        </div>

        {/* Illustration */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src="https://assets-gen.codenut.dev/images/1761554969_b00aaa62.png"
            alt="Batch Registration"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Registration Form */}
        <Card className="shadow-xl border-0 bg-card text-card-foreground dark:border dark:border-slate-800">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl">Batch Information</CardTitle>
            <CardDescription className="text-base text-slate-500 dark:text-slate-400">
              All data will be permanently recorded on Hedera Consensus Service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyAndShowModal} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="productName"
                  className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Product Name
                </Label>
                <Input
                  id="productName"
                  placeholder="e.g., Organic Arabica Coffee"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="harvestBatch"
                  className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Harvest Batch Identifier
                </Label>
                <Input
                  id="harvestBatch"
                  placeholder="e.g., Batch #150 or HB-2026-150"
                  value={harvestBatch}
                  onChange={(e) => setHarvestBatch(e.target.value)}
                  className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="quantity"
                    className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <Hash className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="unit"
                    className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <Package className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Unit
                  </Label>
                  <Input
                    id="unit"
                    placeholder="kg, bags, tons"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="origin"
                  className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Origin Location
                </Label>
                <Input
                  id="origin"
                  placeholder="e.g., Kigali Region, Rwanda"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="harvestDate"
                  className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Harvest Date
                </Label>
                <Input
                  id="harvestDate"
                  type="date"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  className="h-11 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="metadata"
                  className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Additional Product Metadata
                </Label>
                <Textarea
                  id="metadata"
                  placeholder="e.g., Certified Fair Trade, Moisture content 12%, Shade-grown, etc."
                  value={metadata}
                  onChange={(e) => setMetadata(e.target.value)}
                  className="min-h-20 border-gray-300 dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 focus:ring-emerald-500 text-foreground"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Recording on Hedera Blockchain...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Verify and Register Batch
                  </>
                )}
              </Button>
            </form>

            {mutation.isSuccess && (
              <Alert className="mt-6 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/20 shadow-md">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <AlertDescription className="text-emerald-900 dark:text-emerald-300">
                  <div className="space-y-4">
                    <p className="text-lg font-bold">
                      Batch Registered Successfully!
                    </p>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-emerald-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-400">
                          Transaction ID:
                        </span>
                        <div className="flex items-center space-x-2">
                          <a
                            href={`https://hashscan.io/testnet/transaction/${mutation.data.hcsTransactionId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 dark:text-emerald-400 font-mono text-sm underline hover:text-emerald-900"
                            title="View on HashScan"
                          >
                            {mutation.data.hcsTransactionId.substring(0, 10)}...
                            {mutation.data.hcsTransactionId.substring(
                              mutation.data.hcsTransactionId.length - 5,
                            )}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                mutation.data.hcsTransactionId,
                              );
                              setIsCopied(true);
                              setTimeout(() => setIsCopied(false), 2000);
                            }}
                            className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 bg-gray-200 dark:bg-slate-850 rounded hover:bg-gray-300 dark:hover:bg-slate-800 transition-colors"
                          >
                            {isCopied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-400 min-w-[140px]">
                          Batch ID:
                        </span>
                        <span className="text-sm text-gray-900 dark:text-slate-200 font-mono">
                          {mutation.data.batchId}
                        </span>
                      </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="flex flex-col items-center p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-lg space-y-3">
                      <div className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                        Indonesia AgroDex Batch QR Code
                      </div>
                      <QRCodeCanvas
                        id="registration-qr-canvas"
                        value={JSON.stringify({
                          batchId: mutation.data.batchId,
                          verificationUrl: `${window.location.origin}/verify/${mutation.data.batchId}`
                        })}
                        size={160}
                        level="H"
                        includeMargin={true}
                        className="border border-gray-150 dark:border-slate-800 rounded shadow-sm"
                      />
                      <div className="text-[11px] text-gray-500 font-mono select-all text-center max-w-xs break-all">
                        {window.location.origin}/verify/{mutation.data.batchId}
                      </div>
                      <div className="flex gap-2 w-full max-w-xs justify-center pt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const canvas = document.getElementById("registration-qr-canvas") as HTMLCanvasElement;
                            if (canvas) {
                              const url = canvas.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.download = `agrodex-batch-${mutation.data.batchId}.png`;
                              link.href = url;
                              link.click();
                            }
                          }}
                          className="flex-1 text-xs border-emerald-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 font-semibold"
                        >
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const verifyUrl = `${window.location.origin}/verify/${mutation.data.batchId}`;
                            navigator.clipboard.writeText(verifyUrl);
                            toast({ title: "Verification URL copied!" });
                          }}
                          className="flex-1 text-xs border-emerald-250 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 font-semibold"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </div>


                    <div className="mt-4 pt-4 border-t border-emerald-300 dark:border-emerald-900/30">
                      <p className="text-sm text-emerald-800 dark:text-emerald-400">
                        Your proof is saved. Copy the Transaction ID and proceed
                        to the next step to create your certificate.
                      </p>
                      <button
                        onClick={() => navigate("/tokenize")}
                        className="mt-3 w-full px-4 py-2 font-bold text-white bg-emerald-700 rounded-lg shadow hover:bg-emerald-800 transition-colors"
                      >
                        Next Step: Tokenize
                      </button>
                    </div>

                    {mutation.data.ai_analysis && (
                      <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                          <Sparkles className="h-5 w-5" />
                          <span>AI Verification Report</span>
                          {mutation.data.ai_analysis.ms && (
                            <span className="text-xs text-gray-500 dark:text-slate-400 font-normal">
                              ({mutation.data.ai_analysis.ms}ms)
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 dark:text-slate-300">
                          {mutation.data.ai_analysis.caption}
                        </p>

                        {mutation.data.ai_analysis.tags &&
                          mutation.data.ai_analysis.tags.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Tag className="h-4 w-4 text-gray-500 dark:text-slate-400" />
                              {mutation.data.ai_analysis.tags.map(
                                (tag: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ),
                              )}
                            </div>
                          )}

                        {mutation.data.ai_analysis.anomalies &&
                          mutation.data.ai_analysis.anomalies.length > 0 && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/10 rounded border border-yellow-200 dark:border-yellow-900/30">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                              <div className="text-xs text-yellow-850 dark:text-yellow-450">
                                <p className="font-semibold">
                                  Detected Issues:
                                </p>
                                <ul className="list-disc list-inside">
                                  {mutation.data.ai_analysis.anomalies.map(
                                    (anomaly: string, idx: number) => (
                                      <li key={idx}>{anomaly}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                        {mutation.data.ai_analysis.confidence !== undefined && (
                          <div className="text-xs text-gray-600 dark:text-slate-400">
                            Confidence:{" "}
                            {(
                              mutation.data.ai_analysis.confidence * 100
                            ).toFixed(0)}
                            %
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {mutation.isError && (
              <Alert className="mt-6 border-red-200 bg-red-50 shadow-md">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-900 font-semibold">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(mutation.error as any)?.response?.data?.details ||
                    mutation.error.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-card text-card-foreground border dark:border-slate-800 shadow-2xl rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="pb-4 border-b dark:border-slate-850">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              Pre-Registration AI Verification
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
              Verify your batch metadata using Gemini 3.1 Flash Lite before saving to blockchain
            </DialogDescription>
          </DialogHeader>

          {isAiLoading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent" />
                <Sparkles className="absolute h-6 w-6 text-emerald-500 animate-bounce" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-bold text-gray-800 dark:text-slate-200">Analyzing crop metadata...</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Running verification & checks with Gemini 3.1 Flash Lite</p>
              </div>
            </div>
          )}

          {aiError && (
            <div className="py-6 space-y-6">
              <Alert variant="destructive" className="border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20">
                <ShieldAlert className="h-5 w-5 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-900 dark:text-red-300 font-medium">
                  {aiError}
                </AlertDescription>
              </Alert>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Information
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={runAiVerification}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Verification
                </Button>
              </div>
            </div>
          )}

          {!isAiLoading && !aiError && verificationResult && (
            <div className="space-y-6 pt-4">
              {/* Fallback Warning Alert */}
              {verificationResult.fallback && (
                <Alert className="border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-350 font-bold text-sm">
                    {verificationResult.warningMessage || "AI verification unavailable. Manual review recommended."}
                  </AlertDescription>
                </Alert>
              )}

              {/* Product Summary */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 shadow-sm space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">Product Summary</h4>
                <p className="text-base text-gray-800 dark:text-slate-100 font-medium">
                  {verificationResult.productSummary}
                </p>
              </div>

              {/* Submitted Metadata Review */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Batch Details Review</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Product Name</span>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{productName}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Harvest Batch</span>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{harvestBatch}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Quantity</span>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{quantity} {unit}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Location</span>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{origin}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Harvest Date</span>
                    <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{harvestDate}</p>
                  </div>
                  {metadata && (
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <span className="text-slate-500 font-medium">Additional Metadata</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{metadata}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cooperative Readiness */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Cooperative Readiness</h4>
                    <Badge className={
                      verificationResult.cooperativeReadiness?.status === "Ready"
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/55 dark:text-emerald-300 font-bold"
                        : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/55 dark:text-amber-300 font-bold"
                    }>
                      {verificationResult.cooperativeReadiness?.status || "Pending"}
                    </Badge>
                  </div>
                  <ul className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
                    {verificationResult.cooperativeReadiness?.notes?.map((note: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Verification Summary */}
                <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">AI Checks Status</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-500">Quantity</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-250 truncate">{verificationResult.verificationSummary?.quantity}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500">Harvest Batch</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-250 truncate">{verificationResult.verificationSummary?.harvestBatch}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500">Location</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-250 truncate">{verificationResult.verificationSummary?.location}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-slate-500">Harvest Date</span>
                      <p className="font-semibold text-gray-800 dark:text-slate-250 truncate">{verificationResult.verificationSummary?.harvestDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 space-y-3">
                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">Harvest Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Batch Number</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-205">{verificationResult.statistics?.batchNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Quantity</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-205">{verificationResult.statistics?.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Location</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-205">{verificationResult.statistics?.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Harvest Date</span>
                      <p className="text-xs font-bold text-gray-800 dark:text-slate-205">{verificationResult.statistics?.harvestDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-900/30 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Missing Information Warnings
                  </h4>
                  <ul className="list-disc list-inside text-xs text-amber-700 dark:text-amber-300 pl-1 space-y-0.5">
                    {verificationResult.warnings.map((w: string, idx: number) => <li key={idx}>{w}</li>)}
                  </ul>
                </div>
              )}

              {/* Consistency Checks */}
              {verificationResult.consistencyChecks && verificationResult.consistencyChecks.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-red-800 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Consistency Warning Detected
                  </h4>
                  <ul className="list-disc list-inside text-xs text-red-700 dark:text-red-300 pl-1 space-y-0.5">
                    {verificationResult.consistencyChecks.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex gap-4 pt-4 border-t dark:border-slate-850">
                <Button type="button" variant="outline" className="flex-1 h-12 text-sm font-semibold" onClick={() => setIsModalOpen(false)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Information
                </Button>
                <Button type="button" className="flex-1 h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all" onClick={handleConfirmRegistration}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm & Register
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}
