"use client";

import { Bell, BellOff, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import { usePushSubscription } from "@/hooks/use-push-subscription";

export function PushNotificationSettings() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushSubscription();

  const handleToggle = useCallback(async () => {
    if (isSubscribed) {
      const success = await unsubscribe();
      if (success) {
        toast.success("Мэдэгдэл унтраалаа");
      }
    } else {
      const success = await subscribe();
      if (success) {
        toast.success("Мэдэгдэл идэвхэслээ");
      } else if (permission === "denied") {
        toast.error(
          "Хөтөч мэдэгдэл унтраасан байна. Хөтөчийн тохиргооноо шалгана уу.",
        );
      }
    }
  }, [isSubscribed, subscribe, unsubscribe, permission]);

  if (!isSupported) {
    return (
      <Card>
        <CardHeader className="gap-2 pb-4">
          <CardTitle className="flex items-center gap-2">
            <BellOff className="size-4" />
            Мэдэгдэл
          </CardTitle>
          <CardDescription>
            Танай хөтөч push мэдэгдэлийг дэмждэггүй
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Typography.Muted>
            Chrome, Edge, Firefox эсвэл Samsung Internet ашиглана уу
          </Typography.Muted>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4" />
          Мэдэгдэл
        </CardTitle>
        <CardDescription>
          Ажлын захиалга, нэхэмжлэл болон бусад шинэчлэлтийн мэдэгдэл авах
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Push мэдэгдэл</span>
            <span className="text-sm text-muted-foreground">
              Хөтөч нээлттэй эсэхээс үл хамааран мэдэгдэл авах
            </span>
          </div>
          <Switch
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            aria-label="Push мэдэгдэл"
          />
        </div>

        {permission === "denied" && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Хөтөч мэдэгдэлийг унтраасан байна. Идэвхэжүүлэхийн тулд хөтөчийн
            тохиргооноос &quot;Зөвшөөрөх&quot; сонголтыг сонгоно уу.
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Ачаалж байна...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
