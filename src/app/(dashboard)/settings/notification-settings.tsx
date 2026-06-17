"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EnvelopeSimple, TelegramLogo } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRegisterSave, useSettings } from "./settings-context";
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

const emailSchema = z.object({
  enabled: z.boolean(),
  recipient_email: z
    .string()
    .email("Зөв и-мэйл хаяг оруулна уу.")
    .optional()
    .or(z.literal("")),
  event_types: z.array(z.string()).min(1, "Дор хаяж нэг төрөл сонгоно уу"),
});

type EmailValues = z.infer<typeof emailSchema>;

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

async function fetchEmailConfig() {
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

  let recipientEmail = "";
  let enabled = true;
  let eventTypes: string[] = ["low_stock"];

  if (orgId) {
    const { data: orgConfig } = await supabase
      .from("notification_configs")
      .select("*")
      .eq("organization_id", orgId)
      .eq("channel", "email")
      .maybeSingle();

    if (orgConfig) {
      recipientEmail =
        orgConfig.chat_id ??
        (orgConfig.config_data as { recipient_email?: string })
          ?.recipient_email ??
        "";
      enabled = orgConfig.enabled ?? true;
      const et = orgConfig.event_types as string[];
      if (Array.isArray(et) && et.length > 0) {
        eventTypes = et;
      }
    }
  }

  return {
    recipient_email: recipientEmail,
    enabled,
    event_types: eventTypes,
  };
}

