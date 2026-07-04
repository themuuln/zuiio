import { NextResponse } from "next/server";
import { capture } from "@zuiio/capture";
import { getActiveSmtpConfig, sendEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

/**
 * Send a test email to the current user using the configured SMTP.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: "Нэвтрээгүй байна." }, { status: 401 });
    }

    const body = await request.json();
    const smtpConfigId = body?.smtpConfigId as string | undefined;

    let smtpConfig:
      | {
          id: string;
          host: string;
          port: number;
          username: string;
          password: string;
          from_email: string;
          from_name: string | null;
        }
      | undefined;
    if (smtpConfigId) {
      const { data, error } = await supabase
        .from("smtp_configs")
        .select("*")
        .eq("id", smtpConfigId)
        .single();
      if (error) capture(error, { context: "[email/test] get smtp config" });

      if (data) {
        smtpConfig = {
          id: data.id,
          host: data.host,
          port: data.port,
          username: data.username,
          password: data.password,
          from_email: data.from_email,
          from_name: data.from_name,
        };
      }
    }

    const result = await sendEmail(supabase, {
      to: user.email,
      subject: "Zer ERP — SMTP тохиргооны тест",
      html: `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table align="center" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="padding:32px 24px;text-align:center;background:linear-gradient(135deg,#2563eb,#1d4ed8);">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Zer ERP</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#1f2937;">SMTP тохиргоо амжилттай!</h2>
        <p style="margin:0 0 12px;font-size:14px;color:#4b5563;line-height:1.6;">
          Таны SMTP тохиргоо зөв ажиллаж байна. Цаашид өдрийн тайлангуудыг
          и-мэйлээр хүлээн авах боломжтой.
        </p>
        <p style="margin:0;font-size:14px;color:#4b5563;line-height:1.6;">
          Баярлалаа,<br />
          <strong>Zer ERP баг</strong>
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Энэхүү и-мэйлийг SMTP тохиргоог шалгах зорилгоор илгээв.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`,
      smtpConfig,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    capture(err, { context: "email test" });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Тодорхойгүй алдаа" },
      { status: 500 },
    );
  }
}
