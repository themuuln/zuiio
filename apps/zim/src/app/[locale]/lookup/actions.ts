"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { findOrderByCodeAndPhone } from "@/lib/orders";
import { orderAccessToken } from "@/lib/token";

export interface LookupState {
  error?: "not_found";
}

export async function lookupAction(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const orderCode = String(formData.get("orderCode") ?? "");
  const phone = String(formData.get("phone") ?? "");

  const order = await findOrderByCodeAndPhone(orderCode, phone);
  if (!order) return { error: "not_found" };

  const locale = await getLocale();
  redirect({
    href: `/orders/${order.order_code}?t=${orderAccessToken(order.order_code)}`,
    locale,
  });
  return {};
}
