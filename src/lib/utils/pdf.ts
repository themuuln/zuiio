/**
 * PDF generation utilities using @react-pdf/renderer.
 *
 * Usage:
 *   import { renderInvoicePdf } from "@/lib/utils/pdf";
 *   const buffer = await renderInvoicePdf(invoiceData);
 *   // buffer is a NodeBuffer — send as attachment or save to storage
 */

import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Render a React component to a PDF buffer.
 * Use this with your invoice/work-order PDF components.
 *
 * @example
 * const pdfBuffer = await renderToPdfBuffer(
 *   <InvoiceDocument invoice={invoice} items={items} />
 * );
 */
export async function renderToPdfBuffer(
  element: ReactElement<DocumentProps>,
): Promise<Buffer> {
  const buffer = await renderToBuffer(element);
  return buffer as Buffer;
}

/**
 * Generate a filename with timestamp for PDF exports.
 * @example "invoice-TOL-20260529-143022.pdf"
 */
export function pdfFilename(prefix: string, extension: string = "pdf"): string {
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, "").slice(0, 14);
  return `${prefix}-${ts}.${extension}`;
}
