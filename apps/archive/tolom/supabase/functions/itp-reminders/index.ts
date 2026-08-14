import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Send ITP reminders for vehicles whose inspection expires within this many days
const REMINDER_WINDOW_DAYS = 30;

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DueVehicle {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  itp_expiry_date: string;
  itp_reminder_sent_at: string | null;
  itp_last_passed_date: string | null;
  customer: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  organization: { name: string } | null;
}

// Project pattern: secrets live in public.app_config (see telegram-notify-owners).
async function loadAppConfig(key: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("app_config")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return (data?.value as string | null) ?? null;
  } catch (e) {
    console.error(`Failed to load app_config.${key}:`, e);
    return null;
  }
}

Deno.serve({ timeout: 300000 }, async (req: Request) => {
  // Auth: the pg_cron RPC invokes us with a shared secret (env var or
  // app_config). The endpoint is otherwise unauthenticated (project
  // convention — all cron functions are verify_jwt: false), so the secret
  // is the gate that stops random internet callers from spamming customers.
  const expectedSecret =
    Deno.env.get("ITP_REMINDER_SECRET") ??
    (await loadAppConfig("itp_reminder_secret"));
  const providedSecret = req.headers.get("x-itp-cron-secret") ?? "";
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const windowEnd = new Date(
    today.getTime() + REMINDER_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  const windowEndStr = windowEnd.toISOString().split("T")[0];

  // Find vehicles where:
  // 1. ITP expires within the next REMINDER_WINDOW_DAYS
  // 2. No reminder sent yet, or last reminder predates the current pass
  //    (itp_reminder_sent_at IS NULL OR itp_reminder_sent_at < itp_last_passed_date)
  // 3. Not deleted
  // 4. Have a customer joined (for email delivery)
  //
  // The second condition is a column-vs-column comparison, which PostgREST
  // filters cannot express — fetch the timestamps and filter in JS below
  // (mirrors the app-side getVehiclesNeedingReminder logic).
  const { data: vehicles, error: fetchError } = await supabase
    .from("vehicles")
    .select(
      `
      id,
      plate_number,
      make,
      model,
      itp_expiry_date,
      itp_reminder_sent_at,
      itp_last_passed_date,
      customer:customers!inner(first_name, last_name, email),
      organization:organizations!inner(name)
    `,
    )
    .is("deleted_at", null)
    .not("itp_expiry_date", "is", null)
    .gte("itp_expiry_date", todayStr)
    .lte("itp_expiry_date", windowEndStr)
    .order("itp_expiry_date", { ascending: true })
    .limit(1000);

  if (fetchError) {
    console.error("Failed to fetch ITP vehicles:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dueVehicles = ((vehicles ?? []) as DueVehicle[]).filter((v) => {
    if (!v.itp_reminder_sent_at) return true;
    if (!v.itp_last_passed_date) return false;
    return new Date(v.itp_reminder_sent_at) < new Date(v.itp_last_passed_date);
  });

  if (dueVehicles.length === 0) {
    return new Response(
      JSON.stringify({ checked: 0, sent: 0, skipped: 0, failed: 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Graceful degradation: if no Resend key is configured anywhere, skip
  // delivery (vehicles stay un-stamped and get re-checked on the next run).
  const RESEND_API_KEY =
    Deno.env.get("RESEND_API_KEY") ?? (await loadAppConfig("resend_api_keys"));
  const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "noreply@tolom.app";

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const vehicle of dueVehicles as DueVehicle[]) {
    const customer = vehicle.customer;
    const customerEmail = customer?.email;
    const orgName = vehicle.organization?.name ?? "Your Garage";

    if (!customerEmail) {
      // No delivery channel — close the reminder cycle (mirrors the app-side
      // sendItpReminder, which always stamps) so the daily run doesn't
      // re-process this vehicle forever.
      await supabase
        .from("vehicles")
        .update({ itp_reminder_sent_at: new Date().toISOString() })
        .eq("id", vehicle.id);
      skipped++;
      continue;
    }

    if (!RESEND_API_KEY) {
      skipped++;
      continue;
    }

    const customerName =
      [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") ||
      "Valued Customer";
    const vehicleLabel = [vehicle.plate_number, vehicle.make, vehicle.model]
      .filter(Boolean)
      .join(" ");

    try {
      const html = buildItpReminderEmailHtml({
        customerName,
        vehicleLabel,
        orgName,
        itpExpiryDate: vehicle.itp_expiry_date,
      });

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${orgName} <${EMAIL_FROM}>`,
          to: customerEmail,
          subject: `Сануулга: Машины үзлэгийн хугацаа дуусах гэж байна — ${vehicle.plate_number}`,
          html,
        }),
      });

      if (res.ok) {
        // Stamp the reminder so we don't re-send for this cycle
        await supabase
          .from("vehicles")
          .update({ itp_reminder_sent_at: new Date().toISOString() })
          .eq("id", vehicle.id);
        sent++;
      } else {
        const errBody = await res.text();
        console.error(`Resend API error for vehicle ${vehicle.id}:`, errBody);
        failed++;
      }
    } catch (e) {
      console.error(
        `Failed to send ITP reminder for vehicle ${vehicle.id}:`,
        e,
      );
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ checked: dueVehicles.length, sent, skipped, failed }),
    { headers: { "Content-Type": "application/json" } },
  );
});

function buildItpReminderEmailHtml(params: {
  customerName: string;
  vehicleLabel: string;
  orgName: string;
  itpExpiryDate: string;
}): string {
  const expiryDate = new Date(params.itpExpiryDate).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Машины үзлэгийн сануулга</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Машины үзлэгийн хугацаа ойртлоо</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${params.orgName}</p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;text-align:left;">
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Эрхэм <strong style="color:#111827;">${params.customerName}</strong> танд,</p>
                <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">
                  Таны тээврийн хэрэгслийн техникийн үзлэгийн (ITP) хугацаа дуусах дөхөж байгааг сануулж байна:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Машин</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.vehicleLabel}</td>
                  </tr>
                </table>
              </div>
              <div style="background-color:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#c2410c;">Үзлэгийн хугацаа дуусах огноо</p>
                <p style="margin:0;font-size:22px;font-weight:700;color:#c2410c;">${expiryDate}</p>
              </div>
              <p style="margin:0 0 0;font-size:13px;color:#9ca3af;">
                Машины үзлэгээ хугацаанд нь хийлгэхийг хүсвэл бидэнтэй холбогдоно уу.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">${params.orgName} &middot; TOLOM систем</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
