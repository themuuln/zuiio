import { NextResponse } from "next/server";
import { withAuth } from "@/lib/supabase/admin-route";

interface AcademyReference {
  programs: unknown[];
  trainers: unknown[];
  locations: unknown[];
  students: unknown[];
  profile: unknown[];
}

export const GET = () =>
  withAuth<AcademyReference>(async (supabase) => {
    const [programs, trainers, locations, students, profile] =
      await Promise.all([
        supabase
          .from("academy_programs")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("academy_trainers")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("academy_locations")
          .select("*")
          .order("name", { ascending: true }),
        supabase
          .from("academy_students")
          .select("*, academy_profiles(name)")
          .order("created_at", { ascending: false }),
        supabase.from("academy_profiles").select("*").limit(1),
      ]);

    if (programs.error)
      return NextResponse.json(
        { error: programs.error.message },
        { status: 500 },
      ) as never;
    if (trainers.error)
      return NextResponse.json(
        { error: trainers.error.message },
        { status: 500 },
      ) as never;
    if (locations.error)
      return NextResponse.json(
        { error: locations.error.message },
        { status: 500 },
      ) as never;
    if (students.error)
      return NextResponse.json(
        { error: students.error.message },
        { status: 500 },
      ) as never;
    if (profile.error)
      return NextResponse.json(
        { error: profile.error.message },
        { status: 500 },
      ) as never;

    return NextResponse.json({
      programs: (programs.data ?? []) as unknown as unknown[],
      trainers: (trainers.data ?? []) as unknown as unknown[],
      locations: (locations.data ?? []) as unknown as unknown[],
      students: (students.data ?? []) as unknown as unknown[],
      profile: (profile.data ?? []) as unknown as unknown[],
    });
  });
