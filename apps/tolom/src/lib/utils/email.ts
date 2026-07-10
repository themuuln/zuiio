/**
 * React Email rendering utilities.
 *
 * Usage:
 *   import { renderEmail } from "@/lib/utils/email";
 *   import WelcomeEmail from "@/emails/welcome";
 *   const html = await renderEmail(<WelcomeEmail name="Temuulen" />);
 *   await resend.emails.send({ from, to, subject, html });
 */

import type { ReactElement } from "react";
import { render } from "react-email";

/**
 * Render a React Email component to HTML string.
 * Ready to pass to Resend's `html` field.
 *
 * @example
 * const html = await renderEmail(<InvoiceEmail invoice={invoice} />);
 * await resend.emails.send({ from, to, subject: "Invoice", html });
 */
export async function renderEmail(element: ReactElement): Promise<string> {
  return render(element);
}

/**
 * Render a React Email component to plain text.
 * Useful as a fallback for email clients that don't support HTML.
 */
export async function renderEmailText(element: ReactElement): Promise<string> {
  return render(element, { plainText: true });
}
