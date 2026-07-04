import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { requireAuth } from "@/lib/apiAuth";
import { sendEmailSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const parsed = sendEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { to, subject, text, html } = parsed.data;

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.NOTIFY_EMAIL || process.env.SMTP_USER,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