async function saveEmailConfig(values: EmailValues) {
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

  const { data: existing } = await supabase
    .from("notification_configs")
    .select("id")
    .eq("organization_id", orgId)
    .eq("channel", "email")
    .maybeSingle();

  const payload = {
    organization_id: orgId,
    channel: "email",
    chat_id: values.recipient_email,
    enabled: values.enabled,
    event_types: values.event_types,
    config_data: { recipient_email: values.recipient_email },
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

export function NotificationSettings({ isSuperAdmin }: Props) {
  const queryClient = useQueryClient();
  const { notify } = useSettings();

  // ── Telegram ────────────────────────────────────────────────────────

  const { data: config } = useQuery({
    queryKey: ["notification_config", "telegram"],
    queryFn: fetchTelegramConfig,
  });

  const telegramInitial = useRef(config);
  if (config && !telegramInitial.current) telegramInitial.current = config;

  const {
    register,
    setValue,
    watch: telegramWatch,
    getValues,
    trigger,
    control,
    formState: { errors, isDirty },
  } = useForm<TelegramValues>({
    resolver: zodResolver(telegramSchema),
    values: {
      bot_token: config?.bot_token ?? "",
      chat_id: config?.chat_id ?? "",
      enabled: config?.enabled ?? true,
      event_types: config?.event_types ?? ["low_stock"],
    },
  });

  const telegramWatched = telegramWatch();
  useEffect(() => {
    notify();
  }, [notify, telegramWatched]);

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

  const enabled = telegramWatch("enabled");

  const onTelegramSave = useCallback(async () => {
    const isValid = await trigger();
    if (!isValid) return { error: "Формын алдааг засах" };
    try {
      await saveMutation.mutateAsync(getValues());
      return undefined;
    } catch (err) {
      return { error: (err as Error).message || "Хадгалахад алдаа гарлаа." };
    }
  }, [trigger, getValues, saveMutation]);

  useRegisterSave({
    id: "notif-telegram",
    label: "Telegram мэдэгдэхүүн",
    save: onTelegramSave,
    isDirty: () => isDirty,
    getChanges: () => {
      const vals = getValues();
      const init = telegramInitial.current;
      const c: { field: string; from: string; to: string }[] = [];
      if (!init) return c;
      if (vals.bot_token !== init.bot_token)
        c.push({ field: "Bot Token", from: "••••••••", to: "••••••••" });
      if (vals.chat_id !== init.chat_id)
        c.push({ field: "Chat ID", from: init.chat_id, to: vals.chat_id });
      if (vals.enabled !== init.enabled)
        c.push({
          field: "Идэвхтэй эсэх",
          from: init.enabled ? "Тийм" : "Үгүй",
          to: vals.enabled ? "Тийм" : "Үгүй",
        });
      if (
        JSON.stringify(vals.event_types.sort()) !==
        JSON.stringify(init.event_types.sort())
      )
        c.push({ field: "Мэдэгдлийн төрлүүд", from: "Хуучнаар", to: "Шинээр" });
      return c;
    },
  });

  // ── Email notification ──────────────────────────────────────────────

  const { data: emailConfig } = useQuery({
    queryKey: ["notification_config", "email"],
    queryFn: fetchEmailConfig,
  });

  const emailInitial = useRef(emailConfig);
  if (emailConfig && !emailInitial.current) emailInitial.current = emailConfig;

  const {
    register: emailRegister,
    setValue: emailSetValue,
    watch: emailWatch,
    getValues: emailGetValues,
    trigger: emailTrigger,
    control: emailControl,
    formState: { errors: emailErrors, isDirty: emailIsDirty },
  } = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    values: {
      recipient_email: emailConfig?.recipient_email ?? "",
      enabled: emailConfig?.enabled ?? true,
      event_types: emailConfig?.event_types ?? ["low_stock"],
    },
  });

  const emailWatched = emailWatch();
  useEffect(() => {
    notify();
  }, [notify, emailWatched]);

  const emailSaveMutation = useMutation({
    mutationFn: saveEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification_config", "email"],
      });
      toast.success("И-мэйл мэдэгдэхүүний тохиргоо хадгалагдлаа.");
    },
    onError: (err) => {
      toast.error(err.message || "Хадгалахад алдаа гарлаа.");
    },
  });

  const emailEnabled = emailWatch("enabled");

  const onEmailSave = useCallback(async () => {
    const isValid = await emailTrigger();
    if (!isValid) return { error: "Формын алдааг засах" };
    try {
      await emailSaveMutation.mutateAsync(emailGetValues());
      return undefined;
    } catch (err) {
      return { error: (err as Error).message || "Хадгалахад алдаа гарлаа." };
    }
  }, [emailTrigger, emailGetValues, emailSaveMutation]);

  useRegisterSave({
    id: "notif-email",
    label: "И-мэйл мэдэгдэхүүн",
    save: onEmailSave,
    isDirty: () => emailIsDirty,
    getChanges: () => {
      const vals = emailGetValues();
      const init = emailInitial.current;
      const c: { field: string; from: string; to: string }[] = [];
      if (!init) return c;
      if (vals.recipient_email !== init.recipient_email)
        c.push({
          field: "Хүлээн авагч",
          from: init.recipient_email,
          to: vals.recipient_email,
        });
      if (vals.enabled !== init.enabled)
        c.push({
          field: "Идэвхтэй эсэх",
          from: init.enabled ? "Тийм" : "Үгүй",
          to: vals.enabled ? "Тийм" : "Үгүй",
        });
      if (
        JSON.stringify(vals.event_types.sort()) !==
        JSON.stringify(init.event_types.sort())
      )
        c.push({ field: "Мэдэгдлийн төрлүүд", from: "Хуучнаар", to: "Шинээр" });
      return c;
    },
  });

  return (
    <>
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
          <div className="space-y-4">
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
                  Telegram-ээр @BotFather-аас бот үүсгээд, chat ID-гээ оруулна
                  уу.
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
              <Button asChild variant="outline" size="sm">
                <Link href="/settings/notifications">Мэдэгдлийн түүх</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Notification Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EnvelopeSimple className="size-5" />
            И-мэйл мэдэгдэхүүн
          </CardTitle>
          <CardDescription>
            Чухал үйл явдлуудын талаар и-мэйлээр мэдэгдэх
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <FieldGroup>
              <div className="flex items-center justify-between">
                <div>
                  <FieldLabel>Мэдэгдэхүүн идэвхжүүлэх</FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    И-мэйлээр мэдэгдэл хүлээн авах
                  </p>
                </div>
                <Switch
                  checked={emailEnabled}
                  onCheckedChange={(checked) =>
                    emailSetValue("enabled", checked)
                  }
                />
              </div>

              <Field>
                <FieldLabel htmlFor="email_recipient">
                  Хүлээн авагч и-мэйл
                </FieldLabel>
                <Input
                  id="email_recipient"
                  type="email"
                  placeholder="email@example.com"
                  {...emailRegister("recipient_email")}
                />
                {emailErrors.recipient_email && (
                  <p className="text-xs text-destructive">
                    {emailErrors.recipient_email.message}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel>Мэдэгдлийн төрлүүд</FieldLabel>
                <div className="space-y-2 mt-1">
                  {EVENT_OPTIONS.map((opt) => (
                    <div key={opt.value} className="flex items-center gap-2">
                      <Controller
                        control={emailControl}
                        name="event_types"
                        render={({ field }) => (
                          <Checkbox
                            id={`email-event-${opt.value}`}
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
                        htmlFor={`email-event-${opt.value}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </div>
                {emailErrors.event_types && (
                  <p className="text-xs text-destructive mt-1">
                    {emailErrors.event_types.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
