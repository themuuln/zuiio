"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimple } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRegisterSave } from "./settings-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";

const smtpSchema = z.object({
  host: z.string().min(1, "Сервер шаардлагатай."),
  port: z.number().int().min(1).max(65535, "Портын утга буруу байна."),
  username: z.string().min(1, "Хэрэглэгчийн нэр шаардлагатай."),
  password: z.string().min(1, "Нууц үг шаардлагатай."),
  from_email: z.string().email("Зөв и-мэйл хаяг оруулна уу."),
  from_name: z.string().optional(),
});

type SmtpValues = z.infer<typeof smtpSchema>;

interface SmtpConfigData {
  id: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string | null;
  is_active: boolean;
}

async function fetchSmtpConfig(): Promise<SmtpConfigData | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("smtp_configs")
    .select("*")
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as unknown as SmtpConfigData;
}

async function saveSmtpConfigClient(
  values: SmtpValues & { config_id?: string },
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нэвтрээгүй");

  const payload = {
    host: values.host,
    port: values.port,
    username: values.username,
    password: values.password,
    from_email: values.from_email,
    from_name: values.from_name || null,
  };

  if (values.config_id) {
    const { error } = await supabase
      .from("smtp_configs")
      .update(payload)
      .eq("id", values.config_id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("smtp_configs").insert({
      ...payload,
      is_active: true,
      priority: 0,
    });
    if (error) throw new Error(error.message);
  }
}

async function testSmtpConnection() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нэвтрээгүй");

  const { data: config } = await supabase
    .from("smtp_configs")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!config) throw new Error("Идэвхтэй SMTP тохиргоо олдсонгүй.");

  // Send test email to the current user
  const response = await fetch("/api/email/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      smtpConfigId: config.id,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Тест илгээхэд алдаа гарлаа.");
  }
}

interface Props {
  isSuperAdmin: boolean;
}

export function SmtpSettings({ isSuperAdmin }: Props) {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["smtp_config"],
    queryFn: fetchSmtpConfig,
  });

  const {
    register,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isDirty },
  } = useForm<SmtpValues>({
    resolver: zodResolver(smtpSchema),
    values: {
      host: config?.host ?? "",
      port: config?.port ?? 587,
      username: config?.username ?? "",
      password: config?.password ?? "",
      from_email: config?.from_email ?? "",
      from_name: config?.from_name ?? "",
    },
  });

  const isActive = config?.is_active ?? false;

  const saveMutation = useMutation({
    mutationFn: (values: SmtpValues) =>
      saveSmtpConfigClient({ ...values, config_id: config?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["smtp_config"] });
      toast.success("SMTP тохиргоо хадгалагдлаа.");
    },
    onError: (err) => {
      toast.error(err.message || "Хадгалахад алдаа гарлаа.");
    },
  });

  const testMutation = useMutation({
    mutationFn: testSmtpConnection,
    onSuccess: () => {
      toast.success("Тест и-мэйл амжилттай илгээгдлээ.");
    },
    onError: (err) => {
      toast.error(err.message || "Тест илгээхэд алдаа гарлаа.");
    },
  });

  const onSave = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) return { error: "Формын алдааг засах" };
    const data = getValues();
    try {
      await saveMutation.mutateAsync(data);
      return undefined;
    } catch (err) {
      return { error: (err as Error).message || "Хадгалахад алдаа гарлаа." };
    }
  }, [trigger, getValues, saveMutation]);

  useRegisterSave({
    id: "smtp",
    label: "SMTP тохиргоо",
    save: onSave,
    isDirty: () => isDirty,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeSimple className="size-5" />
            И-мэйл тохиргоо
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ачааллаж байна...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <EnvelopeSimple className="size-5" />
          И-мэйл тохиргоо
        </CardTitle>
        <CardDescription>И-мэйл илгээх SMTP тохиргоо</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FieldGroup>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>Идэвхтэй эсэх</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  SMTP тохиргоог идэвхжүүлэх
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  if (config?.id) {
                    const supabase = createClient();
                    supabase
                      .from("smtp_configs")
                      .update({ is_active: checked })
                      .eq("id", config.id)
                      .then(() => {
                        queryClient.invalidateQueries({
                          queryKey: ["smtp_config"],
                        });
                      });
                  }
                }}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="host">Сервер</FieldLabel>
              <Input
                id="host"
                type="text"
                placeholder="smtp.gmail.com"
                {...register("host")}
              />
              {errors.host && (
                <p className="text-xs text-destructive">
                  {errors.host.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="port">Порт</FieldLabel>
              <Input
                id="port"
                type="number"
                placeholder="587"
                {...register("port", { valueAsNumber: true })}
              />
              {errors.port && (
                <p className="text-xs text-destructive">
                  {errors.port.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="username">Хэрэглэгчийн нэр</FieldLabel>
              <Input
                id="username"
                type="text"
                placeholder="user@gmail.com"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-xs text-destructive">
                  {errors.username.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Нууц үг</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="Нууц үг"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="from_email">Илгээгч хаяг</FieldLabel>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@example.com"
                {...register("from_email")}
              />
              {errors.from_email && (
                <p className="text-xs text-destructive">
                  {errors.from_email.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="from_name">Илгээгчийн нэр</FieldLabel>
              <Input
                id="from_name"
                type="text"
                placeholder="Zer ERP"
                {...register("from_name")}
              />
            </Field>
          </FieldGroup>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={testMutation.isPending || !config?.id}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? "Илгээж байна..." : "Тест илгээх"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
