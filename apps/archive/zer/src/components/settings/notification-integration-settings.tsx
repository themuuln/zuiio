"use client";

import {
  DeviceMobile,
  Plus,
  TelegramLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { MessageTemplate, NotificationChannel } from "@/lib/notifications";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

const CHANNELS = [
  {
    type: "whatsapp",
    label: "WhatsApp",
    icon: WhatsappLogo,
    desc: "WhatsApp Business API ашиглан мессеж илгээнэ",
  },
  {
    type: "telegram",
    label: "Telegram",
    icon: TelegramLogo,
    desc: "Telegram Bot ашиглан мессеж илгээнэ",
  },
  {
    type: "sms",
    label: "SMS",
    icon: DeviceMobile,
    desc: "SMS шуудан үйлчилгээ ашиглан мессеж илгээнэ",
  },
] as const;

export function NotificationIntegrationSettings() {
  const { organizationId } = useOrgSettings();
  const queryClient = useQueryClient();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", body: "" });
  const queryKey = ["notifications", organizationId];

  const dataQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      let { data: channels } = await supabase
        .from("notification_channels")
        .select("*")
        .eq("organization_id", organizationId);
      const { data: templates } = await supabase
        .from("message_templates")
        .select("*")
        .eq("organization_id", organizationId);
      if (!channels || channels.length === 0) {
        const defaults = CHANNELS.map((ch) => ({
          organization_id: organizationId,
          type: ch.type,
          is_enabled: false,
          config: {},
        }));
        await supabase.from("notification_channels").insert(defaults);
        ({ data: channels } = await supabase
          .from("notification_channels")
          .select("*")
          .eq("organization_id", organizationId));
      }
      return {
        channels: (channels ?? []) as NotificationChannel[],
        templates: (templates ?? []) as MessageTemplate[],
      };
    },
    enabled: !!organizationId,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase
        .from("notification_channels")
        .update({ is_enabled: enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Шинэчлэгдлээ.");
    },
    onError: (e) => {
      capture(e);
      toast.error("Алдаа гарлаа.");
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async ({
      channelId,
      name,
      body,
    }: {
      channelId: string;
      name: string;
      body: string;
    }) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from("message_templates").insert({
        organization_id: organizationId,
        channel_id: channelId,
        name,
        body,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Загвар нэмэгдлээ.");
      setNewTemplate({ name: "", body: "" });
    },
    onError: (e) => {
      capture(e);
      toast.error("Алдаа гарлаа.");
    },
  });

  if (dataQuery.isLoading) return <Skeleton className="h-48 w-full" />;
  const { channels = [], templates = [] } = dataQuery.data ?? {};

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Мессеж илгээх</h3>
        <p className="text-sm text-muted-foreground">
          WhatsApp, Telegram, SMS тохиргоо
        </p>
      </div>
      {CHANNELS.map((ch) => {
        const channel = channels.find((c) => c.type === ch.type);
        const Icon = ch.icon;
        const channelTemplates = templates.filter(
          (t) => t.channel_id === channel?.id,
        );
        return (
          <Card key={ch.type}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <Icon className="size-5" />
                <div>
                  <CardTitle className="text-base">{ch.label}</CardTitle>
                  <CardDescription>{ch.desc}</CardDescription>
                </div>
              </div>
              {channel && (
                <Switch
                  checked={channel.is_enabled}
                  onCheckedChange={(v) =>
                    toggleMutation.mutate({ id: channel.id, enabled: v })
                  }
                />
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">
                Загварууд ({channelTemplates.length})
              </p>
              {channelTemplates.map((t) => (
                <div key={t.id} className="rounded border p-2 mb-2 text-sm">
                  <span className="font-medium">{t.name}</span>
                  <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                    {t.body}
                  </p>
                </div>
              ))}
              {channel && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setExpandedTemplate(
                        expandedTemplate === ch.type ? null : ch.type,
                      )
                    }
                  >
                    <Plus className="mr-1 size-3" />
                    Загвар нэмэх
                  </Button>
                  {expandedTemplate === ch.type && (
                    <div className="mt-2 space-y-2">
                      <Input
                        placeholder="Загварын нэр"
                        value={newTemplate.name}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            name: e.target.value,
                          })
                        }
                      />
                      <Textarea
                        placeholder="Загварын агуулга ({{customer_name}}, {{sale_total}})"
                        value={newTemplate.body}
                        onChange={(e) =>
                          setNewTemplate({
                            ...newTemplate,
                            body: e.target.value,
                          })
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          createTemplateMutation.mutate({
                            channelId: channel.id,
                            name: newTemplate.name,
                            body: newTemplate.body,
                          })
                        }
                        disabled={!newTemplate.name || !newTemplate.body}
                      >
                        Хадгалах
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
