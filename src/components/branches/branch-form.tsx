"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { branchSchema as sharedBranchSchema } from "@/lib/validation/branch-schema";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useCreateBranch } from "@/lib/queries/use-create-branch";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Branch, CreateBranchParams } from "@/lib/types";

// ── Schema ───────────────────────────────────────────────────
// Import shared branch schema — override phone to accept any string
// (form validates phone in API call, not client-side).

const branchSchema = sharedBranchSchema.extend({
  phone: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

// ── Component ────────────────────────────────────────────────

export type BranchFormProps = {
  onSuccess?: (branch: Branch) => void;
  onCancel?: () => void;
  /** When true, render a <div> instead of <form> to avoid nested form HTML. */
  disableFormWrapper?: boolean;
};

export function BranchForm({
  onSuccess,
  onCancel,
  disableFormWrapper,
}: BranchFormProps) {
  const t = useTranslations();
  const { data: orgInfo } = useCurrentOrg();
  const orgId = orgInfo?.orgId;
  const createBranch = useCreateBranch(orgId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
    },
  });

  const onSubmit = async (values: BranchFormValues) => {
    try {
      const params: CreateBranchParams = {
        name: values.name,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
      };
      const branch = await createBranch.mutateAsync(params);
      toast.dismiss();
      toast.success(t("common.saved"));
      onSuccess?.(branch);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create branch",
      );
    }
  };

  const formContent = (
    <FieldGroup>
      <Field>
        <FieldLabel>{t("settings.branchName")}</FieldLabel>
        <FieldContent>
          <Input
            {...register("name")}
            placeholder={t("settings.branchNamePlaceholder")}
          />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("settings.branchAddress")}</FieldLabel>
        <FieldContent>
          <Input
            {...register("address")}
            placeholder={t("settings.branchAddressPlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("settings.branchPhone")}</FieldLabel>
        <FieldContent>
          <Input
            {...register("phone")}
            placeholder={t("settings.branchPhonePlaceholder")}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldLabel>{t("settings.branchEmail")}</FieldLabel>
        <FieldContent>
          <Input
            {...register("email")}
            type="email"
            placeholder={t("settings.branchEmailPlaceholder")}
          />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </FieldContent>
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("common.saving")}
            </>
          ) : (
            t("common.save")
          )}
        </Button>
      </div>
    </FieldGroup>
  );

  if (disableFormWrapper) {
    return formContent;
  }

  return <form onSubmit={handleSubmit(onSubmit)}>{formContent}</form>;
}
