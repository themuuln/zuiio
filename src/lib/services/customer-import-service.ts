import { revalidateTag } from "next/cache";
import { cacheTags } from "@/lib/cache/keys";
import { ValidationError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

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

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseCsv(
  content: string,
): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split("\n");
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => parseCsvLine(line));

  return { headers, rows };
}

function mapRow(headers: string[], values: string[]): ParsedRow {
  const row: ParsedRow = {};
  for (let i = 0; i < headers.length && i < values.length; i++) {
    const header = headers[i].trim();
    const value = values[i].trim();

    if (!value) continue;

    switch (header) {
      case "firstName":
      case "first_name":
        row.firstName = value;
        break;
      case "lastName":
      case "last_name":
        row.lastName = value;
        break;
      case "phone":
        row.phone = value;
        break;
      case "email":
        row.email = value;
        break;
      case "address":
        row.address = value;
        break;
      case "notes":
        row.notes = value;
        break;
      case "type":
        row.type = value;
        break;
      case "source":
        row.source = value;
        break;
    }
  }
  return row;
}

function hasIdentifyingField(row: ParsedRow): boolean {
  return !!(
    row.phone?.trim() ||
    row.email?.trim() ||
    row.firstName?.trim() ||
    row.lastName?.trim()
  );
}

export async function importCustomers(
  orgId: string,
  csvContent: string,
  userId: string,
): Promise<ImportResult> {
  const supabase = await createClient();

  const { headers, rows } = parseCsv(csvContent);

  if (headers.length === 0) {
    throw new ValidationError("CSV file is empty or has no valid headers");
  }

  const hasExpectedHeader = headers.some((h) =>
    EXPECTED_HEADERS.some((expected) => expected === h.trim()),
  );
  if (!hasExpectedHeader) {
    throw new ValidationError(
      "CSV must include at least one of: firstName, lastName, phone, or email columns",
    );
  }

  const errors: { row: number; message: string }[] = [];
  const validRows: ParsedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    const customer = mapRow(headers, rows[i]);
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

  const phonesToCheck = validRows
    .map((r) => r.phone?.trim())
    .filter(Boolean) as string[];

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

  const toInsert: ParsedRow[] = [];
  for (const row of validRows) {
    if (row.phone && existingPhones.has(row.phone)) {
      errors.push({
        row: validRows.indexOf(row) + 2,
        message: `Duplicate phone number: ${row.phone}`,
      });
    } else {
      toInsert.push(row);
    }
  }

  const BATCH_SIZE = 50;
  let imported = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);

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
      for (let j = 0; j < batch.length; j++) {
        const row = dbRows[j];
        const { error: singleError } = await supabase
          .from("customers")
          .insert(row);

        if (singleError) {
          const csvRowNumber = validRows.indexOf(batch[j]) + 2;
          if (
            singleError.code === "23505" ||
            singleError.message?.toLowerCase().includes("duplicate") ||
            singleError.message?.toLowerCase().includes("unique")
          ) {
            errors.push({
              row: csvRowNumber,
              message: `Duplicate phone number: ${row.phone}`,
            });
          } else {
            errors.push({
              row: csvRowNumber,
              message: singleError.message,
            });
          }
        } else {
          imported++;
        }
      }
    } else {
      imported += data?.length ?? 0;
    }
  }

  revalidateTag(cacheTags.customers(orgId), "max");

  return { imported, errors };
}
