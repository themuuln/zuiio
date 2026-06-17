"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createRole } from "@/app/(dashboard)/settings/roles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface RoleFormProps {
  onSuccess?: () => void;
}

export function RoleForm({ onSuccess }: RoleFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Values) => {
    setServerError(null);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    const result = await createRole(formData);
    if (result?.error) {
      setServerError(result.error);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
      <div className="space-y-2">
        <Label htmlFor="name">Үүргийн нэр</Label>
        <Input id="name" {...register("name")} placeholder="Жишээ: Менежер" />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Тайлбар</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Тайлбар (заавал биш)"
          rows={3}
        />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Үүсгэж байна..." : "Үүсгэх"}
      </Button>
    </form>
  );
}
