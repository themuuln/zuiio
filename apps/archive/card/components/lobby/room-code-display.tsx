"use client";

import { useCallback } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface RoomCodeDisplayProps {
  code: string;
}

export function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Copied!", {
        duration: 2000,
      });
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Copied!", {
        duration: 2000,
      });
    }
  }, [code]);

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-3 transition-opacity hover:opacity-80 focus:outline-none"
        aria-label="Copy room code"
      >
        <span
          className="text-6xl font-bold tracking-[0.15em]"
          style={{ fontSize: "48px" }}
        >
          {code}
        </span>
        <Copy className="h-6 w-6 text-muted-foreground" />
      </button>
    </div>
  );
}
