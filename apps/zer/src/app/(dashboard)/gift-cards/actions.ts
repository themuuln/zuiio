"use server";

import { capture, withDbCapture } from "@zuiio/capture";
import { after } from "next/server";
import { requireAppContext, requireWriteAction } from "@/lib/action-utils";
import { logAuditEventWithClient } from "@/lib/audit";
import { revalidateEntities } from "@/lib/revalidate";
import { getString } from "@/lib/validation";

function parseFloatSafe(value: FormDataEntryValue | null): number {
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createGiftCard(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("gift_cards.create");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const code = getString(formData, "code");
  const initialBalance = parseFloatSafe(formData.get("initial_balance"));
  const currencyCode = getString(formData, "currency_code") || "MNT";
  const expiresAt = getString(formData, "expires_at") || null;
  const recipientName = getString(formData, "recipient_name") || null;
  const recipientEmail = getString(formData, "recipient_email") || null;
  const senderName = getString(formData, "sender_name") || null;
  const message = getString(formData, "message") || null;
  const isActive = formData.get("is_active") === "true";

  // Validate
  if (!code) {
    return { error: "Код шаардлагатай." };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return { error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно." };
  }

  if (initialBalance <= 0) {
    return { error: "Анхны үлдэгдэл 0-ээс их байх ёстой." };
  }

  // Check for duplicate code within organization
  const { data: existing } = await withDbCapture(
    "gift_cards: check duplicate code",
    supabase
      .from("gift_cards")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", code)
      .maybeSingle(),
  );

  if (existing) {
    return { error: `"${code}" кодтой бэлгийн карт аль хэдийн бүртгэгдсэн байна.` };
  }

  // Insert gift card
  const { data: giftCard, error: gcError } = await withDbCapture(
    "gift_cards: create",
    supabase
      .from("gift_cards")
      .insert({
        organization_id: organizationId,
        code,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        currency_code: currencyCode,
        expires_at: expiresAt,
        is_active: isActive,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        sender_name: senderName,
        message,
        created_by: userId,
      })
      .select("id, code")
      .single(),
  );

  if (gcError) {
    return {
      error: `Бэлгийн карт үүсгэхэд алдаа гарлаа: ${gcError.message}`,
    };
  }

  // Record issuance transaction
  const { error: txError } = await withDbCapture(
    "gift_cards: create issuance transaction",
    supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      organization_id: organizationId,
      transaction_type: "issuance",
      amount: initialBalance,
      balance_before: 0,
      balance_after: initialBalance,
      created_by: userId,
    }),
  );

  if (txError) {
    capture(txError, { context: "createGiftCard: issuance transaction" });
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "created",
      "gift_card",
      giftCard.id,
      { initial_balance: { old: 0, new: initialBalance } },
      `Бэлгийн карт "${giftCard.code}" үүсгэсэн`,
    ),
  );

  revalidateEntities(["gift_cards"]);
  return { success: true as const, error: undefined };
}

// ─── Update ────────────────────────────────────────────────────────────────

