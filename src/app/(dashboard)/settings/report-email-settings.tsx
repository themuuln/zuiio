"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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

const reportEmailSchema = z.object({
  enabled: z.boolean(),
  recipient: z
    .string()
    .email("Зөв и-мэйл хаяг оруулна уу.")
    .optional()
    .or(z.literal("")),
  send_time: z.string().min(1, "Цаг шаардлагатай."),
});

type ReportEmailValues = z.infer<typeof reportEmailSchema>;

interface OrgReportEmailData {
  report_email_enabled: boolean;
  report_email_recipient: string | null;
  report_email_time: string;
}

async function fetchReportEmailSettings(): Promise<OrgReportEmailData | null> {
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
  if (!orgId) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("report_email_enabled, report_email_recipient, report_email_time")
    .eq("id", orgId)
    .single();

  if (!org) return null;
  return org as unknown as OrgReportEmailData;
}

async function saveReportEmailSettingsClient(values: ReportEmailValues) {
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

  const { error } = await supabase
    .from("organizations")
    .update({
      report_email_enabled: values.enabled,
      report_email_recipient: values.enabled ? values.recipient || null : null,
      report_email_time: values.send_time,
    })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
}

export function ReportEmailSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["report_email_settings"],
    queryFn: fetchReportEmailSettings,
  });

  const {
    register,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors, isDirty },
  } = useForm<ReportEmailValues>({
    resolver: zodResolver(reportEmailSchema),
    values: {
      enabled: settings?.report_email_enabled ?? false,
      recipient: settings?.report_email_recipient ?? "",
      send_time: settings?.report_email_time ?? "09:00",
    },
  });

  const enabled = watch("enabled");

  const saveMutation = useMutation({
    mutationFn: saveReportEmailSettingsClient,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["report_email_settings"],
      });
      toast.success("Өдрийн тайлангийн тохиргоо хадгалагдлаа.");
    },
    onError: (err) => {
      toast.error(err.message || "Хадгалахад алдаа гарлаа.");
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
    id: "report-email",
    label: "Өдрийн тайлан и-мэйл",
    save: onSave,
    isDirty: () => isDirty,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5" />
            Өдрийн тайлан и-мэйл
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
          <CalendarCheck className="size-5" />
          Өдрийн тайлан и-мэйл
        </CardTitle>
        <CardDescription>
          Өдрийн тайланг и-мэйлээр хүлээн авах тохиргоо
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <FieldGroup>
            <div className="flex items-center justify-between">
              <div>
                <FieldLabel>И-мэйл тайлан идэвхжүүлэх</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Өдөр бүр и-мэйлээр тайлан хүлээн авах
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => setValue("enabled", checked)}
              />
            </div>

            <Field>
              <FieldLabel htmlFor="recipient">Хүлээн авагч</FieldLabel>
              <Input
                id="recipient"
                type="email"
                placeholder="email@example.com"
                disabled={!enabled}
                {...register("recipient")}
              />
              {errors.recipient && (
                <p className="text-xs text-destructive">
                  {errors.recipient.message}
                </p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="send_time">Илгээх цаг</FieldLabel>
              <Input
                id="send_time"
                type="time"
                disabled={!enabled}
                {...register("send_time")}
              />
              {errors.send_time && (
                <p className="text-xs text-destructive">
                  {errors.send_time.message}
                </p>
              )}
            </Field>
          </FieldGroup>
        </div>
      </CardContent>
    </Card>
  );
}
