"use client";

import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";

// ── Schema ─────────────────────────────────────────────────────

const configSchema = z.object({
  channel: z.string().min(1),
  autoEnable: z.boolean(),
});

type ConfigValues = z.infer<typeof configSchema>;

// ── Component ──────────────────────────────────────────────────

interface ConfigSheetProps {
  orgId: string | undefined;
}

export function ConfigSheet({ orgId }: ConfigSheetProps) {
  const t = useTranslations() as (key: string, values?: Record<string, string | number>) => string;
  const [open, setOpen] = useState(false);
  const { settings: orgSettings } = useOrgSettings(orgId);
  const updateOrgSettings = useUpdateOrgSettings(orgId);

  const form = useForm<ConfigValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      channel: "in_app",
      autoEnable: true,
    },
  });

  // Sync when org settings load
  useEffect(() => {
    if (orgSettings) {
      form.reset({
        channel: (orgSettings?.reminder_default_channel as string) ?? "in_app",
        autoEnable: orgSettings?.reminder_auto_enable !== false,
      });
    }
  }, [orgSettings, form]);

  const handleSave = form.handleSubmit(async (data) => {
    await updateOrgSettings.mutateAsync({
      reminder_default_channel: data.channel,
      reminder_auto_enable: data.autoEnable,
    });
    setOpen(false);
  });

  return (
    <>
      <Button variant="outline" size="icon-xs" onClick={() => setOpen(true)}>
        <Settings className="size-4" />
      </Button>
      <DetailDrawer open={open} onOpenChange={setOpen}>
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {t("serviceReminders.configTitle")}
          </DetailDrawer.Title>
          <DetailDrawer.Description>
            {t("serviceReminders.configDescription")}
          </DetailDrawer.Description>
        </DetailDrawer.Header>

        <DetailDrawer.Body>
          <form
            id="config-form"
            onSubmit={handleSave}
            className="flex flex-col gap-6"
          >
            <Field>
              <FieldLabel htmlFor="default-channel">
                {t("serviceReminders.defaultChannel")}
              </FieldLabel>
              <FieldContent>
                <Typography.Muted className="text-xs text-muted-foreground">
                  {t("serviceReminders.defaultChannelDescription")}
                </Typography.Muted>
                <Select
                  value={form.watch("channel")}
                  onValueChange={(v) => v && form.setValue("channel", v)}
                >
                  <SelectTrigger id="default-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">
                      {t("serviceReminders.channelInApp")}
                    </SelectItem>
                    <SelectItem value="email">
                      {t("serviceReminders.channelEmail")}
                    </SelectItem>
                    <SelectItem value="both">
                      {t("serviceReminders.channelBoth")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>

            <Item variant="outline" className="justify-between rounded-lg p-4">
              <ItemContent className="gap-0.5">
                <ItemTitle className="text-sm">
                  {t("serviceReminders.autoEnable")}
                </ItemTitle>
                <Typography.Muted className="text-xs">
                  {t("serviceReminders.autoEnableDescription")}
                </Typography.Muted>
              </ItemContent>
              <ItemActions>
                <Switch
                  checked={form.watch("autoEnable")}
                  onCheckedChange={(checked) =>
                    form.setValue("autoEnable", checked)
                  }
                />
              </ItemActions>
            </Item>
          </form>
        </DetailDrawer.Body>

        <DetailDrawer.Footer>
          <DetailDrawer.FooterActions>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              size="lg"
              form="config-form"
              type="submit"
              disabled={updateOrgSettings.isPending}
            >
              {updateOrgSettings.isPending
                ? t("common.saving")
                : t("common.save")}
            </Button>
          </DetailDrawer.FooterActions>
        </DetailDrawer.Footer>
      </DetailDrawer>
    </>
  );
}
