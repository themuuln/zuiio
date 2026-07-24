"use client";

import { FilePdf, Printer } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function PublicDocumentActions({
  pdfUrl,
  printLabel = "Хэвлэх",
  pdfLabel = "PDF татаж авах",
}: {
  pdfUrl?: string;
  printLabel?: string;
  pdfLabel?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.print()}
        className="min-h-11 min-w-11 gap-2"
        aria-label={printLabel}
      >
        <Printer className="size-4" />
        {printLabel}
      </Button>
      {pdfUrl && (
        <Button
          variant="outline"
          size="sm"
          asChild
          className="min-h-11 min-w-11 gap-2"
        >
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={pdfLabel}
          >
            <FilePdf className="size-4" />
            {pdfLabel}
          </a>
        </Button>
      )}
    </div>
  );
}
