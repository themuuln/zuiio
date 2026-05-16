import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/errors";
import { finalizeSignup } from "@/lib/services/signup-service";

export async function POST() {
  try {
    const supabase = await createClient();
    const result = await finalizeSignup(supabase);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("Failed to finalize signup:", err);
    return handleApiError(err);
  }
}
