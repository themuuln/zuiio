import { render } from "react-email";
import { EMAIL_FROM, resend } from "./client";
import { ConfirmEmail } from "./templates/confirm";
import { WelcomeEmail } from "./templates/welcome";

/**
 * Send a welcome email after successful signup.
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string,
  loginUrl: string,
) {
  const html = await render(WelcomeEmail({ userName, loginUrl }));

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Welcome to TOLOM",
    html,
  });
}

/**
 * Send an email confirmation link.
 */
export async function sendConfirmEmail(
  to: string,
  userName: string,
  confirmationUrl: string,
) {
  const html = await render(ConfirmEmail({ userName, confirmationUrl }));

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Confirm your email — TOLOM",
    html,
  });
}
