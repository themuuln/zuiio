// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async () => {
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
        customer:customers!left(phone, email)
      ),
      organization:organizations!inner(
        settings:organization_settings!left(sms_enabled, settings)
      )
    `,
    )
    .is("deleted_at", null)
    .eq("reminder_enabled", true)
    .lte("next_due_date", sevenDaysFromNow.toISOString().split("T")[0])
    .order("next_due_date", { ascending: true });

  if (fetchError) {
    console.error("Failed to fetch service schedules:", fetchError);
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!schedules || schedules.length === 0) {
    console.log("No upcoming service schedules found");
    return new Response(
      JSON.stringify({ checked: 0 }),
      { headers: { "Content-Type": "application/json" } },
    );
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

  const toNotify = schedules.filter(
    (s) => !alreadyNotified.has(s.id),
  );

  if (toNotify.length === 0) {
    console.log("All schedules already have recent reminders");
    return new Response(
      JSON.stringify({ checked: schedules.length, skipped: toNotify.length }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Create reminder_log entries for each due schedule
  const reminders = toNotify.map((schedule) => {
    const vehicle = schedule.vehicle as unknown as {
      plate_number: string;
      customer_id: string | null;
      customer: { phone: string | null; email: string | null } | null;
    };
    const org = schedule.organization as unknown as {
      settings: { sms_enabled: boolean; settings: Record<string, unknown> } | null;
    };

    const customer = vehicle?.customer;
    const orgRow = org?.settings;
    const orgJsonSettings = orgRow?.settings as Record<string, unknown> | null;
    const defaultChannel = orgJsonSettings?.reminder_default_channel as string | null;

    const hasPhone = !!customer?.phone;
    const hasEmail = !!customer?.email;
    const smsAllowed = orgRow?.sms_enabled === true;

    // Determine channel from user's default setting, then fallback
    let channel: "sms" | "email" | "both" | "in_app";
    if (defaultChannel === "both" && hasPhone && hasEmail) {
      channel = "both";
    } else if (defaultChannel === "sms" && hasPhone && smsAllowed) {
      channel = "sms";
    } else if (defaultChannel === "email" && hasEmail) {
      channel = "email";
    } else if (smsAllowed && hasPhone) {
      channel = "sms";
    } else if (hasEmail) {
      channel = "email";
    } else {
      channel = "in_app";
    }

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

  const { error: insertError } = await supabase
    .from("reminder_logs")
    .insert(reminders);

  if (insertError) {
    console.error("Failed to insert reminder logs:", insertError);
    return new Response(
      JSON.stringify({ error: insertError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(
    `Created ${reminders.length} reminder(s) from ${schedules.length} due schedule(s)`,
  );
  return new Response(
    JSON.stringify({
      checked: schedules.length,
      created: reminders.length,
      skipped: toNotify.length - reminders.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
