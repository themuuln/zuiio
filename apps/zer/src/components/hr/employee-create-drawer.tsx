"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createEmployee } from "@/app/(dashboard)/hr/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";

const employeeSchema = z.object({
  full_name: z.string().min(1, "Нэр шаардлагатай"),
  position: z.string().optional(),
  department: z.string().optional(),
  hire_date: z.string().min(1, "Огноо шаардлагатай"),
  contract_type: z.string().min(1),
  base_salary: z.coerce
    .number()
    .min(792_000, "Хөдөлмөрийн хөлсний доод хэмжээ ₮792,000"),
  salary_type: z.string().min(1),
  bank_account: z.string().optional(),
});

type EmployeeValues = z.input<typeof employeeSchema>;

export function EmployeeCreateDrawer() {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: "",
      contract_type: "permanent",
      salary_type: "monthly",
      hire_date: new Date().toISOString().slice(0, 10),
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (data: EmployeeValues) => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append("full_name", data.full_name);
    if (data.position) formData.append("position", data.position);
    if (data.department) formData.append("department", data.department);
    formData.append("hire_date", data.hire_date);
    formData.append("contract_type", data.contract_type);
    formData.append("base_salary", String(data.base_salary));
    formData.append("salary_type", data.salary_type);
    if (data.bank_account) formData.append("bank_account", data.bank_account);

    const result = (await createEmployee(undefined, formData)) as
      | { error?: string }
      | undefined;
    setSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    reset();
    toast.success("Ажилтан амжилттай бүртгэгдлээ.");
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
      title="Ажилтан бүртгэх"
      description="Шинэ ажилтны мэдээллийг бүртгэх"
      trigger={
        <button
          type="button"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="size-4" />
          Ажилтан бүртгэх
        </button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => setOpen(false)} />
          <DrawerSubmit
            form="employee-form"
            isPending={isSubmitting || submitting}
          />
        </DrawerFooter>
      }
    >
      <form
        id="employee-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FieldGroup>
          <Field>
            <Label>Нэр</Label>
            <Input
              placeholder="Бат-Эрдэнэ Даваажанцан"
              {...register("full_name")}
            />
            {errors.full_name && (
              <p className="text-xs text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Албан тушаал</Label>
              <Input placeholder="Кассчин" {...register("position")} />
            </Field>
            <Field>
              <Label>Хэлтэс</Label>
              <Input placeholder="Борлуулалт" {...register("department")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label>Ажилд орсон огноо</Label>
              <Input type="date" {...register("hire_date")} />
              {errors.hire_date && (
                <p className="text-xs text-destructive">
                  {errors.hire_date.message}
                </p>
              )}
            </Field>
            <Field>
              <Label>Гэрээний төрөл</Label>
              <Select
                defaultValue="permanent"
                onValueChange={(value) =>
                  setValue("contract_type", value ?? "permanent")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Байнгын</SelectItem>
                  <SelectItem value="temporary">Түр</SelectItem>
                  <SelectItem value="contract">Гэрээт</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <Label>Цалингийн төрөл</Label>
              <Select
                defaultValue="monthly"
                onValueChange={(value) =>
                  setValue("salary_type", value ?? "monthly")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Сар</SelectItem>
                  <SelectItem value="daily">Өдөр</SelectItem>
                  <SelectItem value="hourly">Цаг</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field>
            <Label>Дансны дугаар</Label>
            <Input placeholder="5000000000" {...register("bank_account")} />
          </Field>
        </FieldGroup>
      </form>
    </SlideInDrawer>
  );
}
