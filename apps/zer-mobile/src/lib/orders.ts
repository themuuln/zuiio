import type { RpcClient } from "@/lib/client";

/**
 * Buyer order history — calls the same `get_my_orders()` SECURITY DEFINER
 * RPC the web storefront's order history uses. Filtering is pinned to
 * auth.uid() inside the function, so results are always the caller's own.
 */

export interface MyOrderItem {
  product_id: string | null;
  name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface MyOrder {
  id: string;
  invoice_number: string | null;
  total_amount: number;
  status: string | null;
  created_at: string | null;
  items: MyOrderItem[];
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  completed: "Гүйцэтгэсэн",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцалсан",
  refunded: "Буцаагдсан",
  failed: "Амжилтгүй",
};

export function orderStatusLabel(status: string | null): string {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status] ?? status;
}

export async function fetchMyOrders(client: RpcClient): Promise<MyOrder[]> {
  const { data, error } = await client.rpc("get_my_orders");
  if (error || !data) return [];
  return (data as MyOrder[]) ?? [];
}
