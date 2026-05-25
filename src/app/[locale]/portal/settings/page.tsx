"use client";

import { Key, User, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePortalAuth } from "@/hooks/use-portal-auth";

export default function PortalSettingsPage() {
  const t = useTranslations();
  const { push } = useRouter();
  const { customer, loading, token } = usePortalAuth();
  const [settingPwd, setSettingPwd] = useState(false);
  const [pwdDone, setPwdDone] = useState(false);

  const hasPassword = false; // Placeholder — in real flow, check if customer_user_id is set

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("portal.settings")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("portal.settingsDesc")}
        </p>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            Contact Info
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("common.name")}</span>
            <span className="font-medium">{customer?.full_name ?? customer?.first_name ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("common.phone")}</span>
            <span className="font-medium">{customer?.phone ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("common.email")}</span>
            <span className="font-medium">{customer?.email ?? "—"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Key className="size-4 text-muted-foreground" />
            {t("portal.setPassword")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pwdDone ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle2 className="size-4" />
              {t("portal.passwordSet")}
            </div>
          ) : hasPassword ? (
            <p className="text-sm text-muted-foreground">
              Password already set. You can log in with your email.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {t("portal.setPasswordDesc")}
              </p>
              <Button
                size="sm"
                onClick={() =>
                  push(
                    `/auth/customer/set-password${token ? `?token=${token}` : ""}`,
                  )
                }
                disabled={settingPwd}
              >
                {settingPwd && <Loader2 className="size-4 animate-spin mr-1.5" />}
                {t("portal.setPassword")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
