import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateTag } from "next/cache";
import pMap from "p-map";
import Papa from "papaparse";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";

export interface ImportResult {
  imported: number;
  errors: { row: number; message: string }[];
}

interface ParsedRow {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  type?: string;
  source?: string;
}

const EXPECTED_HEADERS = [
  "firstName",
  "first_name",
  "lastName",
  "last_name",
  "phone",
  "email",
  "address",
  "notes",
  "type",
  "source",
] as const;

function hasIdentifyingField(row: ParsedRow): boolean {
  return !!(
    row.phone?.trim() ||
    row.email?.trim() ||
    row.firstName?.trim() ||
    row.lastName?.trim()
  );
}

export async function importCustomers(
  db: SupabaseClient,
  orgId: string,
  csvContent: string,
  userId: string,
): Promise<ImportResult> {
  const supabase = db;

  // Use papaparse for robust CSV parsing
  const parsed = Papa.parse(csvContent, {
    skipEmptyLines: true,
    header: true,
    transformHeader: (h: string) => h.trim(),
    transform: (value: string) => value.trim(),
  });

  if (parsed.errors.length > 0) {
    const csvError = parsed.errors[0];
    throw new ValidationError(
      `CSV parse error at row ${csvError.row}: ${csvError.message}`,
    );
  }

  const rawRows = parsed.data as Record<string, string>[];
  if (rawRows.length === 0) {
    throw new ValidationError("CSV file is empty or has no valid headers");
  }

  const headers = parsed.meta.fields ?? [];
  const hasExpectedHeader = headers.some((h) =>
    EXPECTED_HEADERS.some((expected) => expected === h),
  );
  if (!hasExpectedHeader) {
    throw new ValidationError(
      "CSV must include at least one of: firstName, lastName, phone, or email columns",
    );
  }

  const errors: { row: number; message: string }[] = [];
  const validRows: ParsedRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const customer: ParsedRow = {
      firstName: rawRows[i].firstName ?? rawRows[i].first_name ?? undefined,
      lastName: rawRows[i].lastName ?? rawRows[i].last_name ?? undefined,
      phone: rawRows[i].phone ?? undefined,
      email: rawRows[i].email ?? undefined,
      address: rawRows[i].address ?? undefined,
      notes: rawRows[i].notes ?? undefined,
      type: rawRows[i].type ?? undefined,
      source: rawRows[i].source ?? undefined,
    };
    const rowNumber = i + 2;

    if (!hasIdentifyingField(customer)) {
      errors.push({
        row: rowNumber,
        message:
          "Missing identifying fields — each row needs at least firstName, lastName, phone, or email",
      });
      continue;
    }

    validRows.push(customer);
  }

  if (validRows.length === 0) {
    return { imported: 0, errors };
  }

  const phonesToCheck = validRows.flatMap((r) => {
    const phone = r.phone?.trim();
    return phone ? [phone] : [];
  }) as string[];

  const existingPhones = new Set<string>();

  if (phonesToCheck.length > 0) {
    const { data: existing } = await supabase
      .from("customers")
      .select("phone")
      .eq("organization_id", orgId)
      .in("phone", phonesToCheck)
      .is("deleted_at", null);

    if (existing) {
      for (const row of existing) {
        if (row.phone) existingPhones.add(row.phone);
      }
    }
  }

  // Use a Map keyed by phone+email to track CSV row numbers
  const validRowIndex = new Map<ParsedRow, number>(
    validRows.map((r, idx) => [r, idx]),
  );
  const toInsert: ParsedRow[] = [];
  for (const row of validRows) {
    if (row.phone && existingPhones.has(row.phone)) {
      errors.push({
        row: (validRowIndex.get(row) ?? 0) + 2,
        message: `Duplicate phone number: ${row.phone}`,
      });
    } else {
      toInsert.push(row);
    }
  }

  const BATCH_SIZE = 50;
  let imported = 0;

  // Use p-map for concurrent batch processing
  const batches: ParsedRow[][] = [];
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    batches.push(toInsert.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await pMap(
    batches,
    async (batch) => {
      const dbRows = batch.map((row) => ({
        organization_id: orgId,
        type: row.type === "company" ? "company" : "individual",
        first_name: row.firstName?.trim() || null,
        last_name: row.lastName?.trim() || null,
        phone: row.phone?.trim() || null,
        email: row.email?.trim() || null,
        address: row.address?.trim() || null,
        notes: row.notes?.trim() || null,
        source: row.source?.trim() || null,
        created_by: userId,
        updated_by: userId,
      }));

      const { data, error } = await supabase
        .from("customers")
        .insert(dbRows)
        .select("id");

      if (error) {
        // Batch insert failed — fall back to individual inserts
        const results = await pMap(
          dbRows,
          async (row) => {
            const { error: singleError } = await supabase
              .from("customers")
              .insert(row);
            return { row, error: singleError };
          },
          { concurrency: 10 },
        );

        let batchImported = 0;
        const batchErrors: typeof errors = [];
        for (const { row, error: singleError } of results) {
          if (singleError) {
            const csvRowNumber =
              (validRowIndex.get(batch[dbRows.indexOf(row)]) ?? 0) + 2;
            if (
              singleError.code === "23505" ||
              singleError.message?.toLowerCase().includes("duplicate") ||
              singleError.message?.toLowerCase().includes("unique")
            ) {
              batchErrors.push({
                row: csvRowNumber,
                message: `Duplicate phone number: ${row.phone}`,
              });
            } else {
              batchErrors.push({
                row: csvRowNumber,
                message: singleError.message,
              });
            }
          } else {
            batchImported++;
          }
        }
        return { imported: batchImported, errors: batchErrors };
      } else {
        return { imported: data?.length ?? 0, errors: [] as typeof errors };
      }
    },
    { concurrency: 5 },
  );

  for (const br of batchResults) {
    imported += br.imported;
    errors.push(...br.errors);
  }

  revalidateTag(cacheTags.customers(orgId), "max");

  return { imported, errors };
}
