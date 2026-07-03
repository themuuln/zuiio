import nodemailer from "nodemailer";
import { createServiceClient } from "@/lib/supabase/server-service";
import type { Database } from "@/lib/supabase/types";

type SmtpConfig = Database["public"]["Tables"]["smtp_configs"]["Row"];

const GMAIL_DAILY_LIMIT = 500;

/**
 * Picks the best available SMTP config: active config with the lowest
 * daily_count for today. Resets counts if last_reset_date is not today.
 */
async function pickSmtpConfig(): Promise<SmtpConfig | null> {
  const supabase = createServiceClient();

  // Reset daily counts for configs whose last_reset_date is not today
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("smtp_configs")
    .update({ daily_count: 0, last_reset_date: today })
    .neq("last_reset_date", today)
    .eq("is_active", true);

  // Fetch the active config with the lowest daily_count
  const { data } = await supabase
    .from("smtp_configs")
    .select("*")
    .eq("is_active", true)
    .lt("daily_count", GMAIL_DAILY_LIMIT)
    .order("daily_count", { ascending: true })
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

/**
 * Increments the daily_count for a given SMTP config after a successful send.
 */
async function incrementSmtpCount(configId: string) {
  const supabase = createServiceClient();
  await supabase.rpc("increment_smtp_count", { config_id: configId });
}

/**
 * Sends an email using the next available SMTP config (cycling through
 * multiple Gmail accounts to stay within daily limits).
 *
 * Returns `true` on success, `false` if no config is available or send fails.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const config = await pickSmtpConfig();
  if (!config) {
    console.warn("sendEmail: no available SMTP config (all at daily limit)");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.username,
      pass: config.password,
    },
  });

  try {
    await transporter.sendMail({
      from: config.from_name
        ? `"${config.from_name}" <${config.from_email}>`
        : config.from_email,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    await incrementSmtpCount(config.id);
    return true;
  } catch (error) {
    console.error(
      "sendEmail: failed to send email via",
      config.username,
      error,
    );
    return false;
  }
}
