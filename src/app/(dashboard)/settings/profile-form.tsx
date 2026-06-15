"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Spinner } from "@phosphor-icons/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateProfile } from "./actions";

const profileSchema = z.object({
  full_name: z.string().min(1, "Нэр шаардлагатай."),
});

type ProfileValues = z.infer<typeof profileSchema>;

type ProfileFormProps = {
  initialFullName: string;
};

export function ProfileForm({ initialFullName }: ProfileFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: initialFullName,
    },
  });

  const onSubmit = async (data: ProfileValues) => {
    setServerError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("full_name", data.full_name);

    const result = await updateProfile(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
