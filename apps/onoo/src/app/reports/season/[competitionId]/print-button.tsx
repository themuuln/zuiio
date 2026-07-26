"use client";

import { FileDown } from "lucide-react";
import { Button } from "@/components/ui";

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <FileDown className="size-4" />
      Хэвлэх / PDF
    </Button>
  );
}