export async function updateGiftCard(
  _prevState: { error?: string } | undefined,
  formData: FormData,
) {
  const ctx = await requireWriteAction("gift_cards.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const giftCardId = getString(formData, "id");
  if (!giftCardId) {
    return { error: "Бэлгийн картын ID олдсонгүй." };
  }

  const code = getString(formData, "code");
  const currencyCode = getString(formData, "currency_code") || "MNT";
  const expiresAt = getString(formData, "expires_at") || null;
  const recipientName = getString(formData, "recipient_name") || null;
  const recipientEmail = getString(formData, "recipient_email") || null;
  const senderName = getString(formData, "sender_name") || null;
  const message = getString(formData, "message") || null;
  const isActive = formData.get("is_active") === "true";

  // Validate
  if (!code) {
    return { error: "Код шаардлагатай." };
  }

  if (!/^[A-Za-z0-9_-]+$/.test(code)) {
    return { error: "Код зөвхөн үсэг, тоо, зураас, доогуур зураас агуулж болно." };
  }

  // Check for duplicate code within organization (exclude current)
  const { data: existing } = await withDbCapture(
    "gift_cards: check duplicate code on update",
    supabase
      .from("gift_cards")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("code", code)
      .neq("id", giftCardId)
      .maybeSingle(),
  );

  if (existing) {
    return { error: `"${code}" кодтой бэлгийн карт аль хэдийн бүртгэгдсэн байна.` };
  }

  const { error: gcError } = await withDbCapture(
    "gift_cards: update",
    supabase
      .from("gift_cards")
      .update({
        code,
        currency_code: currencyCode,
        expires_at: expiresAt,
        is_active: isActive,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        sender_name: senderName,
        message,
      })
      .eq("id", giftCardId)
      .eq("organization_id", organizationId),
  );

  if (gcError) {
    return {
      error: `Бэлгийн карт шинэчлэхэд алдаа гарлаа: ${gcError.message}`,
    };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "gift_card",
      giftCardId,
      undefined,
      `Бэлгийн карт "${code}" шинэчилсэн`,
    ),
  );

  revalidateEntities(["gift_cards"]);
  return { success: true as const, error: undefined };
}

// ─── Toggle active ─────────────────────────────────────────────────────────

export async function toggleGiftCardActive(
  giftCardId: string,
  isActive: boolean,
) {
  const ctx = await requireWriteAction("gift_cards.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  const { data: giftCard, error: fetchError } = await withDbCapture(
    "gift_cards: fetch for toggle",
    supabase
      .from("gift_cards")
      .select("code")
      .eq("id", giftCardId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !giftCard) {
    return { error: "Бэлгийн карт олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "gift_cards: toggle active",
    supabase
      .from("gift_cards")
      .update({ is_active: isActive })
      .eq("id", giftCardId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    return {
      error: `Төлөв шинэчлэхэд алдаа гарлаа: ${error.message}`,
    };
  }

  const action = isActive ? "Идэвхжүүлсэн" : "Идэвхгүйжүүлсэн";

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      isActive ? "activated" : "deactivated",
      "gift_card",
      giftCardId,
      { is_active: { old: !isActive, new: isActive } },
      `Бэлгийн карт "${giftCard.code}" ${action}`,
    ),
  );

  revalidateEntities(["gift_cards"]);
  return { success: true as const, error: undefined };
}

// ─── Delete ────────────────────────────────────────────────────────────────

export async function deleteGiftCard(giftCardId: string) {
  const ctx = await requireWriteAction("gift_cards.delete");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  // Fetch gift card details for audit before deleting
  const { data: giftCard, error: fetchError } = await withDbCapture(
    "gift_cards: fetch for delete",
    supabase
      .from("gift_cards")
      .select("code")
      .eq("id", giftCardId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !giftCard) {
    return { error: "Бэлгийн карт олдсонгүй." };
  }

  const { error } = await withDbCapture(
    "gift_cards: delete",
    supabase
      .from("gift_cards")
      .delete()
      .eq("id", giftCardId)
      .eq("organization_id", organizationId),
  );

  if (error) {
    capture(error, { context: "deleteGiftCard: delete" });
    return { error: `Бэлгийн карт устгахад алдаа гарлаа: ${error.message}` };
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "deleted",
      "gift_card",
      giftCardId,
      undefined,
      `Бэлгийн карт "${giftCard.code}" устгасан`,
    ),
  );

  revalidateEntities(["gift_cards"]);
  return { success: true as const, error: undefined };
}

// ─── Top-up ────────────────────────────────────────────────────────────────

export async function topUpGiftCard(giftCardId: string, amount: number) {
  const ctx = await requireWriteAction("gift_cards.update");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId, userId } = ctx;

  if (amount <= 0) {
    return { error: "Дүн 0-ээс их байх ёстой." };
  }

  // Fetch current balance with lock
  const { data: giftCard, error: fetchError } = await withDbCapture(
    "gift_cards: fetch for topup",
    supabase
      .from("gift_cards")
      .select("code, current_balance")
      .eq("id", giftCardId)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (fetchError || !giftCard) {
    return { error: "Бэлгийн карт олдсонгүй." };
  }

  const balanceBefore = Number(giftCard.current_balance);
  const balanceAfter = balanceBefore + amount;

  // Update balance
  const { error: updateError } = await withDbCapture(
    "gift_cards: topup update balance",
    supabase
      .from("gift_cards")
      .update({ current_balance: balanceAfter })
      .eq("id", giftCardId)
      .eq("organization_id", organizationId),
  );

  if (updateError) {
    return {
      error: `Бэлгийн карт цэнэглэхэд алдаа гарлаа: ${updateError.message}`,
    };
  }

  // Record topup transaction
  const { error: txError } = await withDbCapture(
    "gift_cards: topup transaction",
    supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCardId,
      organization_id: organizationId,
      transaction_type: "topup",
      amount,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      created_by: userId,
    }),
  );

  if (txError) {
    capture(txError, { context: "topUpGiftCard: transaction" });
  }

  after(() =>
    logAuditEventWithClient(
      supabase,
      organizationId,
      userId,
      "updated",
      "gift_card",
      giftCardId,
      { current_balance: { old: balanceBefore, new: balanceAfter } },
      `Бэлгийн карт "${giftCard.code}" цэнэглэсэн: +${amount.toLocaleString()}₮`,
    ),
  );

  revalidateEntities(["gift_cards"]);
  return { success: true as const, error: undefined };
}

