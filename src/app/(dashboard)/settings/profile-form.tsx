"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "./actions";
import { useRegisterSave } from "./settings-context";

const profileSchema = z.object({
  full_name: z.string().min(1, "Нэр шаардлагатай."),
});

type ProfileValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  initialFullName: string;
};

export function ProfileForm({ initialFullName }: ProfileFormProps) {
  const {
    register,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialFullName,
    },
  });

  const save = useCallback(async () => {
    const data = getValues();
    const formData = new FormData();
    formData.append("full_name", data.full_name);
    const result = await updateProfile(undefined, formData);
    return result?.error ? { error: result.error } : undefined;
  }, [getValues]);

  useRegisterSave({
    id: "profile",
    label: "Хэрэглэгчийн мэдээлэл",
    save,
    isDirty: () => isDirty,
  });

  return (
    <div className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="full-name">Нэр</FieldLabel>
        <Input
          id="full-name"
          type="text"
          placeholder="Таны нэр"
          {...register("full_name")}
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </Field>
    </div>
  );
}
