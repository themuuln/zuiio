"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { Settings } from "lucide-react";
import {
  useOrgSettings,
  useUpdateOrgSettings,
} from "@/lib/queries/use-org-settings";

interface ConfigSheetProps {
  orgId: string | undefined;
}

export function ConfigSheet({ orgId }: ConfigSheetProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { settings: orgSettings } = useOrgSettings(orgId);
  const updateOrgSettings = useUpdateOrgSettings(orgId);

  const defaultChannel =
    (orgSettings?.reminder_default_channel as string) ?? "in_app";
  const autoEnable = orgSettings?.reminder_auto_enable !== false;

  const [configChannel, setConfigChannel] = useState(defaultChannel);
  const [configAutoEnable, setConfigAutoEnable] = useState(autoEnable);

  // Sync state when org settings load
  useEffect(() => {
    if (orgSettings) {
      setConfigChannel(
        (orgSettings?.reminder_default_channel as string) ?? "in_app",
      );
      setConfigAutoEnable(orgSettings?.reminder_auto_enable !== false);
    }
  }, [orgSettings]);

  const handleSaveConfig = async () => {
    await updateOrgSettings.mutateAsync({
      reminder_default_channel: configChannel,
      reminder_auto_enable: configAutoEnable,
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="icon-xs" />}>
        <Settings className="size-4" />
      </SheetTrigger>
      <SheetContent side="right" zLayer={0} className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle>{t("serviceReminders.configTitle")}</SheetTitle>
          <SheetDescription>
            {t("serviceReminders.configDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex mt-6 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Label htmlFor="default-channel">
              {t("serviceReminders.defaultChannel")}
            </Label>
            <Typography.Muted className="text-xs text-muted-foreground">
              {t("serviceReminders.defaultChannelDescription")}
            </Typography.Muted>
            <Select
              value={configChannel}
              onValueChange={(v) => v && setConfigChannel(v)}
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
          </div>

          <Item variant="outline" className="justify-between rounded-lg p-4">
            <ItemContent className="gap-0.5">
              <ItemTitle className="text-sm">
                {t("serviceReminders.autoEnable")}
              </ItemTitle>
              <ItemDescription className="text-xs">
                {t("serviceReminders.autoEnableDescription")}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Switch
                checked={configAutoEnable}
                onCheckedChange={setConfigAutoEnable}
              />
            </ItemActions>
          </Item>

          <Button
            className="w-full"
            onClick={handleSaveConfig}
            disabled={updateOrgSettings.isPending}
          >
            {updateOrgSettings.isPending
              ? t("common.saving")
              : t("common.save")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
