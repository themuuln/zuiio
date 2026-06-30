"use server";

import { requireActionContext } from "@/lib/action-utils";
import { revalidateEntity } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";

export async function createEmployee(_prevState: unknown, formData: FormData) {
  const ctx = await requireActionContext("settings.manage" as never);
  if ("error" in ctx) return ctx;
  const supabase = await createClient();
  const organizationId = ctx.organizationId;

  const fullName = formData.get("full_name")?.toString().trim();
  if (!fullName) return { error: "Нэр шаардлагатай." };

  const baseSalary = Number(formData.get("base_salary"));
  if (!baseSalary || baseSalary < 792_000) {
    return {
      error: "Цалин хөдөлмөрийн хөлсний доод хэмжээнээс бага байж болохгүй.",
    };
  }

  const { error } = await supabase.from("employees" as never).insert({
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
  } as never);

  if (error) return { error: error.message };
  revalidateEntity("hr" as never);
  return { success: true };
}

export async function updateEmployee(_prevState: unknown, formData: FormData) {
  const ctx = await requireActionContext("settings.manage" as never);
  if ("error" in ctx) return ctx;
  const supabase = await createClient();

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Ажилтан тодорхойгүй байна." };

  const updates: Record<string, string | number | null> = {};
  const fields = [
    "full_name",
    "position",
    "department",
    "contract_type",
    "salary_type",
    "bank_account",
    "branch_id",
  ];
  for (const field of fields) {
    const val = formData.get(field)?.toString();
    if (val) updates[field] = val;
  }
  const baseSalary = formData.get("base_salary")?.toString();
  if (baseSalary) updates.base_salary = Number(baseSalary);
  const hireDate = formData.get("hire_date")?.toString();
  if (hireDate) updates.hire_date = hireDate;

  const { error } = await supabase
    .from("employees" as never)
    .update(updates as never)
    .eq("id" as never, id);

  if (error) return { error: error.message };
  revalidateEntity("hr" as never);
  return { success: true };
}

export async function deleteEmployee(formData: FormData) {
  const ctx = await requireActionContext("settings.manage" as never);
  if ("error" in ctx) return ctx;
  const supabase = await createClient();

  const id = formData.get("id")?.toString();
  if (!id) return { error: "Ажилтан тодорхойгүй байна." };

  const { error } = await supabase
    .from("employees" as never)
    .delete()
    .eq("id" as never, id);
  if (error) return { error: error.message };
  revalidateEntity("hr" as never);
  return { success: true };
}
