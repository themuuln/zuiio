/**
 * Online (storefront) order helpers for the shop sales history.
 *
 * submit_shop_order inserts sales with is_online = true (migration
 * 20260810160000); POS sales keep is_online = false. These pure helpers
 * drive the "Онлайн захиалга" filter and the buyer label shown in the
 * shop history drawer.
 */

export type OnlineSaleFields = {
  is_online: boolean;
  contacts: { name: string } | null;
  store_accounts: { display_name: string | null; email: string } | null;
};

/**
 * Buyer label for a sale row: a signed-in buyer's store account
 * (display name, falling back to email) wins over the guest contact name.
 * Returns null when there is no buyer information at all.
 */
export function onlineBuyerLabel(sale: OnlineSaleFields): string | null {
  if (sale.store_accounts) {
    const account = sale.store_accounts;
    if (account.display_name) return account.display_name;
    return account.email;
  }
  return sale.contacts?.name ?? null;
}

/** Keep only online orders when the "Онлайн захиалга" toggle is active. */
export function filterOnlineSales<T extends { is_online: boolean }>(
  sales: T[],
  onlineOnly: boolean,
): T[] {
  if (!onlineOnly) return sales;
  return sales.filter((sale) => sale.is_online);
}
