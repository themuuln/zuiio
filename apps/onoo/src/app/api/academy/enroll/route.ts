/**
 * POST /api/academy/enroll — Public academy enrollment
 * Uses service_role to create guardian + student + enrollment atomically.
 */
import { createClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const enrollSchema = z.object({
  academyId: z.string().uuid().optional(),
  programId: z.string().uuid(),
  studentName: z
    .string()
    .trim()
    .min(2, "Нэр хэт богино байна")
    .max(200, "Нэр хэт урт байна"),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().trim().max(200).optional().or(z.literal("")),
  guardianPhone: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Утасны дугаар 8 оронтой байх ёстой")
    .optional()
    .or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = enrollSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstError?.message ?? "Мэдээлэл буруу байна" },
        { status: 400 },
      );
    }

    const {
      academyId: providedAcademyId,
      programId,
      studentName,
      dateOfBirth,
      guardianName,
      guardianPhone,
      notes,
    } = parsed.data;

    // Use untyped service-role client since academy tables aren't in generated types yet
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // If no academyId provided, look up the first academy profile
    let academyId = providedAcademyId;
    if (!academyId) {
      const { data: profile } = await supabase
        .from("academy_profiles")
        .select("id")
        .limit(1)
        .single();
      if (!profile) {
        return NextResponse.json(
          { error: "Академийн мэдээлэл олдсонгүй" },
          { status: 404 },
        );
      }
      // Narrow the profile type since Supabase returns untyped with raw client
      const profileId =
        profile && typeof profile === "object" && "id" in profile
          ? String(profile.id)
          : null;
      if (!profileId) {
        return NextResponse.json(
          { error: "Академийн ID олдсонгүй" },
          { status: 500 },
        );
      }
      academyId = profileId;
    }

    const { data, error } = await supabase.rpc("cmd_public_enroll", {
      p_academy_id: academyId,
      p_program_id: programId,
      p_student_name: studentName,
      p_date_of_birth: dateOfBirth || null,
      p_guardian_name: guardianName || null,
      p_guardian_phone: guardianPhone || null,
      p_notes: notes || null,
    });

    if (error) {
      const errorMsg =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";
      if (errorMsg.includes("program_not_found")) {
        return NextResponse.json(
          { error: "Хөтөлбөр олдсонгүй" },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "Бүртгэл амжилтгүй боллоо. Дахин оролдоно уу." },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Серверийн алдаа" },
      { status: 500 },
    );
  }
}
