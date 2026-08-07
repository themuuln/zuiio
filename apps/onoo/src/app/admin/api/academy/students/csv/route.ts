/**
 * GET  /admin/api/academy/students/csv — export students as CSV
 * POST /admin/api/academy/students/csv — import students from CSV
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

function escapeCsv(val: string | null | undefined): string {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(values: (string | null | undefined)[]): string {
  return `${values.map(escapeCsv).join(",")}\n`;
}

export async function GET() {
  return withAuth(async (supabase) => {
    const { data, error } = await supabase
      .from("academy_students")
      .select("*, academy_profiles(name)")
      .order("canonical_name", { ascending: true });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

    let csv = csvRow([
      "id",
      "academy_name",
      "canonical_name",
      "name_latin",
      "date_of_birth",
      "school_name",
      "grade_level",
      "medical_notes",
      "allergies",
      "emergency_contact_name",
      "emergency_contact_phone",
      "status",
      "notes",
    ]);

    for (const s of data) {
      csv += csvRow([
        s.id,
        s.academy_profiles?.name ?? "",
        s.canonical_name,
        s.name_latin,
        s.date_of_birth,
        s.school_name,
        s.grade_level,
        s.medical_notes,
        s.allergies
          ? Array.isArray(s.allergies)
            ? s.allergies.join("; ")
            : String(s.allergies)
          : "",
        s.emergency_contact_name,
        s.emergency_contact_phone,
        s.status,
        s.notes,
      ]);
    }

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="academy_students.csv"',
      },
    });
  });
}

export async function POST(request: NextRequest) {
  return withAuth(async (supabase) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { error: "Файл оруулаагүй байна" },
          { status: 400 },
        );
      }

      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);

      if (lines.length < 2) {
        return NextResponse.json(
          { error: "CSV хоосон байна" },
          { status: 400 },
        );
      }

      // Parse header
      const headers = parseCsvLine(lines[0]!);
      const nameIdx = headers.indexOf("canonical_name");
      const latinIdx = headers.indexOf("name_latin");
      const dobIdx = headers.indexOf("date_of_birth");
      const schoolIdx = headers.indexOf("school_name");
      const gradeIdx = headers.indexOf("grade_level");
      const medicalIdx = headers.indexOf("medical_notes");
      const allergyIdx = headers.indexOf("allergies");
      const emergNameIdx = headers.indexOf("emergency_contact_name");
      const emergPhoneIdx = headers.indexOf("emergency_contact_phone");
      const notesIdx = headers.indexOf("notes");

      if (nameIdx === -1) {
        return NextResponse.json(
          { error: "CSV-д 'canonical_name' багана олдсонгүй" },
          { status: 400 },
        );
      }

      // Get the first academy_id
      const { data: profiles } = await supabase
        .from("academy_profiles")
        .select("id")
        .limit(1);

      const academyId = profiles?.[0]?.id;
      if (!academyId) {
        return NextResponse.json(
          {
            error:
              "Академийн профайл олдсонгүй. Эхлээд академийн профайл үүсгэнэ үү.",
          },
          { status: 400 },
        );
      }

      const errors: Array<{ row: number; message: string }> = [];
      let successCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]!);
        const canonicalName = values[nameIdx]?.trim();
        if (!canonicalName) {
          errors.push({ row: i + 1, message: "canonical_name хоосон байна" });
          continue;
        }

        const { error: rpcError } = await supabase.rpc("cmd_create_student", {
          p_academy_id: academyId,
          p_canonical_name: canonicalName,
          p_name_latin: latinIdx >= 0 ? (values[latinIdx] ?? null) : null,
          p_date_of_birth: dobIdx >= 0 ? values[dobIdx] || null : null,
          p_school_name: schoolIdx >= 0 ? values[schoolIdx] || null : null,
          p_grade_level: gradeIdx >= 0 ? values[gradeIdx] || null : null,
          p_medical_notes: medicalIdx >= 0 ? values[medicalIdx] || null : null,
          p_allergies: allergyIdx >= 0 ? values[allergyIdx] || null : null,
          p_emergency_contact_name:
            emergNameIdx >= 0 ? values[emergNameIdx] || null : null,
          p_emergency_contact_phone:
            emergPhoneIdx >= 0 ? values[emergPhoneIdx] || null : null,
          p_notes: notesIdx >= 0 ? values[notesIdx] || null : null,
        });

        if (rpcError) {
          errors.push({ row: i + 1, message: rpcError.message });
        } else {
          successCount++;
        }
      }

      return NextResponse.json({
        success_count: successCount,
        errors,
      }) as never;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "CSV боловсруулахад алдаа гарлаа";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}
