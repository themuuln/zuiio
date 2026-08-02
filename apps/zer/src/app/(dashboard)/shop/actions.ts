"use server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture, withDbCapture } from "@zuiio/capture";
import { requireAppContext, requireWriteAction } from "@/lib/action-utils";
import { findOrCreateContact } from "@/lib/contact-utils";
import { createInvoiceFromSale } from "@/lib/invoicing";
import { revalidateEntity, revalidateEntityTag } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";
import type { CartItemData } from "@/lib/types";
import { getString } from "@/lib/validation";
import { deliverWebhookEvent } from "@/lib/webhooks";

export async function createShopSale(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  return Sentry.startSpan(
    { name: "createShopSale", op: "shop.checkout" },
    async (span) => {
      const t0 = performance.now();
      const timing = (phase: string, ms: number) =>
        span.setAttribute(`shop.${phase}_ms`, Math.round(ms));

      // --- Phase 1: Auth ---
      const authStart = performance.now();
      const ctx = await requireWriteAction("sales.create");
      if ("error" in ctx) return ctx;
      const { supabase, organizationId, userId, branchId } = ctx;
      timing("auth", performance.now() - authStart);
      span.setAttributes({
        "shop.org_id": organizationId,
        "shop.user_id": userId,
      });

      // --- Phase 1.5: Store account link ---
      // A signed-in buyer on the public storefront submits their own
      // store_accounts.id. It MUST match the session user — never trust
      // the client. Staff POS sales omit the field entirely.
      const storeAccountId = getString(formData, "store_account_id") || null;
      if (storeAccountId) {
        const { data: claimsData } = await supabase.auth.getClaims();
        const currentUserId = claimsData?.claims?.sub;
        if (!currentUserId || currentUserId !== storeAccountId) {
          return {
            error:
              "Хэрэглэгчийн бүртгэл баталгаажаагүй байна. Дахин нэвтэрнэ үү.",
          };
        }
        span.setAttribute("shop.store_account_id", storeAccountId);
      }

      // --- Phase 2: Parse ---
      const itemsRaw = formData.get("items");
      if (!itemsRaw) {
        return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
      }

      let items: CartItemData[];
      try {
        items = JSON.parse(itemsRaw.toString()) as CartItemData[];
      } catch (e) {
        capture(e, { context: "shop: parse cart items" });
        return { error: "Сагсны мэдээлэл буруу байна." };
      }

      if (!Array.isArray(items) || items.length === 0) {
        return { error: "Сагсанд бүтээгдэхүүн байхгүй байна." };
      }
      span.setAttribute("shop.item_count", items.length);

      const salespersonId = getString(formData, "salesperson_id") || userId;
      const paymentMethod = getString(formData, "payment_method") || "cash";
      const paidAmount = Number(formData.get("paid_amount") ?? 0);
      const totalAmount = items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      );

      const currencyCode = getString(formData, "currency_code") || "MNT";
      const currencySymbol = getString(formData, "currency_symbol") || "₮";
      const exchangeRate = Number(formData.get("exchange_rate") ?? 1.0);

      // Parse coupon fields
      const couponCode = getString(formData, "coupon_code");
      const _discountAmount = Number(formData.get("discount_amount") ?? 0);

      // Parse gift card fields
      const giftCardId = getString(formData, "gift_card_id");
      const giftCardAmount = Number(formData.get("gift_card_amount") ?? 0);

      // Parse promotion discount
      const promotionDiscountAmount = Number(
        formData.get("promotion_discount_amount") ?? 0,
      );

      // Server-side coupon validation (safety net)
      let validatedDiscount = 0;
      let couponId: string | null = null;
      if (couponCode) {
        const validation = await validateCouponInternal(
          supabase,
          organizationId,
          couponCode,
          totalAmount,
        );
        if (validation.valid) {
          validatedDiscount = validation.discount_amount;
          couponId = validation.coupon_id;
        }
      }

      const discountedTotal = Math.max(
        0,
        totalAmount - validatedDiscount - promotionDiscountAmount,
      );

      const customerName = getString(formData, "customer_name");
      const customerPhone = customerName
        ? getString(formData, "customer_phone")
        : null;

      // --- Phase 3: Pre-sale parallel ---
      const preSaleStart = performance.now();
      const [salespersonOk, contactResult] = await Promise.all([
        // Salesperson validation (skip if self)
        salespersonId === userId
          ? (true as const)
          : supabase
              .from("profiles")
              .select("id")
              .eq("id", salespersonId)
              .eq("organization_id", organizationId)
              .maybeSingle()
              .then(({ data, error }) => {
                if (error) {
                  capture(error, {
                    context: "createShopSale: validate salesperson",
                  });
                  return {
                    error: "Борлуулагч шалгахад алдаа гарлаа.",
                  } as const;
                }
                if (!data) {
                  return {
                    error:
                      "Сонгосон борлуулагч танай байгууллагад хамаарахгүй байна.",
                  } as const;
                }
                return true as const;
              }),
        // Contact creation
        customerName
          ? findOrCreateContact(
              supabase,
              organizationId,
              "customer",
              customerName,
              customerPhone,
            )
          : null,
      ]);
      timing("pre_sale", performance.now() - preSaleStart);

      if (typeof salespersonOk === "object" && "error" in salespersonOk) {
        return salespersonOk;
      }

      let contactId: string | null = null;
      let createdContact = false;
      if (contactResult) {
        if ("error" in contactResult) return contactResult;
        contactId = contactResult.id;
        createdContact = true;
      }

      // --- Phase 4: Atomic RPC ---
      const rpcStart = performance.now();
      const { data: result, error: rpcError } = await supabase.rpc(
        "process_shop_sale",
        {
          p_org_id: organizationId,
          p_branch_id: branchId,
          p_user_id: userId,
          p_contact_id: contactId as string,
          p_total_amount: discountedTotal,
          p_original_amount: totalAmount,
          p_paid_amount: paidAmount,
          p_payment_method: paymentMethod,
          p_salesperson_id: salespersonId,
          p_items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.unitPrice * item.quantity,
            commission_amount:
              Math.round(item.unitPrice * item.quantity * 0.1 * 100) / 100,
            variant_id: item.variantId ?? "",
          })),
          p_movements: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            unit_cost: item.unitPrice,
            variant_id: item.variantId ?? "",
          })),
          p_currency_code: currencyCode,
          p_currency_symbol: currencySymbol,
          p_exchange_rate: exchangeRate,
        },
      );
      timing("rpc", performance.now() - rpcStart);

      if (
        rpcError ||
        !result ||
        typeof result !== "object" ||
        !("success" in result)
      ) {
        span.setStatus({ code: 2, message: "error" });
        if (createdContact && contactId) {
          await supabase.from("contacts").delete().eq("id", contactId);
        }
        const rpcErrResult =
          result && typeof result === "object" && "error" in result
            ? result
            : null;
        const errorMsg =
          rpcError?.message ??
          (rpcErrResult ? String(rpcErrResult.error) : null) ??
          "Үлдэгдэл хүрэлцэхгүй байна.";
        capture(new Error(errorMsg), {
          context: "createShopSale: process_shop_sale",
        });
        return { error: errorMsg };
      }

      const saleId = String(result.sale_id);
      span.setAttribute("shop.sale_id", saleId);

      // The process_shop_sale RPC has no store_account_id parameter, so
      // link the buyer afterwards via a scoped update (same request).
      if (storeAccountId) {
        const { error: storeLinkError } = await withDbCapture(
          "createShopSale: link store account",
          supabase
            .from("sales")
            .update({ store_account_id: storeAccountId } as never)
            .eq("id", saleId),
        );
        if (storeLinkError) {
          capture(storeLinkError, {
            context: "createShopSale: link store account",
            saleId,
          });
        }
      }

      // --- Phase 5: Post-sale (fire-and-forget) ---
      createInvoiceFromSale(
        supabase,
        organizationId,
        userId,
        saleId,
        contactId,
        branchId as string,
      ).catch((e) => {
        capture(e, { context: "createShopSale: fire-and-forget invoice" });
      });

      // Record coupon usage and update used_count (fire-and-forget)
      // Note: coupons/coupon_usage tables exist in DB but not yet in generated supabase types.
      // Cast through unknown because table names are not in Database['public']['Tables'].
      if (couponId && couponCode) {
        (async () => {
          const couponDb = supabase as unknown as {
            from(table: "coupon_usage"): {
              insert(
                data: Record<string, unknown>,
              ): Promise<{ error: unknown }>;
            };
            from(table: "coupons"): {
              select(columns: string): {
                eq(
                  col: string,
                  val: string,
                ): {
                  maybeSingle(): Promise<{
                    data: Record<string, unknown> | null;
                    error: unknown;
                  }>;
                };
              };
              update(data: Record<string, unknown>): {
                eq(col: string, val: string): Promise<{ error: unknown }>;
              };
            };
          };

          const { error: usageError } = await couponDb
            .from("coupon_usage")
            .insert({
              coupon_id: couponId,
              organization_id: organizationId,
              contact_id: contactId,
              sale_id: saleId,
            });
          if (usageError) {
            capture(
              usageError instanceof Error
                ? usageError
                : new Error(String(usageError)),
              {
                context: "createShopSale: coupon_usage insert",
              },
            );
          }

          // Read current used_count and increment
          const { data: currentCoupon } = await couponDb
            .from("coupons")
            .select("used_count")
            .eq("id", couponId)
            .maybeSingle();
          const currentCount =
            currentCoupon &&
            typeof currentCoupon === "object" &&
            "used_count" in currentCoupon
              ? Number(currentCoupon.used_count)
              : 0;

          const { error: updateError } = await couponDb
            .from("coupons")
            .update({ used_count: currentCount + 1 })
            .eq("id", couponId);
          if (updateError) {
            capture(
              updateError instanceof Error
                ? updateError
                : new Error(String(updateError)),
              {
                context: "createShopSale: coupon used_count update",
              },
            );
          }
        })().catch((e) => {
          capture(e, { context: "createShopSale: fire-and-forget coupon" });
        });
      }

      // Gift card redemption
      if (giftCardId && giftCardAmount > 0) {
        (async () => {
          const gcDb = supabase as unknown as {
            rpc(
              fn: "redeem_gift_card",
              params: Record<string, unknown>,
            ): Promise<{
              data: unknown;
              error: unknown;
            }>;
          };

          const { data: redeemResult, error: redeemError } = await gcDb.rpc(
            "redeem_gift_card",
            {
              p_gift_card_id: giftCardId,
              p_organization_id: organizationId,
              p_amount: giftCardAmount,
              p_sale_id: saleId,
              p_user_id: userId,
            },
          );

          if (redeemError) {
            capture(
              redeemError instanceof Error
                ? redeemError
                : new Error(String(redeemError)),
              {
                context: "createShopSale: redeem_gift_card",
              },
            );
          } else if (
            redeemResult &&
            typeof redeemResult === "object" &&
            "success" in (redeemResult as Record<string, unknown>) &&
            !(redeemResult as Record<string, unknown>).success
          ) {
            const errMsg =
              typeof (redeemResult as Record<string, unknown>).error ===
              "string"
                ? ((redeemResult as Record<string, unknown>).error as string)
                : "Бэлгийн карт ашиглахад алдаа гарлаа.";
            capture(new Error(errMsg), {
              context: "createShopSale: redeem_gift_card",
            });
          }
        })().catch((e) => {
          capture(e, { context: "createShopSale: fire-and-forget gift card" });
        });
      }

      // Webhook delivery (fire-and-forget)
      deliverWebhookEvent(supabase, organizationId, "sale.created", {
        sale_id: saleId,
        total_amount: Number(result.total_amount ?? result.total ?? 0),
        contact_id: contactId ?? null,
      }).catch((e) => {
        capture(e, { context: "createShopSale: webhook sale.created" });
      });

      revalidateEntity("shop");
      revalidateEntityTag("sales", organizationId);
      revalidateEntityTag("products", organizationId);
      if (createdContact) {
        revalidateEntityTag("customers", organizationId);
      }

      timing("total", performance.now() - t0);
      span.setStatus({ code: 1 });

      return { saleId };
    },
  );
}

