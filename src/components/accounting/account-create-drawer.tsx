"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createAccount } from "@/app/(dashboard)/accounting/actions";
import { buttonVariants } from "@/components/ui/button";
import { DrawerFooter, DrawerCancel, DrawerSubmit } from "@/components/ui/drawer-footer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { Switch } from "@/components/ui/switch";
import { ErrorBanner } from "@/components/ui/error-banner";

const accountSchema = z.object({
  code: z.string().min(1, "Код шаардлагатай"),
  name: z.string().min(1, "Нэр шаардлагатай"),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  parent_id: z.string().optional(),
  is_active: z.boolean().default(true),
});

type AccountValues = z.infer<typeof accountSchema>;

const ACCOUNT_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "asset", label: "Хөрөнгө" },
  { value: "liability", label: "Өр төлбөр" },
  { value: "equity", label: "Өмч" },
  { value: "income", label: "Орлого" },
  { value: "expense", label: "Зарлага" },
];

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
};

export function AccountCreateDrawer({
  accounts,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  accounts: AccountRow[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AccountValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      type: "asset",
      parent_id: "",
      is_active: true,
    },
  });

  const selectedType = watch("type");
  const isActive = watch("is_active");

  // Filter parent accounts by same type (or all types)
  const parentOptions = accounts.filter((a) => a.is_active);

  const onSubmit = async (data: AccountValues) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("code", data.code);
    formData.append("name", data.name);
    formData.append("type", data.type);
    formData.append("parent_id", data.parent_id ?? "");
    formData.append("is_active", data.is_active ? "on" : "off");
    const result = await createAccount(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setOpen(false);
      reset();
    }
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setServerError(null);
          reset();
        }
      }}
      title="Шинэ данс"
      description="Дансны код, нэр, төрлийг оруулан шинэ данс үүсгэнэ."
      trigger={
        <button type="button" className={buttonVariants({ variant: "default" })}>
          <Plus className="size-4" />
          Шинэ данс
        </button>
      }
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => { setOpen(false); reset(); }} />
          <DrawerSubmit form="account-form" isPending={isSubmitting} label="Данс үүсгэх" loadingLabel="Үүсгэж байна..." />
        </DrawerFooter>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
        id="account-form"
      >
        <FieldGroup>
          <Field>
            <FieldLabel>Код</FieldLabel>
            <Input
              placeholder="e.g. 1100"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-xs text-destructive">
                {errors.code.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Нэр</FieldLabel>
            <Input
              placeholder="Дансны нэр"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">
                {errors.name.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>Төрөл</FieldLabel>
            <Select
              value={selectedType}
              onValueChange={(value: string) =>
                setValue("type", value as AccountValues["type"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Төрөл сонгох" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive">
                {errors.type.message}
              </p>
            )}
          </Field>

          <Field>
            <FieldLabel>
              Эх данс{" "}
              <span className="text-xs text-muted-foreground">
                (заавал биш)
              </span>
            </FieldLabel>
            <Select
              value={watch("parent_id") ?? ""}
              onValueChange={(value: string) =>
                setValue("parent_id", value || "")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Эх данс сонгох" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Эх дансгүй</SelectItem>
                {parentOptions.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.code} - {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                onCheckedChange={(checked: boolean) =>
                  setValue("is_active", checked)
                }
                id="is_active"
              />
              <FieldLabel htmlFor="is_active" className="mb-0">
                Идэвхтэй
              </FieldLabel>
            </div>
          </Field>
        </FieldGroup>

        <ErrorBanner error={serverError} />
      </form>
    </SlideInDrawer>
  );
}
