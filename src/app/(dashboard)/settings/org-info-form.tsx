"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateOrganization } from "./actions";
import { useRegisterSave } from "./settings-context";

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
  const {
    register,
    getValues,
    formState: { errors, isDirty },
  } = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: initialName,
      slug: initialSlug,
    },
  });

  const save = useCallback(async () => {
    const data = getValues();
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("slug", data.slug);
    const result = await updateOrganization(undefined, formData);
    return result?.error ? { error: result.error } : undefined;
  }, [getValues]);

  useRegisterSave({
    id: "org-info",
    label: "Байгууллагын мэдээлэл",
    save,
    isDirty: () => isDirty,
  });

  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
}
