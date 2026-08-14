/**
 * Calculate commission amount for a sale item.
 * Commission is 10% of total_price, rounded to 2 decimal places.
 * Returns 0 for cancelled sales or zero-price items.
 */
export function calculateCommission(totalPrice: number): number {
  if (totalPrice <= 0) return 0;
  return Math.round(totalPrice * 0.1 * 100) / 100;
}

/**
 * Validate payout request parameters.
 * Returns an error message string if validation fails, or null if valid.
 */
export function validatePayoutRequest(params: {
  profileId: string | null;
  selectedItemIds: string[];
}): string | null {
  if (!params.profileId) {
    return "Ажилтан сонгоогүй байна.";
  }
  if (!params.selectedItemIds || params.selectedItemIds.length === 0) {
    return "Төлөх комиссууд сонгоогүй байна.";
  }
  return null;
}

/**
 * Calculate total commission amount from selected items.
 * Returns the sum of all commission amounts.
 */
export function calculatePayoutTotal(
  items: Array<{ commission_amount: number }>,
): number {
  return items.reduce((sum, item) => sum + Number(item.commission_amount), 0);
}

/**
 * Check if any sale_item IDs have already been paid.
 * Returns the IDs that are already paid.
 */
export function getAlreadyPaidIds(
  paidItems: Array<{ sale_item_id: string }>,
  selectedIds: string[],
): string[] {
  const paidIdSet = new Set(paidItems.map((pi) => pi.sale_item_id));
  return selectedIds.filter((id) => paidIdSet.has(id));
}

/**
 * Build a staff commission summary from earned and paid data.
 */
export function buildStaffSummary(params: {
  profileId: string;
  fullName: string;
  totalEarned: number;
  totalPaid: number;
}): {
  profileId: string;
  fullName: string;
  totalEarned: number;
  totalPaid: number;
  totalUnpaid: number;
} {
  const earned = Math.max(0, params.totalEarned);
  const paid = Math.max(0, params.totalPaid);
  return {
    profileId: params.profileId,
    fullName: params.fullName,
    totalEarned: earned,
    totalPaid: paid,
    totalUnpaid: Math.max(0, earned - paid),
  };
}