/**
 * Internal coupon validation helper (used by createShopSale for server-side re-validation).
 * Coupons table exists in DB but not yet in generated supabase types.
 */
async function validateCouponInternal(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  code: string,
  cartTotal: number,
  contactId?: string | null,
): Promise<{
  valid: boolean;
  discount_amount: number;
  coupon_id: string;
  error?: string;
}> {
  // coupons table exists in DB but not in generated types
  const couponDb = supabase as unknown as {
    from(table: "coupons"): {
      select(
        columns: string,
        opts?: { count?: "exact"; head?: boolean },
      ): {
        eq(
          col: string,
          val: string,
        ): {
          eq(
            col2: string,
            val2: string,
          ): {
            maybeSingle(): Promise<{
              data: Record<string, unknown> | null;
              error: unknown;
            }>;
          };
        };
      };
    };
  };

  const { data: coupon, error } = await couponDb
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    capture(error instanceof Error ? error : new Error(String(error)), {
      context: "validateCouponInternal: fetch",
    });
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: "",
      error: "Купоны код шалгахад алдаа гарлаа.",
    };
  }

  if (!coupon) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: "",
      error: "Купон олдсонгүй.",
    };
  }

  const c = coupon as unknown as {
    id: string;
    is_active: boolean;
    valid_from: string | null;
    valid_until: string | null;
    usage_limit: number | null;
    used_count: number;
    per_customer_limit: number | null;
    min_purchase_amount: number;
    discount_type: string;
    discount_value: number;
    max_discount_amount: number | null;
    applies_to: string;
  };

  if (!c.is_active) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: c.id,
      error: "Купон идэвхгүй байна.",
    };
  }

  // Check valid dates
  const now = new Date().toISOString();
  if (c.valid_from && now < c.valid_from) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: c.id,
      error: "Купоны хугацаа эхлээгүй байна.",
    };
  }
  if (c.valid_until && now > c.valid_until) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: c.id,
      error: "Купоны хугацаа дууссан.",
    };
  }

  // Check usage limit
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: c.id,
      error: "Купоны ашиглах хязгаар дууссан.",
    };
  }

  // Check per-customer limit (only if contactId provided)
  if (contactId && c.per_customer_limit !== null) {
    const usageDb = supabase as unknown as {
      from(table: "coupon_usage"): {
        select(
          columns: string,
          opts?: { count?: "exact"; head?: boolean },
        ): {
          eq(
            col: string,
            val: string,
          ): {
            eq(
              col2: string,
              val2: string,
            ): Promise<{ count: number | null; error: unknown }>;
          };
        };
      };
    };

    const { count, error: countError } = await usageDb
      .from("coupon_usage")
      .select("*", { count: "exact", head: true })
      .eq("coupon_id", c.id)
      .eq("contact_id", contactId);

    if (!countError && count !== null && count >= c.per_customer_limit) {
      return {
        valid: false,
        discount_amount: 0,
        coupon_id: c.id,
        error: "Та энэ купоныг аль хэдийн ашигласан.",
      };
    }
  }

  // Check min purchase amount
  if (cartTotal < c.min_purchase_amount) {
    return {
      valid: false,
      discount_amount: 0,
      coupon_id: c.id,
      error: `Хамгийн бага худалдан авалт: ${Math.round(c.min_purchase_amount).toLocaleString()}₮`,
    };
  }

  // Calculate discount amount
  let discountAmount: number;
  if (c.discount_type === "percentage") {
    discountAmount =
      Math.round(cartTotal * (c.discount_value / 100) * 100) / 100;
    if (c.max_discount_amount !== null) {
      discountAmount = Math.min(discountAmount, c.max_discount_amount);
    }
  } else {
    // fixed_amount — cannot exceed cart total
    discountAmount = Math.min(c.discount_value, cartTotal);
  }

  return {
    valid: true,
    discount_amount: discountAmount,
    coupon_id: c.id,
  };
}

