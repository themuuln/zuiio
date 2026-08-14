import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Tool } from "@zuiio/ai-agent";
import type { Database } from "@/lib/supabase/types";
import { createStorefrontAgentTools } from "./storefront";

/**
 * Buyer-facing agent tools for chat commerce (Telegram / Messenger bots).
 *
 * Reuses the storefront catalog tools (public RPCs only) and adds
 * `place_order`, which submits a guest order through the same
 * `submit_shop_order` RPC the storefront checkout uses. All pricing is
 * computed server-side by that RPC — the agent never invents prices.
 */
export function createBuyerAgentTools(
  supabase: SupabaseClient<Database>,
  slug: string,
  baseUrl: string,
): Tool[] {
  return [
    ...createStorefrontAgentTools(supabase, slug, baseUrl),
    {
      name: "place_order",
      description:
        "Захиалга байршуулах. items нь [{'product_id': '...', 'quantity': 1, 'variant_id': ''}] хэлбэртэй. Нэр, утас шаардлагатай. delivery_type 'delivery' бол address заавал. pickup бол pickup_branch_slug өгч болно.",
      parameters: [
        {
          name: "items",
          type: "array",
          description:
            "Захиалгын бүтээгдэхүүнүүд: [{product_id: string, quantity: number, variant_id: string}] — variant_id нь хувилбаргүй бол хоосон string",
          required: true,
          items: { type: "object" },
        },
        {
          name: "contact_name",
          type: "string",
          description: "Худалдан авагчийн нэр",
          required: true,
        },
        {
          name: "contact_phone",
          type: "string",
          description: "Худалдан авагчийн утас",
          required: true,
        },
        {
          name: "delivery_type",
          type: "string",
          description: "delivery (хүргүүлэх) эсвэл pickup (дэлгүүрээс авах)",
          required: false,
          enum: ["delivery", "pickup"],
        },
        {
          name: "address",
          type: "string",
          description: "Хүргэлтийн хаяг (delivery үед заавал)",
          required: false,
        },
        {
          name: "address_note",
          type: "string",
          description: "Хаягийн нэмэлт тэмдэглэл",
          required: false,
        },
        {
          name: "pickup_branch_slug",
          type: "string",
          description: "Авах салбарын slug (pickup үед)",
          required: false,
        },
        {
          name: "payment_method",
          type: "string",
          description: "Төлбөрийн арга (cash эсвэл card)",
          required: false,
          enum: ["cash", "card"],
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const items = normalizeItems(args.items);
        if (items.length === 0) {
          return { error: "Захиалгын бүтээгдэхүүн буруу байна." };
        }

        const contactName = String(args.contact_name ?? "").trim();
        const contactPhone = String(args.contact_phone ?? "").trim();
        if (!contactName || !contactPhone) {
          return { error: "Нэр, утас шаардлагатай." };
        }

        const deliveryType =
          args.delivery_type === "delivery" ? "delivery" : "pickup";
        const address =
          deliveryType === "delivery"
            ? String(args.address ?? "").trim()
            : undefined;
        if (deliveryType === "delivery" && !address) {
          return { error: "Хүргэлтийн хаяг шаардлагатай." };
        }

        const { data, error } = await supabase.rpc("submit_shop_order", {
          p_org_slug: slug,
          p_items: items,
          p_payment_method: args.payment_method === "card" ? "card" : "cash",
          p_contact_name: contactName,
          p_contact_phone: contactPhone,
          p_delivery_type: deliveryType,
          p_address: address,
          p_address_note:
            typeof args.address_note === "string"
              ? args.address_note
              : undefined,
          p_pickup_branch_slug:
            typeof args.pickup_branch_slug === "string"
              ? args.pickup_branch_slug
              : undefined,
          p_idempotency_key: crypto.randomUUID(),
        });

        if (error) {
          return { error: error.message };
        }

        const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
        if (!row) {
          return { error: "Захиалга үүсгэхэд алдаа гарлаа." };
        }

        return {
          order_id: row.order_id,
          total_amount: row.total_amount,
          status: row.status,
          delivery_fee: row.delivery_fee,
          discount_amount: row.discount_amount,
          gift_card_amount: row.gift_card_amount,
          payment_instructions: row.payment_instructions,
        };
      },
    },
    {
      name: "get_order_status",
      description:
        "Захиалгын статус шалгах (place_order-оос авсан order_id-ээр).",
      parameters: [
        {
          name: "order_id",
          type: "string",
          description: "place_order-ын буцаасан order_id",
          required: true,
        },
      ],
      execute: async (args: Record<string, unknown>) => {
        const orderId = String(args.order_id ?? "").trim();
        if (!orderId) return { error: "order_id шаардлагатай." };

        // Scope the lookup to this shop's orders — the buyer may only
        // query orders that belong to the bound organization.
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!org) return { error: "Дэлгүүр олдсонгүй." };

        const { data, error } = await supabase
          .from("sales")
          .select("id, status, total_amount, created_at")
          .eq("id", orderId)
          .eq("organization_id", org.id)
          .maybeSingle();

        if (error) return { error: error.message };
        if (!data) {
          return {
            error: "Захиалга олдсонгүй. Захиалгын дугаараа шалгана уу.",
          };
        }

        return {
          order_id: data.id,
          status: data.status,
          total_amount: data.total_amount,
          created_at: data.created_at,
        };
      },
    },
  ];
}

function normalizeItems(value: unknown): Array<{
  product_id: string;
  quantity: number;
  variant_id: string;
}> {
  if (!Array.isArray(value)) return [];
  const items: Array<{
    product_id: string;
    quantity: number;
    variant_id: string;
  }> = [];
  for (const raw of value) {
    if (typeof raw !== "object" || raw === null) continue;
    const item = raw as Record<string, unknown>;
    const productId = String(item.product_id ?? "").trim();
    if (!productId) continue;
    items.push({
      product_id: productId,
      quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
      variant_id: typeof item.variant_id === "string" ? item.variant_id : "",
    });
  }
  return items;
}
