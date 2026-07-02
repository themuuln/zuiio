"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useCallback, useEffect, useRef, useState } from "react";

export interface UseQrScannerResult {
  startScanning: (
    elementId: string,
    onResult: (decodedText: string) => void,
  ) => Promise<void>;
  stopScanning: () => void;
  isScanning: boolean;
  error: string | null;
}

export function useQrScanner(): UseQrScannerResult {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanning = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {
        // Ignore stop errors — camera may already be released
      });
      scannerRef.current = null;
    }
    setIsScanning(false);
    setError(null);
  }, []);

  const startScanning = useCallback(
    async (elementId: string, onResult: (decodedText: string) => void) => {
      // Clean up any existing scanner before starting a new one
      stopScanning();

      setError(null);

      try {
        const scanner = new Html5Qrcode(elementId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onResult(decodedText);
          },
          () => {
            // Ignore non-decodable frames
          },
        );

        setIsScanning(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to start camera";
        setError(message);
        setIsScanning(false);
      }
    },
    [stopScanning],
  );

  // Cleanup on unmount — always release the camera
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return {
    startScanning,
    stopScanning,
    isScanning,
    error,
  };
}
