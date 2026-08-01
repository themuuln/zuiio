import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePhone(value: unknown): string | null {
  const phone = String(value ?? "").replace(/[^\d+]/g, "");
  return /^\+?\d{6,15}$/.test(phone) ? phone : null;
}

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET")
    return htmlResponse("<h1>Method not allowed</h1>", 405);

  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token || token.length < 50)
    return htmlResponse("<h1>Хуваалцах холбоос буруу байна</h1>", 400);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    const tokenHash = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    const { data: report, error } = await supabase
      .from("lost_horse_reports")
      .select(
        "id, horse_name, description, last_seen_at, status, photo_url, location_aimag, location_sum, location_bag, location_name, animal_type, coat_color, lost_count, tamga_image_url, ear_mark_description, contact_phone, public_location_precision, public_contact_mode, expires_at",
      )
      .eq("public_token_hash", tokenHash)
      .eq("public_access_enabled", true)
      .eq("status", "active")
      .maybeSingle();

    if (error || !report) {
      return htmlResponse(
        "<h1>Зар олдсонгүй эсвэл хугацаа дууссан байна</h1>",
        404,
      );
    }
    if (report.expires_at && new Date(report.expires_at) <= new Date()) {
      return htmlResponse("<h1>Энэ зарын хугацаа дууссан байна</h1>", 410);
    }

    const { data: media } = await supabase
      .from("lost_horse_media")
      .select("url, media_type")
      .eq("report_id", report.id)
      .order("sort_order", { ascending: true });

    const locationParts =
      report.public_location_precision === "aimag"
        ? [report.location_aimag]
        : report.public_location_precision === "bag"
          ? [report.location_aimag, report.location_sum, report.location_bag]
          : [report.location_aimag, report.location_sum];
    const location = locationParts.filter(Boolean).map(escapeHtml).join(" · ");
    const photos = (media ?? [])
      .filter((item) => item.media_type === "photo")
      .map(
        (item) =>
          `<img src="${escapeHtml(item.url)}" alt="Морины зураг" loading="lazy">`,
      )
      .join("");
    const contactPhone = normalizePhone(report.contact_phone);
    const contact =
      report.public_contact_mode === "phone" && contactPhone
        ? `<a class="contact" href="tel:${contactPhone}">Холбоо барих / Contact</a>`
        : "";

    return htmlResponse(`<!doctype html>
<html lang="mn"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(report.horse_name ?? "Алдсан морь")}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;max-width:680px;margin:0 auto;padding:24px;color:#202124;background:#fafafa}main{background:#fff;border-radius:18px;padding:20px;box-shadow:0 4px 24px #00000012}h1{margin:0 0 8px;color:#b64117}.meta{color:#5f6368;margin:6px 0}.description{white-space:pre-wrap;line-height:1.5}figure{margin:12px 0;display:grid;grid-template-columns:repeat(2,1fr);gap:8px}img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:12px}.contact{display:inline-block;background:#b64117;color:#fff;padding:12px 16px;border-radius:10px;text-decoration:none;font-weight:600}</style></head>
<body><main><p class="meta">ТАМГА · АЛДСАН МОРЬ / LOST HORSE</p><h1>${escapeHtml(report.horse_name ?? "Алдсан морь")}</h1>
<p class="meta">${location || "Байршил тодорхойгүй"}</p><p class="meta">Сүүлд үзэгдсэн: ${escapeHtml(report.last_seen_at)}</p>
${photos ? `<figure>${photos}</figure>` : ""}<p class="description">${escapeHtml(report.description || "Тайлбар байхгүй")}</p>
${report.animal_type ? `<p class="meta">Төрөл: ${escapeHtml(report.animal_type)}${report.coat_color ? ` · Зүс: ${escapeHtml(report.coat_color)}` : ""}</p>` : ""}
${report.tamga_image_url ? `<p><strong>Тамга:</strong><br><img src="${escapeHtml(report.tamga_image_url)}" alt="Тамганы зураг"></p>` : ""}
${report.ear_mark_description ? `<p><strong>Имийн тайлбар:</strong> ${escapeHtml(report.ear_mark_description)}</p>` : ""}${contact}
</main></body></html>`);
  } catch (error) {
    console.error("Public lost-horse page error:", error);
    return htmlResponse("<h1>Түр алдаа гарлаа. Дахин оролдоно уу.</h1>", 500);
  }
});
