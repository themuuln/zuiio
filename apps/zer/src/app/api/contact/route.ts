import { capture } from "@zuiio/capture";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const subject = formData.get("subject") as string | null;
    const message = formData.get("message") as string | null;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Бүх талбарыг бөглөнө үү." },
        { status: 400 },
      );
    }

    capture("[contact] form submission", {
      context: `name=${name}, email=${email}, subject=${subject}`,
    });

    // In production, send email notification via SMTP or external service.
    // For now, acknowledge receipt.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Системийн алдаа. Дахин оролдоно уу." },
      { status: 500 },
    );
  }
}
