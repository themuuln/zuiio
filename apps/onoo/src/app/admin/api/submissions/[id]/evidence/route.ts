import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: submission, error: submissionError } = await supabase
    .from("source_submissions")
    .select("evidence_url")
    .eq("id", id)
    .single();

  if (submissionError || !submission?.evidence_url) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from("evidence")
    .createSignedUrl(submission.evidence_url, 60);

  if (signedUrlError || !data?.signedUrl) {
    return NextResponse.json({ error: "Evidence is unavailable" }, { status: 500 });
  }

  return NextResponse.redirect(data.signedUrl);
}
