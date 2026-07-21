"use client";

import { QRCodeSVG } from "qrcode.react";

interface QrCodeProps {
  code: string;
  size?: number;
}

export function QrCode({ code, size = 200 }: QrCodeProps) {
  const joinUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${code}`;

  return (
    <div className="flex items-center justify-center rounded-xl bg-white p-4 shadow-sm">
      <QRCodeSVG
        value={joinUrl}
        size={size}
        level="M"
        fgColor="#000000"
        bgColor="#ffffff"
      />
    </div>
  );
}
