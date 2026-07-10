"use client";

import type { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatMongolianPhone, inputProps } from "@/lib/form-ux";

type CustomerType = "individual" | "company";

export const customerEditSchema = z.object({
  type: z.enum(["individual", "company"]),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export type CustomerEditValues = z.infer<typeof customerEditSchema>;

interface CustomerEditFormProps {
  form: UseFormReturn<CustomerEditValues>;
  t: ReturnType<typeof useTranslations<"customers">>;
}

export function CustomerEditForm({ form, t }: CustomerEditFormProps) {
  const watchedType = form.watch("type");

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field className="sm:col-span-2">
        <FieldLabel>{t("type")}</FieldLabel>
        <FieldContent>
          <Select
            value={watchedType}
            onValueChange={(val) => {
              form.setValue("type", val as CustomerType);
            }}
          >
            <SelectTrigger className="w-full h-11" aria-label={t("type")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">{t("individual")}</SelectItem>
              <SelectItem value="company">{t("company")}</SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      {watchedType === "company" ? (
        <>
          <Field>
            <FieldLabel>{t("companyName")}</FieldLabel>
            <FieldContent>
              <Input className="h-11" {...form.register("companyName")} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{t("contactPerson")}</FieldLabel>
            <FieldContent>
              <Input className="h-11" {...form.register("contactPerson")} />
            </FieldContent>
          </Field>
        </>
      ) : (
        <>
          <Field>
            <FieldLabel>{t("firstName")}</FieldLabel>
            <FieldContent>
              <Input className="h-11" {...form.register("firstName")} />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel>{t("lastName")}</FieldLabel>
            <FieldContent>
              <Input className="h-11" {...form.register("lastName")} />
            </FieldContent>
          </Field>
        </>
      )}

      <Field>
        <FieldLabel>{t("phone")}</FieldLabel>
        <FieldContent>
          <Input
            type="tel"
            className="h-11"
            {...inputProps("phone")}
            {...form.register("phone", {
              setValueAs: (v) => formatMongolianPhone(v ?? ""),
            })}
          />
        </FieldContent>
      </Field>
      <Field>
        <FieldLabel>{t("email")}</FieldLabel>
        <FieldContent>
          <Input type="email" className="h-11" {...form.register("email")} />
        </FieldContent>
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel>{t("address")}</FieldLabel>
        <FieldContent>
          <Input className="h-11" {...form.register("address")} />
        </FieldContent>
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel>{t("notes")}</FieldLabel>
        <FieldContent>
          <Textarea rows={4} {...form.register("notes")} />
        </FieldContent>
      </Field>
    </div>
  );
}
