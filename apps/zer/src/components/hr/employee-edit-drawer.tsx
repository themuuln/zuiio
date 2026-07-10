"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateEmployee } from "@/app/(dashboard)/hr/actions";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

type EmployeeData = {
  id: string;
  full_name: string;
  position: string | null;
  department: string | null;
  base_salary: number;
  bank_account: string | null;
};

const editSchema = z.object({
  full_name: z.string().min(1, "Нэр шаардлагатай"),
  position: z.string().optional(),
  department: z.string().optional(),
  base_salary: z.coerce.number().min(792_000),
  bank_account: z.string().optional(),
});

type EditValues = z.input<typeof editSchema>;

export function EmployeeEditDrawer({
  employee,
  open,
  onOpenChange,
}: {
  employee: EmployeeData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({
    resolver: zodResolver(editSchema),
  });

  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      reset({
        full_name: employee.full_name,
        position: employee.position ?? "",
        department: employee.department ?? "",
        base_salary: employee.base_salary,
        bank_account: employee.bank_account ?? "",
      });
    }
  }, [open, employee, reset]);

  const onSubmit = async (data: EditValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("id", employee.id);
    formData.append("full_name", data.full_name);
    if (data.position) formData.append("position", data.position);
    if (data.department) formData.append("department", data.department);
    formData.append("base_salary", String(data.base_salary));
    if (data.bank_account) formData.append("bank_account", data.bank_account);

    const result = (await updateEmployee(undefined, formData)) as
      | { error?: string }
      | undefined;
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    onOpenChange(false);
    toast.success("Ажилтны мэдээлэл шинэчлэгдлээ.");
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
      title="Ажилтан засварлах"
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit form="employee-edit-form" isPending={isSubmitting} />
        </DrawerFooter>
      }
    >
      <form
        id="employee-edit-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <Field>
          <Label>Нэр</Label>
          <Input {...register("full_name")} />
          {errors.full_name && (
            <p className="text-xs text-destructive">
              {errors.full_name.message}
            </p>
          )}
        </Field>
        <Field>
          <Label>Албан тушаал</Label>
          <Input {...register("position")} />
        </Field>
        <Field>
          <Label>Хэлтэс</Label>
          <Input {...register("department")} />
        </Field>
        <Field>
          <Label>Үндсэн цалин (₮)</Label>
          <Input
            type="number"
            min={792_000}
            step={1000}
            {...register("base_salary")}
          />
          {errors.base_salary && (
            <p className="text-xs text-destructive">
              {errors.base_salary.message}
            </p>
          )}
        </Field>
        <Field>
          <Label>Дансны дугаар</Label>
          <Input {...register("bank_account")} />
        </Field>
        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}
      </form>
    </SlideInDrawer>
  );
}
