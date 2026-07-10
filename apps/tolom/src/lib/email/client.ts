import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY environment variable");
}

export const resend = new Resend(resendApiKey);

/** Default sender address — must be from a verified domain in Resend. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "TOLOM <noreply@zuiiotech.com>";
