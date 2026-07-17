import { useCallback } from "react";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

function formatMnt(value: number): string {
  return `${value.toLocaleString("mn-MN")}₮`;
}

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function useExportCsv() {
  const exportCsv = useCallback(
    async (filename: string, headers: string[], rows: (string | number)[][]) => {
      const headerLine = headers.map(csvEscape).join(",");
      const dataLines = rows
        .map((row) => row.map((cell) => csvEscape(String(cell))).join(","))
        .join("\n");
      const csvContent = `\uFEFF${headerLine}\n${dataLines}`;

      const file = new File(Paths.document, `${filename}.csv`);
      file.write(csvContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: `${filename} - Татаж авах`,
        });
      }

      return file.uri;
    },
    [],
  );

  return { exportCsv };
}

export function useExportPdf() {
  const exportPdf = useCallback(
    async (
      filename: string,
      title: string,
      headers: string[],
      rows: (string | number)[][],
    ) => {
      const tableRows = rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td style="padding:6px 12px;border-bottom:1px solid #e5e5e5">${cell}</td>`).join("")}</tr>`,
        )
        .join("");

      const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: -apple-system, sans-serif; padding: 24px; color: #1a1a1a; }
  h1 { font-size: 20px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 12px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #333; font-size: 12px; }
  td { font-size: 12px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">Тамга · ${new Date().toLocaleDateString("mn-MN")}</div>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

      const file = new File(Paths.document, `${filename}.html`);
      file.write(htmlContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/html",
          dialogTitle: `${filename} - Татаж авах`,
        });
      }

      return file.uri;
    },
    [],
  );

  return { exportPdf };
}

export { formatMnt };