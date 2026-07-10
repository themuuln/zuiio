"use server";

import type { ActionState } from "@/lib/form-validation";
import {
  flattenFieldErrors,
  normalizeMongolianPhone,
} from "@/lib/form-validation";
import { sendEmail } from "@/lib/services/email-service";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { forgotPasswordSchema } from "@/lib/validation/auth-schemas";
import { reportServerError } from "@/lib/sentry-report-server";

type ForgotPasswordState = ActionState<{ identifier: string }> & {
  success?: boolean;
};

type IdentifierType = "email" | "phone" | "username";

function detectIdentifierType(value: string): IdentifierType {
  if (value.includes("@")) return "email";
  const digits = value.replace(/[\s\-()]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) return "phone";
  return "username";
}

/**
 * Render a minimal HTML email for password reset.
 * Uses inline styles for email client compatibility.
 */
function renderResetPasswordEmailHtml(
  displayName: string,
  actionLink: string,
): string {
  return `<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Нууц үг сэргээх</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Нууц үг сэргээх</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">TOLOM</p>
              <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
                Сайн байна уу, <strong>${displayName}</strong>.<br />
                Таны нууц үг сэргээх хүсэлтийг хүлээн авлаа. Доорх товч дээр дарж шинэ нууц үгээ үүсгэнэ үү.
              </p>
              <a href="${actionLink}" style="display:inline-block;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;color:#ffffff;background-color:#111827;text-decoration:none;">
                Нууц үг сэргээх
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.5;">
                Хэрэв та нууц үг сэргээх хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоорой.<br />
                Холбоос 1 цагийн дараа дуусах болно.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">TOLOM систем</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = {
    identifier: (formData.get("identifier") as string) || "",
  };

  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      values: { identifier: raw.identifier },
      fieldErrors: flattenFieldErrors(parsed.error.issues),
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const serviceRole = await createServiceRoleClient();

  const { identifier } = parsed.data;
  const type = detectIdentifierType(identifier);

  // Try to find the auth email associated with this identifier
  let authEmail: string | null = null;
  let displayName = identifier;

  if (type === "email") {
    // The identifier itself is the email — use it directly
    authEmail = identifier;
  } else {
    // Look up the profile by phone or username
    let lookupColumn: "username" | "phone";
    let lookupValue: string;

    if (type === "phone") {
      lookupColumn = "phone";
      lookupValue = normalizeMongolianPhone(identifier);
    } else {
      lookupColumn = "username";
      lookupValue = identifier.trim().toLowerCase();
    }

    const { data: profile } = await serviceRole
      .from("profiles")
      .select("id")
      .eq(lookupColumn, lookupValue)
      .maybeSingle();

    if (profile) {
      // Use the profile's full_name as display name if available
      const { data: fullProfile } = await serviceRole
        .from("profiles")
        .select("full_name")
        .eq("id", profile.id)
        .maybeSingle();

      if (fullProfile?.full_name) {
        displayName = fullProfile.full_name;
      }

      const { data: authUser } = await serviceRole.auth.admin.getUserById(
        profile.id,
      );
      if (authUser?.user?.email) {
        authEmail = authUser.user.email;
      }
    }
  }

  if (authEmail) {
    try {
      // Generate the recovery link via Supabase Admin API
      const { data: linkData } = await serviceRole.auth.admin.generateLink({
        type: "recovery",
        email: authEmail,
        options: {
          redirectTo: `${siteUrl}/auth/reset-password`,
        },
      });

      if (linkData?.properties?.action_link) {
        // Send via the configured SMTP (Gmail, SendGrid, etc.)
        await sendEmail({
          to: authEmail,
          subject: "Нууц үг сэргээх хүсэлт",
          html: renderResetPasswordEmailHtml(
            displayName,
            linkData.properties.action_link,
          ),
        });
      }
    } catch {
      reportServerError("Unexpected error");
      // Silent catch — never reveal whether the identifier exists
    }
  }

  // Always return success — don't reveal whether the identifier exists
  return { success: true };
}
