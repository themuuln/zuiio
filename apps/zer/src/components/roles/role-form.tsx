"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { createRole } from "@/app/(dashboard)/settings/roles/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { roleKeys } from "@/lib/query/keys";
import { useOptimisticCreate } from "@/lib/query/use-optimistic";

const schema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  description: z.string().optional(),
});

type Values = z.infer<typeof schema>;

interface RoleFormProps {
  onSuccess?: () => void;
}

export function RoleForm({ onSuccess }: RoleFormProps) {
  const roleMutation = useOptimisticCreate({
    mutationFn: async (formData: FormData) => {
      const result = await createRole(formData);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    queryKey: roleKeys.all,
    buildOptimistic: (formData) => ({
      id: `opt-${Date.now()}`,
      name: formData.get("name")?.toString() ?? "",
      description: formData.get("description")?.toString() || null,
      is_system_role: false,
      hierarchy_level: 99,
    }),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = (data: Values) => {
    if (roleMutation.isPending) return;
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description ?? "");
    roleMutation.mutate(formData, {
      onSuccess: () => {
        onSuccess?.();
        toast.success("Үүрэг амжилттай үүсгэгдлээ.");
      },
    });
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

      {roleMutation.error && (
        <p className="text-sm text-destructive">
          {roleMutation.error instanceof Error
            ? roleMutation.error.message
            : "Алдаа гарлаа."}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || roleMutation.isPending}
        className="w-full"
      >
        {isSubmitting || roleMutation.isPending ? "Үүсгэж байна..." : "Үүсгэх"}
      </Button>
    </form>
  );
}
