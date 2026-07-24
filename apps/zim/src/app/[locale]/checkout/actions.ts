"use server";

import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { createOrderWithInvoice } from "@/lib/orders";

const checkoutSchema = z.object({
  packageId: z.string().min(1),
  email: z.string().email(),
  phone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "phone must be 8 digits"),
  locale: z.enum(["mn", "en"]),
});

export interface CheckoutState {
  error?: "invalid_email" | "invalid_phone" | "generic";
}

export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    packageId: formData.get("packageId"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    const fields = parsed.error.issues.map((issue) => issue.path[0]);
    if (fields.includes("email")) return { error: "invalid_email" };
    if (fields.includes("phone")) return { error: "invalid_phone" };
    return { error: "generic" };
  }

  let orderCode: string;
  try {
    const result = await createOrderWithInvoice({
      packageId: parsed.data.packageId,
      email: parsed.data.email,
      phone: parsed.data.phone,
      locale: parsed.data.locale,
    });
    orderCode = result.orderCode;
  } catch (error) {
    console.error("checkout failed", error);
    return { error: "generic" };
  }

  redirect({ href: `/pay/${orderCode}`, locale: parsed.data.locale });
  return {};
}
