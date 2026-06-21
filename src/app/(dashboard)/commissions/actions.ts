"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { withBranchFilter } from "@/lib/branches";
import {
  buildStaffSummary,
  calculatePayoutTotal,
  getAlreadyPaidIds,
  validatePayoutRequest,
} from "@/lib/commissions";
import { requireAppContext } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";
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

/**
 * Get per-staff commission summary for an organization.
 * Returns total earned, paid, and unpaid amounts per staff member.
 */
export async function getCommissionSummary(
  orgId: string,
): Promise<StaffCommissionSummary[]> {
  const { supabase, branchId, isBranchScoped } = await requireAppContext();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", orgId);

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
      const { data: earnedItems } = await supabase
        .from("sale_items")
        .select("commission_amount")
        .in("sale_id", saleIds);

      totalEarned =
        earnedItems?.reduce(
          (sum, item) => sum + Number(item.commission_amount),
          0,
        ) ?? 0;
    }

    // Get total paid: sum of payout_items via payouts for this profile
    const { data: profilePayouts } = await supabase
      .from("commission_payouts")
      .select("id")
      .eq("organization_id", orgId)
      .eq("profile_id", profile.id)
      .eq("status", "completed");

    let totalPaid = 0;
    if (profilePayouts && profilePayouts.length > 0) {
      const payoutIds = profilePayouts.map((p) => p.id);
      const { data: paidItems } = await supabase
        .from("commission_payout_items")
        .select("commission_amount")
        .in("payout_id", payoutIds);

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

/**
 * Get unpaid sale_items for a specific staff member.
 * Only returns items that haven't been paid out yet.
 */
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
    return [];
  }

  // Get IDs of items that have already been paid
  const itemIds = allItems.map((item) => item.id);
  const { data: paidItems } = await supabase
    .from("commission_payout_items")
    .select("sale_item_id")
    .in("sale_item_id", itemIds);

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

/**
 * Get payout history for an organization.
 */
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
    console.error("Error fetching payout history:", error);
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

/**
 * Create a payout for selected sale_items.
 * Validates:
 * - Items are not already paid
 * - Items belong to the same profile/organization
 * - At least one item is selected
 * Cleans up on failure to avoid orphaned records.
 */
export async function createPayout(
  _prevState: CreatePayoutState | undefined,
  formData: FormData,
): Promise<CreatePayoutState | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, branch_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    return { error: "Байгууллага олдсонгүй." };
  }

  const orgId = profile.organization_id;
  const profileId = formData.get("profile_id") as string;
  const notes = (formData.get("notes") as string) || "";

  // Get selected item IDs from form data
  const selectedItems: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (key === "sale_item_ids" && typeof value === "string") {
      selectedItems.push(value);
    }
  }

  // Validate payout request
  const validationError = validatePayoutRequest({
    profileId,
    selectedItemIds: selectedItems,
  });
  if (validationError) {
    return { error: validationError };
  }

  // Validate the sale_items exist, belong to org, and have commission
  const { data: profileSales } = await supabase
    .from("sales")
    .select("id")
    .eq("organization_id", orgId)
    .eq("salesperson_id", profileId)
    .not("status", "eq", "cancelled");

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
  const { data: paidItems } = await supabase
    .from("commission_payout_items")
    .select("sale_item_id")
    .in("sale_item_id", selectedItems);

  const alreadyPaidIds = getAlreadyPaidIds(paidItems ?? [], selectedItems);
  if (alreadyPaidIds.length > 0) {
    return {
      error: `Зарим комисс аль хэдийн төлөгдсөн байна. (${alreadyPaidIds.length} ш)`,
    };
  }

  // Calculate total amount
  const totalAmount = calculatePayoutTotal(items);

  // Determine branch for the payout
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("branch_id")
    .eq("id", profileId)
    .single();

  let payoutBranchId: string | null =
    targetProfile?.branch_id ?? profile.branch_id;

  if (!payoutBranchId) {
    const { data: fallbackBranch } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", orgId)
      .order("name")
      .limit(1)
      .maybeSingle();
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
    console.error("Error creating payout:", payoutError);
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
    console.error("Error inserting payout items:", itemsInsertError);

    // Cleanup: delete the payout if items failed (best-effort rollback)
    await supabase.from("commission_payouts").delete().eq("id", payout.id);

    return {
      error:
        "Төлөлтийн дэлгэрэнгүй мэдээлэл хадгалахад алдаа гарлаа. Гүйлгээ буцаагдлаа.",
    };
  }

  revalidatePath("/commissions");
  return undefined;
}
