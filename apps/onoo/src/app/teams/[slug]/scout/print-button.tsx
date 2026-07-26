"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton() {
  return (
    <>
      <style>{`
        @media print {
          nav, footer, .print\\:hidden { display: none !important; }
          body { font-size: 11pt; color: #000; background: #fff; }
          @page { margin: 1.5cm; }
        }
      `}</style>
      <div className="print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-1" />
          Хэвлэх
        </Button>
      </div>
    </>
  );
}
