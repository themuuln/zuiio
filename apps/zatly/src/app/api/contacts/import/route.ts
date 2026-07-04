import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { importCsvQuerySchema } from "@/lib/validations";
import { getSupabaseRestContext } from "@/lib/supabaseAdmin";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const context = getSupabaseRestContext();
  if (!context) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const text = await file.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV must have a header row and at least one data row." },
      { status: 400 },
    );
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).filter((l) => l.trim()).map((line) => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim();
    });
    return row;
  });

  const errors: string[] = [];
  const contactRows: Record<string, unknown>[] = [];

  for (const row of rows) {
    const firstName = row.first_name || "";
    const lastName = row.last_name || "";

    if (!firstName && !lastName) {
      errors.push(`Row ${contactRows.length + 1}: missing first_name and last_name`);
      continue;
    }

    contactRows.push({
      first_name: firstName,
      last_name: lastName,
      full_name: row.full_name || `${firstName} ${lastName}`.trim(),
      gender: row.gender || "unknown",
      language: row.language || null,
      psid: row.psid || null,
      tags: row.tags ? row.tags.split(";").filter(Boolean) : null,
    });
  }

  if (contactRows.length === 0) {
    return NextResponse.json({ imported: 0, failed: errors.length, errors }, { status: 400 });
  }

  const url = new URL(`${context.baseUrl}/contacts`);
  url.searchParams.set("on_conflict", "psid");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      ...context.headers,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(contactRows),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    errors.push(text);
    return NextResponse.json({ imported: 0, failed: contactRows.length, errors }, { status: 500 });
  }

  return NextResponse.json({
    imported: contactRows.length,
    failed: errors.length,
    errors,
  });
}
