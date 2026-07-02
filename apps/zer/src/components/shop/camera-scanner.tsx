"use client";

import { Camera, CheckCircle, X } from "@phosphor-icons/react";
import type { IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ScanResult = { found: true } | { found: false; error?: string };

type CameraScannerProps = {
  onScan: (barcode: string) => ScanResult;
  onClose: () => void;
};

/** Retail barcode formats commonly found on product packaging. */
const RETAIL_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "codabar",
  "qr_code",
] as const;

export function CameraScanner({ onScan, onClose }: CameraScannerProps) {
  const [scanStatus, setScanStatus] = useState<
    | { type: "scanning" }
    | { type: "success" }
    | { type: "error"; message: string }
  >({ type: "scanning" });
  const lastBarcodeRef = useRef<string | null>(null);

  const handleDetect = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (detectedCodes.length === 0) return;
      const code = detectedCodes[0]?.rawValue;
      if (!code || code === lastBarcodeRef.current) return;
      lastBarcodeRef.current = code;

      const result = onScan(code);
      if (result.found) {
        setScanStatus({ type: "success" });
      } else if (result.error) {
        setScanStatus({ type: "error", message: result.error });
        setTimeout(() => {
          lastBarcodeRef.current = null;
          setScanStatus({ type: "scanning" });
        }, 1500);
      } else {
        setScanStatus({
          type: "error",
          message: `"${code}" баркодтой бүтээгдэхүүн олдсонгүй`,
        });
        setTimeout(() => {
          lastBarcodeRef.current = null;
          setScanStatus({ type: "scanning" });
        }, 1500);
      }
    },
    [onScan],
  );

  const handleError = useCallback(() => {
    // handled by the library
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header bar */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
          aria-label="Хаах"
        >
          <X className="size-6" weight="bold" />
        </Button>
        <span className="text-sm font-medium text-white/80">
          Баркод сканнер
        </span>
        <div className="size-10" />
      </div>

      {/* Scanner area */}
      <div className="relative flex-1">
        <Scanner
          onScan={handleDetect}
          onError={handleError}
          formats={[...RETAIL_FORMATS]}
          constraints={{ facingMode: "environment" }}
          sound
          components={{ finder: true, torch: true }}
          styles={{
            container: { width: "100%", height: "100%" },
            video: { objectFit: "cover" },
          }}
        />

        {/* Success overlay */}
        {scanStatus.type === "success" && (
          <div className="absolute inset-0 z-30 flex animate-in fade-in items-center justify-center bg-emerald-500/40 backdrop-blur-sm duration-200">
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-white/20 p-4">
                <CheckCircle className="size-12 text-white" weight="fill" />
              </div>
              <span className="text-lg font-bold text-white drop-shadow-lg">
                Амжилттай
              </span>
            </div>
          </div>
        )}

        {/* Error toast */}
        {scanStatus.type === "error" && (
          <div className="absolute bottom-6 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="rounded-xl bg-red-500/90 px-4 py-3 text-center text-sm font-medium text-white shadow-lg backdrop-blur-sm">
              {scanStatus.message}
            </div>
          </div>
        )}
      </div>

      {/* Bottom hint */}
      {scanStatus.type === "scanning" && (
        <div className="flex items-center justify-center gap-2 px-4 py-4">
          <Camera className="size-4 text-white/60" />
          <span className="text-sm text-white/60">
            Баркодыг кадрт оруулна уу
          </span>
        </div>
      )}
    </div>
  );
}