/**
 * Validates a coupon code for the current organization.
 * Used by the checkout coupon input component.
 */
export async function validateCouponCode(
  code: string,
  cartTotal: number,
  contactId?: string,
): Promise<{
  valid: boolean;
  discount_amount: number;
  coupon_id: string;
  error?: string;
}> {
  const { supabase, organizationId } = await requireAppContext();

  return validateCouponInternal(
    supabase,
    organizationId,
    code,
    cartTotal,
    contactId,
  );
}

/**
 * Validates a gift card code for the current organization.
 * Returns the card's current balance and the max redeemable amount for this cart.
 * Used by the checkout gift card input component.
 */
export async function validateGiftCardCode(
  code: string,
  cartTotal: number,
): Promise<{
  valid: boolean;
  gift_card_id: string;
  current_balance: number;
  redeemable_amount: number;
  error?: string;
}> {
  const { supabase, organizationId } = await requireAppContext();

  // Gift cards table exists in DB but not in generated types
  const gcDb = supabase as unknown as {
    from(table: "gift_cards"): {
      select(columns: string): {
        eq(
          col: string,
          val: string,
        ): {
          eq(
            col2: string,
            val2: string,
          ): {
            maybeSingle(): Promise<{
              data: Record<string, unknown> | null;
              error: unknown;
            }>;
          };
        };
      };
    };
  };

  const { data: card, error } = await gcDb
    .from("gift_cards")
    .select("*")
    .eq("code", code)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    capture(error instanceof Error ? error : new Error(String(error)), {
      context: "validateGiftCardCode: fetch",
    });
    return {
      valid: false,
      gift_card_id: "",
      current_balance: 0,
      redeemable_amount: 0,
      error: "Бэлгийн карт шалгахад алдаа гарлаа.",
    };
  }

  if (!card) {
    return {
      valid: false,
      gift_card_id: "",
      current_balance: 0,
      redeemable_amount: 0,
      error: "Бэлгийн карт олдсонгүй.",
    };
  }

  const c = card as unknown as {
    id: string;
    is_active: boolean;
    expires_at: string | null;
    current_balance: number;
  };

  if (!c.is_active) {
    return {
      valid: false,
      gift_card_id: c.id,
      current_balance: 0,
      redeemable_amount: 0,
      error: "Бэлгийн карт идэвхгүй байна.",
    };
  }

  if (c.expires_at && new Date().toISOString() > c.expires_at) {
    return {
      valid: false,
      gift_card_id: c.id,
      current_balance: 0,
      redeemable_amount: 0,
      error: "Бэлгийн картын хугацаа дууссан.",
    };
  }

  if (c.current_balance <= 0) {
    return {
      valid: false,
      gift_card_id: c.id,
      current_balance: 0,
      redeemable_amount: 0,
      error: "Бэлгийн картын үлдэгдэл дууссан.",
    };
  }

  const redeemableAmount = Math.min(c.current_balance, cartTotal);

  return {
    valid: true,
    gift_card_id: c.id,
    current_balance: c.current_balance,
    redeemable_amount: redeemableAmount,
  };
}

