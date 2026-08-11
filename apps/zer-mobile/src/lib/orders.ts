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
  delivery_type: "delivery" | "pickup" | null;
  delivery_address: string | null;
  delivery_fee: number | null;
  discount_amount: number | null;
  gift_card_amount: number | null;
  delivery_status: string | null;
  external_tracking_id: string | null;
  contact_email: string | null;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  completed: "Гүйцэтгэсэн",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцалсан",
  refunded: "Буцаагдсан",
  failed: "Амжилтгүй",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Хүргэлт хүлээгдэж буй",
  assigned: "Хүргэгчид хуваарилагдсан",
  in_transit: "Хүргэлтэнд гарсан",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцалсан",
};

export function orderStatusLabel(status: string | null): string {
  if (!status) return "—";
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function deliveryStatusLabel(status: string | null): string {
  if (!status) return "—";
  return DELIVERY_STATUS_LABELS[status] ?? status;
}

export async function fetchMyOrders(client: RpcClient): Promise<MyOrder[]> {
  const { data, error } = await client.rpc("get_my_orders");
  if (error || !data) return [];
  return (data as MyOrder[]) ?? [];
}
