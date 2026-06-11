import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export function QrScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
  onScanError,
}: QrScannerModalProps) {
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const containerId = "qr-reader-element";

  const stopScanner = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping QR scanner:", err);
      } finally {
        html5QrcodeRef.current = null;
      }
    }
  }, []);

  const startScanner = useCallback(async () => {
    try {
      if (html5QrcodeRef.current) {
        await stopScanner();
      }

      const html5Qrcode = new Html5Qrcode(containerId);
      html5QrcodeRef.current = html5Qrcode;

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setScannerError("No cameras found on this device.");
        setIsInitializing(false);
        setHasCameraPermission(false);
        return;
      }

      setHasCameraPermission(true);

      const backCamera = devices.find((device) =>
        device.label.toLowerCase().includes("back") ||
        device.label.toLowerCase().includes("rear") ||
        device.label.toLowerCase().includes("environment")
      );
      
      const cameraId = backCamera ? backCamera.id : devices[0].id;

      await html5Qrcode.start(
        cameraId,
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          stopScanner().then(() => {
            onScanSuccess(decodedText);
          });
        },
        (errorMessage) => {
          if (onScanError && !errorMessage.includes("NotFoundException")) {
            onScanError(errorMessage);
          }
        }
      );

      setIsInitializing(false);
    } catch (err: unknown) {
      console.error("Error starting QR scanner:", err);
      let errMsg = "Failed to start camera.";
      if (err instanceof Error) {
        if (err.message.includes("NotAllowedError") || err.name === "NotAllowedError") {
          errMsg = "Camera permission was denied. Please grant permission in your browser settings.";
          setHasCameraPermission(false);
        } else {
          errMsg = err.message;
        }
      }
      setScannerError(errMsg);
      setIsInitializing(false);
    }
  }, [onScanSuccess, onScanError, stopScanner]);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    setIsInitializing(true);
    setScannerError(null);
    setHasCameraPermission(null);

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border dark:border-slate-800 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 font-bold text-gray-900 dark:text-white">
            <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Scan QR Code
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400">
            Center the batch QR code within the scanning frame
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative w-full aspect-square max-w-[280px] bg-slate-900 dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <div id={containerId} className="w-full h-full" />

            {isInitializing && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2 z-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="text-sm font-semibold">Initializing camera...</span>
              </div>
            )}

            {scannerError && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center text-white p-6 text-center space-y-4 z-20">
                <AlertCircle className="h-10 w-10 text-red-500" />
                <div className="text-sm font-medium leading-relaxed">{scannerError}</div>
                <Button
                  size="sm"
                  onClick={startScanner}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            )}
          </div>

          {hasCameraPermission === false && (
            <Alert className="mt-4 border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                AgroDex needs camera permission to scan QR codes. Please check your browser's site permissions.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
