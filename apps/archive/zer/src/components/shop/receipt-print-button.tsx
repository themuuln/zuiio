"use client";

import { Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function ReceiptPrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={() => window.print()}
    >
      <Printer className="size-4" />
      Хэвлэх
    </Button>
  );
}
