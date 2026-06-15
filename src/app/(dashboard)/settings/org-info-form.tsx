"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Spinner } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateOrganization } from "./actions";

const orgSchema = z.object({
  name: z.string().min(1, "Байгууллагын нэр шаардлагатай."),
  slug: z
    .string()
    .min(3, "Холбоос хамгийн багадаа 3 тэмдэгттэй байна.")
    .regex(
      /^[a-z0-9-]+$/,
      "Холбоос зөвхөн англи үсэг, тоо, зураас агуулсан байна.",
    ),
});

type OrgValues = z.infer<typeof orgSchema>;

type OrgInfoFormProps = {
  initialName: string;
  initialSlug: string;
};

export function OrgInfoForm({ initialName, initialSlug }: OrgInfoFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: initialName,
      slug: initialSlug,
    },
  });

  const onSubmit = async (data: OrgValues) => {
    setServerError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("slug", data.slug);

    const result = await updateOrganization(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="org-name">Байгууллагын нэр</FieldLabel>
          <Input
            id="org-name"
            type="text"
            placeholder="Байгууллагын нэр"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="org-slug">Холбоос (slug)</FieldLabel>
          <Input
            id="org-slug"
            type="text"
            placeholder="my-organization"
            {...register("slug")}
          />
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug.message}</p>
          )}
        </Field>
      </div>

      {serverError && (
        <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} size="sm">
          {isSubmitting ? (
            <>
              <Spinner className="size-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            "Хадгалах"
          )}
        </Button>
        {success && (
          <span className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-500">
            <Check className="size-4" />
            Амжилттай хадгалсан
          </span>
        )}
      </div>
    </form>
  );
}
