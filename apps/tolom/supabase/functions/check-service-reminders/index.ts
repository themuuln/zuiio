import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve({ timeout: 300000 }, async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find all active schedules where next_due_date is within the next 7 days
  // and no reminder has been sent in the last 24 hours for that schedule
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { data: schedules, error: fetchError } = await supabase
    .from("vehicle_service_schedules")
    .select(
      `
      id,
      organization_id,
      vehicle_id,
      service_catalog_id,
      service_name,
      next_due_date,
      vehicle:vehicles!inner(
        plate_number,
        customer_id,
        customer:customers!left(email, telegram_chat_id)
      ),
      organization:organizations!inner(
        name,
        settings:organization_settings!left(settings)
      )
    `,
    )
    .is("deleted_at", null)
    .eq("reminder_enabled", true)
    .lte("next_due_date", sevenDaysFromNow.toISOString().split("T")[0])
    .order("next_due_date", { ascending: true })
    .limit(1000);

  if (fetchError) {
    console.error("Failed to fetch service schedules:", fetchError);
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!schedules || schedules.length === 0) {
    return new Response(JSON.stringify({ checked: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check which schedules already have a recent reminder
  const scheduleIds = schedules.map((s) => s.id);
  const twentyFourHoursAgo = new Date(
    today.getTime() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: existingReminders } = await supabase
    .from("reminder_logs")
    .select("vehicle_service_schedule_id")
    .in("vehicle_service_schedule_id", scheduleIds)
    .gte("created_at", twentyFourHoursAgo);

  const alreadyNotified = new Set(
    existingReminders?.map((r) => r.vehicle_service_schedule_id) ?? [],
  );

  const toNotify = schedules.filter((s) => !alreadyNotified.has(s.id));

  if (toNotify.length === 0) {
    return new Response(
      JSON.stringify({ checked: schedules.length, skipped: toNotify.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Create reminder_log entries for each due schedule
  // Also collect delivery data for sending later
  const emailDataMap = new Map<
    string,
    {
      customerEmail: string;
      vehicleLabel: string;
      orgName: string;
    }
  >();
  const telegramDataMap = new Map<
    string,
    {
      chatId: number;
      vehicleLabel: string;
      orgName: string;
    }
  >();

  const reminders = toNotify.map((schedule) => {
    const vehicle = schedule.vehicle as unknown as {
      plate_number: string;
      customer_id: string | null;
      customer: {
        email: string | null;
        telegram_chat_id: number | null;
      } | null;
    };
    const org = schedule.organization as unknown as {
      name: string;
    };

    const customer = vehicle?.customer;
    const hasEmail = !!customer?.email;
    const hasTelegram = !!customer?.telegram_chat_id;
    const orgName = org?.name ?? "Your Garage";

    // Store email data for later sending
    if (hasEmail && customer?.email) {
      emailDataMap.set(schedule.id, {
        customerEmail: customer.email,
        vehicleLabel: `${vehicle.plate_number}`,
        orgName,
      });
    }

    // Store telegram data for later sending
    if (hasTelegram && customer?.telegram_chat_id) {
      telegramDataMap.set(schedule.id, {
        chatId: customer.telegram_chat_id,
        vehicleLabel: `${vehicle.plate_number}`,
        orgName,
      });
    }

    // Determine channel priority: telegram > email > in_app
    const channel: "email" | "telegram" | "in_app" = hasTelegram
      ? "telegram"
      : hasEmail
        ? "email"
        : "in_app";

    return {
      organization_id: schedule.organization_id,
      vehicle_service_schedule_id: schedule.id,
      vehicle_id: schedule.vehicle_id,
      customer_id: vehicle?.customer_id ?? null,
      service_catalog_id: schedule.service_catalog_id,
      service_name: schedule.service_name,
      reminder_type: "service_due" as const,
      channel,
      status: "pending" as const,
      scheduled_at: new Date().toISOString(),
    };
  });

  const { data: createdLogs, error: insertError } = await supabase
    .from("reminder_logs")
    .insert(reminders)
    .select(
      "id, organization_id, vehicle_service_schedule_id, service_name, channel",
    );

  if (insertError) {
    console.error("Failed to insert reminder logs:", insertError);
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let sentCount = 0;

  // Try to send emails for any pending logs with channel='email'
  // Graceful degradation: if RESEND_API_KEY is missing, just create logs
  if (createdLogs && createdLogs.length > 0) {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "noreply@tolom.app";

    if (RESEND_API_KEY) {
      for (const log of createdLogs) {
        if (log.channel !== "email") continue;

        const scheduleId = log.vehicle_service_schedule_id;
        if (!scheduleId) continue;

        const emailData = emailDataMap.get(scheduleId);
        if (!emailData) continue;

        try {
          const dueDate = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const html = buildReminderEmailHtml({
            customerName: "Valued Customer",
            vehicleLabel: emailData.vehicleLabel,
            serviceName: log.service_name,
            orgName: emailData.orgName,
            dueDate,
          });

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${emailData.orgName} <${EMAIL_FROM}>`,
              to: emailData.customerEmail,
              subject: `Сануулга: ${log.service_name} — ${emailData.vehicleLabel}`,
              html,
            }),
          });

          if (res.ok) {
            await supabase
              .from("reminder_logs")
              .update({ status: "sent", sent_at: new Date().toISOString() })
              .eq("id", log.id);
            sentCount++;
          } else {
            const errBody = await res.text();
            console.error(`Resend API error for log ${log.id}:`, errBody);
          }
        } catch (e) {
          console.error(`Failed to send reminder email for log ${log.id}:`, e);
        }
      }
    }
  }

  // Try to send Telegram messages for any pending logs with channel='telegram'
  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  if (TELEGRAM_BOT_TOKEN && createdLogs) {
    const tgApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

    for (const log of createdLogs) {
      if (log.channel !== "telegram") continue;

      const scheduleId = log.vehicle_service_schedule_id;
      if (!scheduleId) continue;

      const tgData = telegramDataMap.get(scheduleId);
      if (!tgData) continue;

      try {
        const message = [
          `🔔 *${log.service_name}*`,
          "",
          `Машин: ${tgData.vehicleLabel}`,
          `Үйлчилгээ: ${log.service_name}`,
          `Хугацаа: ${new Date().toLocaleDateString("mn-MN", { year: "numeric", month: "long", day: "numeric" })}`,
          "",
          "Засвар үйлчилгээнд цаг товлохыг хүсвэл бидэнтэй холбогдоно уу.",
          "",
          `— ${tgData.orgName}`,
        ].join("\n");

        const res = await fetch(`${tgApi}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: tgData.chatId,
            text: message,
            parse_mode: "Markdown",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "📊 Миний үйлчилгээ",
                    callback_data: "customer_status",
                  },
                  { text: "🛑 Зогсоох", callback_data: "unlink_customer" },
                ],
              ],
            },
          }),
        });

        if (res.ok) {
          await supabase
            .from("reminder_logs")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", log.id);
          sentCount++;
        } else {
          const errBody = await res.text();
          console.error(`Telegram API error for log ${log.id}:`, errBody);
          // If bot blocked by user, mark as failed but don't disable
          if (res.status === 403) {
            await supabase
              .from("reminder_logs")
              .update({
                status: "failed",
                error_message: "Bot blocked by user",
              })
              .eq("id", log.id);
          }
        }
      } catch (e) {
        console.error(`Failed to send Telegram reminder for log ${log.id}:`, e);
      }
    }
  }
  return new Response(
    JSON.stringify({
      checked: schedules.length,
      created: reminders.length,
      sent: sentCount,
      skipped: toNotify.length - reminders.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});

function buildReminderEmailHtml(params: {
  customerName: string;
  vehicleLabel: string;
  serviceName: string;
  orgName: string;
  dueDate: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="mn">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Үйлчилгээний сануулга</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;padding:40px 32px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;">Үйлчилгээний хугацаа ойртлоо</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;">${params.orgName}</p>
              <div style="background-color:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;text-align:left;">
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">Эрхэм <strong style="color:#111827;">${params.customerName}</strong> танд,</p>
                <p style="margin:0 0 12px;font-size:14px;color:#374151;line-height:1.5;">
                  Таны тээврийн хэрэгслийн дараах үйлчилгээний хугацаа ойртож байгааг сануулж байна:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Машин</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.vehicleLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Үйлчилгээ</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;color:#6b7280;">Хугацаа</td>
                    <td style="padding:6px 0;font-weight:600;color:#111827;text-align:right;">${params.dueDate}</td>
                  </tr>
                </table>
              </div>
              <p style="margin:0 0 0;font-size:13px;color:#9ca3af;">
                Цаг товлохыг хүсвэл бидэнтэй холбогдоно уу.
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
