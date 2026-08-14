"use server";

import { capture } from "@zuiio/capture";
import { revalidatePath } from "next/cache";
import { requireActionContext } from "@/lib/action-utils";
import { withBranchFilter } from "@/lib/branches";
import {
  buildStaffSummary,
  calculatePayoutTotal,
  getAlreadyPaidIds,
  validatePayoutRequest,
} from "@/lib/commissions";
import { requireAppContext } from "@/lib/erp";
import type { Database } from "@/lib/supabase/types";

type SaleItemRow = Database["public"]["Tables"]["sale_items"]["Row"];

export type StaffCommissionSummary = {
  profileId: string;
  fullName: string;
  totalEarned: number;
  totalPaid: number;
  totalUnpaid: number;
};

export type UnpaidSaleItem = Pick<
  SaleItemRow,
  "id" | "sale_id" | "total_price" | "commission_amount"
> & {
  sale_date: string;
  sale_status: string | null;
};

export type PayoutRecord = {
  id: string;
  profile_id: string;
  profile_name: string | null;
  paid_at: string;
  paid_by: string;
  paid_by_name: string | null;
  total_amount: number;
  notes: string | null;
  status: string;
  item_count: number;
  created_at: string | null;
};

export async function getCommissionSummary(
  orgId: string,
): Promise<StaffCommissionSummary[]> {
  const { supabase, branchId, isBranchScoped } = await requireAppContext();

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", orgId);

  if (profilesError) {
    capture(profilesError, {
      context: "commissions: fetch profiles in summary",
    });
    return [];
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  const summary: StaffCommissionSummary[] = [];

  for (const profile of profiles) {
    // Get total earned: sum of commission_amount from non-cancelled sales
    let salesQuery = supabase
      .from("sales")
      .select("id")
      .eq("organization_id", orgId)
      .eq("salesperson_id", profile.id)
      .not("status", "eq", "cancelled");

    salesQuery = withBranchFilter(salesQuery, branchId, isBranchScoped);

    const { data: profileSales } = await salesQuery;

    let totalEarned = 0;
    if (profileSales && profileSales.length > 0) {
      const saleIds = profileSales.map((s) => s.id);
      const { data: earnedItems, error: earnedError } = await supabase
        .from("sale_items")
        .select("commission_amount")
        .in("sale_id", saleIds);
      if (earnedError)
        capture(earnedError, { context: "commissions: fetch earned items" });

      totalEarned =
        earnedItems?.reduce(
          (sum, item) => sum + Number(item.commission_amount),
          0,
        ) ?? 0;
    }

    // Get total paid: sum of payout_items via payouts for this profile
    const { data: profilePayouts, error: payoutsError } = await supabase
      .from("commission_payouts")
      .select("id")
      .eq("organization_id", orgId)
      .eq("profile_id", profile.id)
      .eq("status", "completed");
    if (payoutsError)
      capture(payoutsError, { context: "commissions: fetch profile payouts" });

    let totalPaid = 0;
    if (profilePayouts && profilePayouts.length > 0) {
      const payoutIds = profilePayouts.map((p) => p.id);
      const { data: paidItems, error: paidItemsError } = await supabase
        .from("commission_payout_items")
        .select("commission_amount")
        .in("payout_id", payoutIds);
      if (paidItemsError)
        capture(paidItemsError, {
          context: "commissions: fetch paid items from payouts",
        });

      totalPaid =
        paidItems?.reduce(
          (sum, item) => sum + Number(item.commission_amount),
          0,
        ) ?? 0;
    }

    summary.push(
      buildStaffSummary({
        profileId: profile.id,
        fullName: profile.full_name ?? "Unknown",
        totalEarned,
        totalPaid,
      }),
    );
  }

  // Only return profiles that have earned commission
  return summary.filter((s) => s.totalEarned > 0);
}

export async function getUnpaidItems(
  orgId: string,
  profileId: string,
): Promise<UnpaidSaleItem[]> {
  const { supabase, branchId, isBranchScoped } = await requireAppContext();

  // First, get all sale IDs for this profile's non-cancelled sales
  let salesQuery = supabase
    .from("sales")
    .select("id, sale_date, status")
    .eq("organization_id", orgId)
    .eq("salesperson_id", profileId)
    .not("status", "eq", "cancelled");

  salesQuery = withBranchFilter(salesQuery, branchId, isBranchScoped);

  const { data: profileSales } = await salesQuery;

  if (!profileSales || profileSales.length === 0) {
    return [];
  }

  const saleIds = profileSales.map((s) => s.id);

  // Get all sale_items with commission > 0 for these sales
  const { data: allItems, error } = await supabase
    .from("sale_items")
    .select("id, sale_id, total_price, commission_amount")
    .in("sale_id", saleIds)
    .gt("commission_amount", 0);
  if (error || !allItems || allItems.length === 0) {
    if (error) {
      capture(error, { context: "commissions: fetch unpaid items" });
    }
    return [];
  }

  // Get IDs of items that have already been paid
  const itemIds = allItems.map((item) => item.id);
  const { data: paidItems, error: paidItemsError } = await supabase
    .from("commission_payout_items")
    .select("sale_item_id")
    .in("sale_item_id", itemIds);
  if (paidItemsError)
    capture(paidItemsError, { context: "commissions: fetch paid item ids" });

  const paidItemIds = new Set(paidItems?.map((pi) => pi.sale_item_id) ?? []);

  // Build a map for quick sale lookup
  const saleMap = new Map(
    profileSales.map((s) => [s.id, { date: s.sale_date, status: s.status }]),
  );

  // Filter out paid items
  const unpaidItems = allItems
    .filter((item) => !paidItemIds.has(item.id))
    .map((item) => {
      const sale = saleMap.get(item.sale_id);
      return {
        id: item.id,
        sale_id: item.sale_id,
        total_price: Number(item.total_price),
        commission_amount: Number(item.commission_amount),
        sale_date: sale?.date ?? "",
        sale_status: sale?.status ?? null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
    );

  return unpaidItems;
}

export async function getPayoutHistory(orgId: string): Promise<PayoutRecord[]> {
  const { supabase, branchId, isBranchScoped } = await requireAppContext();

  let query = supabase
    .from("commission_payouts")
    .select(
      `
      id,
      profile_id,
      paid_at,
      paid_by,
      total_amount,
      notes,
      status,
      created_at,
      profile_profiles:profiles!commission_payouts_profile_id_fkey(full_name),
      payer_profiles:profiles!commission_payouts_paid_by_fkey(full_name)
    `,
    )
    .eq("organization_id", orgId)
    .order("paid_at", { ascending: false });

  query = withBranchFilter(query, branchId, isBranchScoped);

  const { data, error } = await query;

  if (error) {
    capture(error, { context: "commissions: fetch payout history" });
    return [];
  }

  // Get item counts for each payout
  const payouts = await Promise.all(
    (data ?? []).map(async (payout) => {
      const { count } = await supabase
        .from("commission_payout_items")
        .select("id", { count: "exact", head: true })
        .eq("payout_id", payout.id);

      const profileData = payout.profile_profiles as {
        full_name?: string | null;
      } | null;
      const payerData = payout.payer_profiles as {
        full_name?: string | null;
      } | null;

      return {
        id: payout.id,
        profile_id: payout.profile_id,
        profile_name: profileData?.full_name ?? null,
        paid_at: payout.paid_at,
        paid_by: payout.paid_by,
        paid_by_name: payerData?.full_name ?? null,
        total_amount: Number(payout.total_amount),
        notes: payout.notes,
        status: payout.status,
        item_count: count ?? 0,
        created_at: payout.created_at,
      };
    }),
  );

  return payouts;
}

export type CreatePayoutState = {
  error?: string;
};

export async function createPayout(
  _prevState: CreatePayoutState | undefined,
  formData: FormData,
): Promise<CreatePayoutState | undefined> {
  const ctx = await requireActionContext("accounting.manage");
  if ("error" in ctx) return ctx;

  const supabase = ctx.supabase;
  const user = ctx.user;
  const orgId = ctx.organizationId;
  const profileId = formData.get("profile_id") as string;
  const notes = (formData.get("notes") as string) || "";

  // Get selected item IDs from form data
  const selectedItems = formData
    .getAll("sale_item_ids")
    .filter((v): v is string => typeof v === "string");

  // Validate payout request
  const validationError = validatePayoutRequest({
    profileId,
    selectedItemIds: selectedItems,
  });
  if (validationError) {
    return { error: validationError };
  }

  // Validate the sale_items exist, belong to org, and have commission
  const { data: profileSales, error: profileSalesError } = await supabase
    .from("sales")
    .select("id")
    .eq("organization_id", orgId)
    .eq("salesperson_id", profileId)
    .not("status", "eq", "cancelled");
  if (profileSalesError)
    capture(profileSalesError, {
      context: "commissions: fetch profile sales for validation",
    });

  if (!profileSales || profileSales.length === 0) {
    return { error: "Энэ ажилтанд комисс олдсонгүй." };
  }

  const validSaleIds = new Set(profileSales.map((s) => s.id));

  const { data: items, error: itemsError } = await supabase
    .from("sale_items")
    .select("id, commission_amount, sale_id")
    .in("id", selectedItems)
    .gt("commission_amount", 0);

  if (itemsError || !items || items.length === 0) {
    return { error: "Сонгосон комиссуудын мэдээлэл олдсонгүй." };
  }

  // Verify all items belong to valid sales for this profile
  const allBelongToProfile = items.every((item) =>
    validSaleIds.has(item.sale_id),
  );
  if (!allBelongToProfile) {
    return {
      error:
        "Зарим комисс тооцоонд тохирохгүй байна. (аль хэдийн төлсөн эсвэл өөр ажилтанд хамаарах)",
    };
  }

  // Check if any items are already paid (double-payment prevention)
  const { data: paidItems, error: paidCheckError } = await supabase
    .from("commission_payout_items")
    .select("sale_item_id")
    .in("sale_item_id", selectedItems);
  if (paidCheckError)
    capture(paidCheckError, {
      context: "commissions: check double-payment items",
    });

  const alreadyPaidIds = getAlreadyPaidIds(paidItems ?? [], selectedItems);
  if (alreadyPaidIds.length > 0) {
    return {
      error: `Зарим комисс аль хэдийн төлөгдсөн байна. (${alreadyPaidIds.length} ш)`,
    };
  }

  // Calculate total amount
  const totalAmount = calculatePayoutTotal(items);

  // Determine branch for the payout
  const { data: targetProfile, error: targetProfileError } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", profileId)
    .single();
  if (targetProfileError)
    capture(targetProfileError, {
      context: "commissions: fetch target profile branch",
    });

  let payoutBranchId: string | null = targetProfile?.branch_id ?? ctx.branchId;

  if (!payoutBranchId) {
    const { data: fallbackBranch, error: fallbackError } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", orgId)
      .order("name")
      .limit(1)
      .maybeSingle();
    if (fallbackError)
      capture(fallbackError, { context: "commissions: fetch fallback branch" });
    payoutBranchId = fallbackBranch?.id ?? null;
  }

  if (!payoutBranchId) {
    return { error: "Салбар олдсонгүй. Эхлээд салбар үүсгэнэ үү." };
  }

  // Create payout record
  const { data: payout, error: payoutError } = await supabase
    .from("commission_payouts")
    .insert({
      organization_id: orgId,
      profile_id: profileId,
      paid_by: user.id,
      total_amount: totalAmount,
      notes: notes || null,
      status: "completed",
      paid_at: new Date().toISOString(),
      branch_id: payoutBranchId as string,
    })
    .select("id")
    .single();

  if (payoutError || !payout) {
    capture(payoutError, { context: "commissions: create payout" });
    return { error: "Төлөлт үүсгэхэд алдаа гарлаа." };
  }

  // Insert payout items
  const payoutItems = items.map((item) => ({
    payout_id: payout.id,
    sale_item_id: item.id,
    commission_amount: Number(item.commission_amount),
  }));

  const { error: itemsInsertError } = await supabase
    .from("commission_payout_items")
    .insert(payoutItems);

  if (itemsInsertError) {
    capture(itemsInsertError, { context: "commissions: insert payout items" });

    // Cleanup: delete the payout if items failed (best-effort rollback)
    await supabase
      .from("commission_payouts")
      .delete()
      .eq("id", payout.id)
      .eq("organization_id", orgId);

    return {
      error:
        "Төлөлтийн дэлгэрэнгүй мэдээлэл хадгалахад алдаа гарлаа. Гүйлгээ буцаагдлаа.",
    };
  }

  revalidatePath("/commissions");
  return undefined;
}