/**
 * Returns all profiles in the current organization and the current user's ID.
 * Used by the StaffPicker component for salesperson selection.
 */
export async function getStaffList() {
  const { supabase, organizationId, userId } = await requireAppContext();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("organization_id", organizationId)
    .order("full_name");

  if (error) {
    return { error: "Борлуулагчдын жагсаалт авахад алдаа гарлаа." };
  }

  return { profiles: profiles ?? [], currentUserId: userId };
}

const PRODUCTS_PAGE_SIZE = 50;

/**
 * Fetch a page of products for the catalog (infinite scroll).
 * Returns products + whether more pages exist.
 */
export async function fetchProductsPage(offset: number): Promise<{
  products: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    unit: string | null;
    sale_price: number | null;
    current_stock: number | null;
    category_id: string | null;
    image_url: string | null;
    brand_name: string | null;
    brand_logo_url: string | null;
  }[];
  hasMore: boolean;
}> {
  const { supabase, organizationId } = await requireAppContext();

  const { data: products } = await withDbCapture(
    "shop_products_page",
    supabase
      .from("products")
      .select(
        "id, name, sku, barcode, unit, sale_price, current_stock, category_id, image_url, brands(name, logo_url)",
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .range(offset, offset + PRODUCTS_PAGE_SIZE - 1),
  );

  const productList = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    unit: p.unit,
    sale_price: p.sale_price,
    current_stock: p.current_stock,
    category_id: p.category_id,
    image_url: p.image_url,
    brand_name:
      (p.brands as { name: string; logo_url: string | null } | null)?.name ??
      null,
    brand_logo_url:
      (p.brands as { name: string; logo_url: string | null } | null)
        ?.logo_url ?? null,
  }));

  return {
    products: productList,
    hasMore: productList.length === PRODUCTS_PAGE_SIZE,
  };
}
