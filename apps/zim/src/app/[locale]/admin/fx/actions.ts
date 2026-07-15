"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/admin";
import { getDb } from "@/lib/db";

const fxSchema = z.coerce.number().min(100).max(100_000);

export async function setFxRateAction(formData: FormData): Promise<void> {
  const session = await assertAdmin();
  const rate = fxSchema.parse(formData.get("rate"));

  await getDb().insertFxRate({
    pair: "USD_MNT",
    rate,
    source: "manual",
    created_by: session.userId === "dev-admin" ? null : session.userId,
  });
  revalidatePath("/", "layout");
}
