"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeInlineProps {
  /** The URL or text to encode in the QR code. */
  value: string;
  /** Size in pixels (default 200). */
  size?: number;
}

/**
 * Renders an inline QR code as an SVG using qrcode.react.
 * Client component — the user's device renders the SVG.
 */
export function QrCodeInline({ value, size = 200 }: QrCodeInlineProps) {
  return (
    <div className="inline-flex rounded-lg border bg-white p-3">
      <QRCodeSVG value={value} size={size} level="M" includeMargin />
    </div>
  );
}
