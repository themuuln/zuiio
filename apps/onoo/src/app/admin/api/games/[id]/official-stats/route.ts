import * as Sentry from "@sentry/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import {
  fibaTextItemsToLines,
  parseFibaOfficialStats,
  type FibaTextItem,
  type Json,
} from "@onoo/core";
import { extractTextItems, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: gameId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const rightsConfirmed = formData.get("rightsConfirmed") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF файл оруулна уу" }, { status: 400 });
  }
  if (
    file.type !== "application/pdf" &&
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    return NextResponse.json(
      { error: "Зөвхөн PDF файл хүлээн авна" },
      { status: 400 },
    );
  }
  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json(
      { error: "PDF файл 10MB-аас хэтрэх ёсгүй" },
      { status: 400 },
    );
  }
  if (!rightsConfirmed) {
    return NextResponse.json(
      { error: "Эх сурвалжийн эрхээ баталгаажуулна уу" },
      { status: 400 },
    );
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
    const { items } = await extractTextItems(pdf);
    const boxScore = parseFibaOfficialStats(
      items.flatMap((page) => fibaTextItemsToLines(page as FibaTextItem[])),
    );
    const evidencePath = `${gameId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("evidence")
      .upload(evidencePath, file, {
        cacheControl: "31536000",
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      Sentry.captureException(uploadError, { extra: { gameId } });
      return NextResponse.json(
        { error: "Нотлох PDF хадгалж чадсангүй" },
        { status: 500 },
      );
    }

    const normalizedPayload: Json = JSON.parse(JSON.stringify(boxScore));
    const { data: submission, error: submissionError } = await supabase.rpc(
      "cmd_submit_source",
      {
        p_game_id: gameId,
        p_source_type: "official_score_sheet",
        p_evidence_url: evidencePath,
        p_rights_confirmed: true,
        p_normalized_payload: normalizedPayload,
        p_confidence: boxScore.confidence,
        p_idempotency_key: crypto.randomUUID(),
      },
    );

    if (submissionError) {
      await supabase.storage.from("evidence").remove([evidencePath]);
      return NextResponse.json(
        { error: submissionError.message },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        submissionId: submission.id,
        boxScore,
      },
      { status: 201 },
    );
  } catch (error) {
    Sentry.captureException(error, { extra: { gameId } });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `PDF-г FIBA албан ёсны статистик хэлбэрээр уншиж чадсангүй: ${error.message}`
            : "PDF-г FIBA албан ёсны статистик хэлбэрээр уншиж чадсангүй",
      },
      { status: 422 },
    );
  }
}
