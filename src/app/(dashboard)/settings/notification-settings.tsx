"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { TelegramLogo } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createClient } from "@/lib/supabase/client";

const EVENT_OPTIONS = [
  { value: "low_stock", label: "Бага нөөц" },
  { value: "new_sale", label: "Шинэ борлуулалт" },
  { value: "daily_summary", label: "Өдрийн тойм" },
] as const;

const telegramSchema = z.object({
  bot_token: z.string().min(1, "Bot token шаардлагатай"),
  chat_id: z.string().min(1, "Chat ID шаардлагатай"),
  enabled: z.boolean(),
  event_types: z.array(z.string()).min(1, "Дор хаяж нэг төрөл сонгоно уу"),
});

type TelegramValues = z.infer<typeof telegramSchema>;

async function fetchTelegramConfig() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  const orgId = profile?.organization_id;

  // Bot token from app_config (system-wide)
  const { data: botTokenRow } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "telegram_bot_token")
    .maybeSingle();
  const botToken = (botTokenRow?.value as { token?: string })?.token ?? "";

  // Per-org config from notification_configs
  let chatId = "";
  let enabled = true;
  let eventTypes: string[] = ["low_stock"];

  if (orgId) {
    const { data: orgConfig } = await supabase
      .from("notification_configs")
      .select("*")
      .eq("organization_id", orgId)
      .eq("channel", "telegram")
      .maybeSingle();

    if (orgConfig) {
      chatId =
        orgConfig.chat_id ??
        (orgConfig.config_data as { chat_id?: string })?.chat_id ??
        "";
      enabled = orgConfig.enabled ?? true;
      const et = orgConfig.event_types as string[];
      if (Array.isArray(et) && et.length > 0) {
        eventTypes = et;
      }
    }
  }

  return {
    bot_token: botToken,
    chat_id: chatId,
    enabled,
    event_types: eventTypes,
  };
}

async function saveTelegramConfig(values: TelegramValues) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Нэвтрээгүй");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  const orgId = profile?.organization_id;
  if (!orgId) throw new Error("Байгууллага олдсонгүй");

  // Save bot token to app_config (system-wide)
  const { error: tokenErr } = await supabase.from("app_config").upsert(
    {
      key: "telegram_bot_token",
      value: { token: values.bot_token },
    },
    { onConflict: "key" },
  );
  if (tokenErr) throw new Error(tokenErr.message);

  // Save per-org config to notification_configs
  const { data: existing } = await supabase
    .from("notification_configs")
    .select("id")
    .eq("organization_id", orgId)
    .eq("channel", "telegram")
    .maybeSingle();

  const payload = {
    organization_id: orgId,
    channel: "telegram",
    chat_id: values.chat_id,
    enabled: values.enabled,
    event_types: values.event_types,
    config_data: { chat_id: values.chat_id },
  };

  if (existing) {
    const { error } = await supabase
      .from("notification_configs")
      .update(payload)
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("notification_configs")
      .insert(payload);
    if (error) throw new Error(error.message);
  }
}

interface Props {
  isSuperAdmin: boolean;
}

export function NotificationSettings({ isSuperAdmin }: Props) {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["notification_config", "telegram"],
    queryFn: fetchTelegramConfig,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<TelegramValues>({
    resolver: zodResolver(telegramSchema),
    values: {
      bot_token: config?.bot_token ?? "",
      chat_id: config?.chat_id ?? "",
      enabled: config?.enabled ?? true,
      event_types: config?.event_types ?? ["low_stock"],
    },
  });

  const saveMutation = useMutation({
    mutationFn: saveTelegramConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification_config", "telegram"],
      });
      toast.success("Мэдэгдэхүүний тохиргоо хадгалагдлаа.");
    },
    onError: (err) => {
      toast.error(err.message || "Хадгалахад алдаа гарлаа.");
    },
  });

  const enabled = watch("enabled");

  const onSubmit = (data: TelegramValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TelegramLogo className="size-5" />
          Telegram мэдэгдэхүүн
        </CardTitle>
        <CardDescription>
          Бага нөөц, борлуулалт зэрэг мэдэгдлийг Telegram руу илгээх
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>Мэдэгдэхүүн идэвхжүүлэх</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Telegram-ээр мэдэгдэл хүлээн авах
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setValue("enabled", checked)}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="bot_token">Bot Token</FieldLabel>
              <Input
                id="bot_token"
                type="password"
                placeholder="8063505423:AA..."
                {...register("bot_token")}
              />
              {errors.bot_token && (
                <p className="text-xs text-destructive">
                  {errors.bot_token.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="chat_id">Chat ID</FieldLabel>
              <Input
                id="chat_id"
                placeholder="-1001234567890"
                {...register("chat_id")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Telegram-ээр @BotFather-аас бот үүсгээд, chat ID-гээ оруулна уу.
              </p>
              {errors.chat_id && (
                <p className="text-xs text-destructive">
                  {errors.chat_id.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel>Мэдэгдлийн төрлүүд</FieldLabel>
              <div className="space-y-2 mt-1">
                {EVENT_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <Controller
                      control={control}
                      name="event_types"
                      render={({ field }) => (
                        <Checkbox
                          id={`event-${opt.value}`}
                          checked={field.value.includes(opt.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...field.value, opt.value]);
                            } else {
                              field.onChange(
                                field.value.filter((v) => v !== opt.value),
                              );
                            }
                          }}
                        />
                      )}
                    />
                    <Label
                      htmlFor={`event-${opt.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.event_types && (
                <p className="text-xs text-destructive mt-1">
                  {errors.event_types.message}
                </p>
              )}
            </Field>
          </FieldGroup>
          <div className="flex items-center gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/settings/notifications">Мэдэгдлийн түүх</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
