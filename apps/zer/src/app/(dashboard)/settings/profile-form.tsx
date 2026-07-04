"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "./actions";
import { useRegisterSave, useSettings } from "./settings-context";

const profileSchema = z.object({
  full_name: z.string().min(1, "Нэр шаардлагатай."),
});

type ProfileValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  initialFullName: string;
};

export function ProfileForm({ initialFullName }: ProfileFormProps) {
  const { notify } = useSettings();
  const initial = useRef(initialFullName);

  const {
    register,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialFullName,
    },
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional — only subscribe once on mount
  useEffect(() => {
    const { unsubscribe } = watch(() => notify());
    return unsubscribe;
  }, []);

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
    getChanges: () => {
      const data = getValues();
      if (data.full_name !== initial.current)
        return [
          {
            field: "Нэр",
            from: initial.current,
            to: data.full_name,
          },
        ];
      return [];
    },
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
