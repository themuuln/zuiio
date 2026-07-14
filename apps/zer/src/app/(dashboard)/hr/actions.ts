"use server";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";
import type { Database } from "@/lib/supabase/types";
import { capture } from "@zuiio/capture";

export async function createEmployee(_prevState: unknown, formData: FormData) {
  const MINIMUM_WAGE = 792_000;
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase } = ctx;
  const organizationId = ctx.organizationId;

  const fullName = formData.get("full_name")?.toString().trim();
  if (!fullName) return { error: "Нэр шаардлагатай." };

  const baseSalary = Number(formData.get("base_salary"));
  if (!baseSalary || baseSalary < MINIMUM_WAGE) {
    return {
      error: "Цалин хөдөлмөрийн хөлсний доод хэмжээнээс бага байж болохгүй.",
    };
  }

  const { error } = await supabase.from("employees").insert({
    organization_id: organizationId,
    full_name: fullName,
    position: formData.get("position")?.toString() || null,
    department: formData.get("department")?.toString() || null,
    hire_date:
      formData.get("hire_date")?.toString() ||
      new Date().toISOString().slice(0, 10),
    contract_type: formData.get("contract_type")?.toString() || "permanent",
    base_salary: baseSalary,
    salary_type: formData.get("salary_type")?.toString() || "monthly",
    bank_account: formData.get("bank_account")?.toString() || null,
    branch_id: formData.get("branch_id")?.toString() || null,
  });

  if (error) {
    capture(error, { context: "hr: createEmployee" });
    return { error: error.message };
  }
  revalidateEntity("hr");
  return { success: true };
}

export async function updateEmployee(_prevState: unknown, formData: FormData) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Ажилтан тодорхойгүй байна." };
  const updates: Partial<Database["public"]["Tables"]["employees"]["Update"]> =
    {};
  const stringFields = [
    "full_name",
    "position",
    "department",
    "contract_type",
    "salary_type",
    "bank_account",
    "branch_id",
  ] as const satisfies readonly (keyof Database["public"]["Tables"]["employees"]["Update"])[];
  for (const field of stringFields) {
    const val = formData.get(field)?.toString();
    if (val) updates[field] = val;
  }
  const baseSalary = formData.get("base_salary")?.toString();
  if (baseSalary) updates.base_salary = Number(baseSalary);
  const hireDate = formData.get("hire_date")?.toString();
  if (hireDate) updates.hire_date = hireDate;

  const { error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (error) {
    capture(error, { context: "hr: updateEmployee" });
    return { error: error.message };
  }
  revalidateEntity("hr");
  return { success: true };
}

export async function deleteEmployee(formData: FormData) {
  const ctx = await requireActionContext("settings.manage");
  if ("error" in ctx) return ctx;
  const { supabase, organizationId } = ctx;

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Ажилтан тодорхойгүй байна." };

  const { error } = await supabase.from("employees").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) {
    capture(error, { context: "hr: deleteEmployee" });
    return { error: error.message };
  }
  revalidateEntity("hr");
  return { success: true };
}
