"use client";

import { Clock, Envelope } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { updateReportEmailSettings } from "@/app/(dashboard)/settings/organization/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";

const TIME_OPTIONS = [
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
  "00:00",
];

import { Input } from "@/components/ui/input";

export function ReportEmailSettings({
  enabled,
  time,
  recipient,
}: {
  enabled: boolean;
  time: string | null;
  recipient: string | null;
}) {
  const [state, formAction, isPending] = useActionState(
    updateReportEmailSettings,
    undefined,
  );
  const [switchOn, setSwitchOn] = useState(enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Envelope className="size-4" />
          Өдрийн тайлан имэйл
        </CardTitle>
        <CardDescription>
          Өдөр бүр заасан цагт имэйл хаяг руу өдрийн тайлан илгээх тохиргоо.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="report_email_enabled">Тайлан илгээх</Label>
              <p className="text-xs text-muted-foreground">
                Өдөр бүр заасан цагт имэйл илгээх
              </p>
            </div>
            <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
            <input
              type="hidden"
              name="report_email_enabled"
              value={switchOn ? "on" : "off"}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report_email_recipient">Хүлээн авагч имэйл</Label>
            <Input
              id="report_email_recipient"
              name="report_email_recipient"
              type="email"
              placeholder="owner@example.com"
              defaultValue={recipient ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Хоосон бол эзэмшигчийн имэйл рүү илгээнэ.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="report_email_time"
              className="flex items-center gap-1"
            >
              <Clock className="size-3.5" />
              Илгээх цаг
            </Label>
            <NativeSelect
              id="report_email_time"
              name="report_email_time"
              defaultValue={time ?? "18:00"}
            >
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          </div>

          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}

          {state?.success ? (
            <p className="text-sm text-emerald-600">Тохиргоо хадгалагдлаа.</p>
          ) : null}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Хадгалах..." : "Хадгалах"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
