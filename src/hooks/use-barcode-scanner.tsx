"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";

const CameraScanner = dynamic(
  () => import("@/components/shop/camera-scanner").then((m) => m.CameraScanner),
  { ssr: false },
);

type ScanResult = { found: true } | { found: false; error?: string };

type UseBarcodeScannerOptions = {
  onScan: (barcode: string) => ScanResult;
};

/**
 * Reusable hook for barcode camera scanning.
 *
 * Manages the camera scanner open/close state and provides the
 * dynamically-imported CameraScanner component ready to render.
 *
 * ```tsx
 * const scanner = useBarcodeScanner({
 *   onScan: (barcode) => {
 *     setValue("barcode", barcode);
 *     return { found: true };
 *   },
 * });
 *
 * return (
 *   <>
 *     <button onClick={scanner.open}>Scan</button>
 *     {scanner.isOpen && <scanner.ScannerComponent onClose={scanner.close} />}
 *   </>
 * );
 * ```
 */
export function useBarcodeScanner(options: UseBarcodeScannerOptions) {
  const { onScan } = options;
  const [isOpen, setIsOpen] = useState(false);
  const lastBarcodeRef = useRef<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const handleScan = useCallback(
    (barcode: string): ScanResult => {
      if (!barcode || barcode === lastBarcodeRef.current) {
        return { found: false };
      }
      lastBarcodeRef.current = barcode;
      return onScan(barcode);
    },
    [onScan],
  );

  const ScannerComponent = useCallback(
    ({ onClose }: { onClose: () => void }) => (
      <CameraScanner onScan={handleScan} onClose={onClose} />
    ),
    [handleScan],
  );

  return {
    isOpen,
    open,
    close,
    /** The CameraScanner component wired to your onScan handler. Render it when isOpen is true. */
    ScannerComponent,
  };
}
