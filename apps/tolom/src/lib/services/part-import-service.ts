import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import Papa from "papaparse";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

interface ParsedRow {
  name?: string;
  name_mn?: string;
  part_number?: string;
  barcode?: string;
  category?: string;
  description?: string;
  unit?: string;
  default_price?: string;
  purchase_price?: string;
  location?: string;
}

const EXPECTED_HEADERS = [
  "name",
  "name_mn",
  "part_number",
  "barcode",
  "category",
  "description",
  "unit",
  "default_price",
  "purchase_price",
  "location",
] as const;

function hasRequiredField(row: ParsedRow): boolean {
  return !!(row.name?.trim() || row.name_mn?.trim());
}

export async function importParts(
  db: SupabaseClient,
  orgId: string,
  csvContent: string,
  userId: string,
): Promise<ImportResult> {
  const supabase = db;

  const parsed = Papa.parse(csvContent, {
    skipEmptyLines: true,
    header: true,
    transformHeader: (h: string) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    transform: (value: string) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    const csvError = parsed.errors[0];
    throw new ValidationError(
      `CSV parsing error at row ${csvError.row}: ${csvError.message}`,
    );
  }

  const rows = parsed.data as ParsedRow[];
  const results: ImportResult = { imported: 0, errors: [] };

  // Batch insert in chunks of 50
  const CHUNK_SIZE = 50;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const validRows: ParsedRow[] = [];

    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const rowNum = i + j + 1; // 1-indexed

      if (!hasRequiredField(row)) {
        results.errors.push({
          row: rowNum,
          message: "Missing required field: name or name_mn",
        });
        continue;
      }

      validRows.push(row);
    }

    if (validRows.length === 0) continue;

    const inserts = validRows.map((row) => ({
      organization_id: orgId,
      name: row.name?.trim() || row.name_mn?.trim() || "",
      name_mn: row.name_mn?.trim() || null,
      part_number: row.part_number?.trim() || null,
      barcode: row.barcode?.trim() || null,
      category: row.category?.trim() || null,
      description: row.description?.trim() || null,
      unit: row.unit?.trim() || "piece",
      default_price: row.default_price
        ? Number(row.default_price.replace(/[^0-9.-]/g, ""))
        : null,
      purchase_price: row.purchase_price
        ? Number(row.purchase_price.replace(/[^0-9.-]/g, ""))
        : null,
      location: row.location?.trim() || null,
      is_active: true,
      created_by: userId,
    }));

    const { error, data } = await supabase
      .from("parts_catalog")
      .insert(inserts)
      .select("id");

    if (error) {
      // If batch fails, try one-by-one to identify which rows failed
      for (let k = 0; k < inserts.length; k++) {
        const rowNum = i + k + 1;
        const { error: singleError } = await supabase
          .from("parts_catalog")
          .insert(inserts[k])
          .select("id")
          .single();

        if (singleError) {
          results.errors.push({
            row: rowNum,
            message: singleError.message,
          });
        } else {
          results.imported++;
        }
      }
    } else {
      results.imported += data?.length ?? inserts.length;
    }
  }

  revalidateTag(cacheTags.partsCatalog(orgId));

  return results;
}