// ─── Public redeem check (checkout) ─────────────────────────────────────────

export type GiftCardRedeemResult = {
  valid: boolean;
  redeemable_amount: number;
  gift_card_id: string;
  error?: string;
};

export async function redeemGiftCardCheck(
  code: string,
  organizationId: string,
  saleTotal: number,
): Promise<GiftCardRedeemResult> {
  const ctx = await requireAppContext();
  const { supabase } = ctx;

  if (!code) {
    return {
      valid: false,
      redeemable_amount: 0,
      gift_card_id: "",
      error: "Бэлгийн картын код шаардлагатай.",
    };
  }

  if (!organizationId) {
    return {
      valid: false,
      redeemable_amount: 0,
      gift_card_id: "",
      error: "Байгууллага олдсонгүй.",
    };
  }

  // Fetch gift card by code
  const { data: giftCard, error: gcError } = await withDbCapture(
    "gift_cards: redeem check fetch",
    supabase
      .from("gift_cards")
      .select("id, code, current_balance, expires_at, is_active")
      .eq("code", code)
      .eq("organization_id", organizationId)
      .single(),
  );

  if (gcError || !giftCard) {
    return {
      valid: false,
      redeemable_amount: 0,
      gift_card_id: "",
      error: "Бэлгийн карт олдсонгүй.",
    };
  }

  // Validate: is_active
  if (!giftCard.is_active) {
    return {
      valid: false,
      redeemable_amount: 0,
      gift_card_id: giftCard.id,
      error: "Бэлгийн карт идэвхгүй байна.",
    };
  }

  // Validate: not expired
  if (giftCard.expires_at) {
    const now = new Date();
    const expiresAt = new Date(giftCard.expires_at);
    if (now > expiresAt) {
      return {
        valid: false,
        redeemable_amount: 0,
        gift_card_id: giftCard.id,
        error: "Бэлгийн картын хугацаа дууссан.",
      };
    }
  }

  const currentBalance = Number(giftCard.current_balance);

  // Check: sufficient balance
  if (currentBalance <= 0) {
    return {
      valid: false,
      redeemable_amount: 0,
      gift_card_id: giftCard.id,
      error: "Бэлгийн картын үлдэгдэл дууссан.",
    };
  }

  // Calculate redeemable amount (cannot exceed sale total or current balance)
  const redeemableAmount = Math.min(currentBalance, saleTotal);

  return {
    valid: true,
    redeemable_amount: redeemableAmount,
    gift_card_id: giftCard.id,
  };
}
