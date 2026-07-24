"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, GraduationCap, MapPin, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { type AcademyProfileRow, academyApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const profileSchema = z.object({
  name: z.string().min(1, "Нэр заавал байх ёстой"),
  logo_url: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().optional(),
  timezone: z.string().optional(),
  settings: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const TIMEZONES = [
  "Asia/Ulaanbaatar",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Hong_Kong",
  "Asia/Singapore",
  "Asia/Bangkok",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Moscow",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];

export default function AcademyProfilePage() {
  const queryClient = useQueryClient();

  const { data: profiles = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "profile"],
    queryFn: () => academyApi.profile.get(),
  });

  const profile = profiles[0] ?? null;

  // Stats queries
  const { data: programs = [] } = useQuery({
    queryKey: ["admin", "academy", "programs"],
    queryFn: () => academyApi.programs.list(),
  });
  const { data: trainers = [] } = useQuery({
    queryKey: ["admin", "academy", "trainers"],
    queryFn: () => academyApi.trainers.list(),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ["admin", "academy", "locations"],
    queryFn: () => academyApi.locations.list(),
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? "",
      logo_url: profile?.logo_url ?? "",
      contact_phone: profile?.contact_phone ?? "",
      contact_email: profile?.contact_email ?? "",
      timezone: profile?.timezone ?? "Asia/Ulaanbaatar",
      settings: profile?.settings
        ? JSON.stringify(profile.settings, null, 2)
        : "{}",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const payload: Partial<AcademyProfileRow> = {
        name: values.name,
        logo_url: values.logo_url || null,
        contact_phone: values.contact_phone || null,
        contact_email: values.contact_email || null,
        timezone: values.timezone || "Asia/Ulaanbaatar",
        settings: values.settings ? JSON.parse(values.settings) : {},
      };
      if (profile) {
        return academyApi.profile.update(profile.id, payload);
      }
      return academyApi.profile.seed(values.name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "profile"],
      });
      toast.success("Профайл хадгалагдлаа");
    },
    onError: (err: Error) => {
      const msg = err.message?.includes("already exists")
        ? "Академийн профайл аль хэдийн үүссэн байна"
        : err.message;
      toast.error(msg);
    },
  });

  function onSubmit(values: ProfileFormValues) {
    saveMutation.mutate(values);
  }

  return (
    <AdminPageLayout
      title="Академийн профайл"
      loading={isPending}
      isEmpty={false}
      headerExtras={
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Хөтөлбөр</CardTitle>
              <BookOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{programs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Дасгалжуулагч
              </CardTitle>
              <GraduationCap className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Байршил</CardTitle>
              <MapPin className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-xl space-y-6"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Нэр</Label>
          <Input
            id="name"
            placeholder="Академийн нэр"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="logo_url">Лого URL</Label>
          <Input
            id="logo_url"
            placeholder="https://..."
            {...form.register("logo_url")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Утас</Label>
          <Input
            id="contact_phone"
            placeholder="Утасны дугаар"
            {...form.register("contact_phone")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_email">Имэйл</Label>
          <Input
            id="contact_email"
            type="email"
            placeholder="имэйл хаяг"
            {...form.register("contact_email")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Цагийн бүс</Label>
          <Select
            onValueChange={(v) => form.setValue("timezone", v)}
            value={form.watch("timezone")}
          >
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Цагийн бүс сонгох" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="settings">Тохиргоо (JSON)</Label>
          <Textarea
            id="settings"
            placeholder='{"key": "value"}'
            rows={6}
            {...form.register("settings")}
          />
        </div>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
        </Button>
      </form>
    </AdminPageLayout>
  );
}
