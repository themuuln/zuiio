"use client";

import { Plus } from "@phosphor-icons/react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { addSmtpConfig } from "./actions";

export function AddSmtpForm() {
  const [state, formAction, isPending] = useActionState(
    addSmtpConfig,
    undefined,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Шинэ SMTP бүртгэл нэмэх
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="from_email">Илгээгч имэйл *</Label>
            <Input
              id="from_email"
              name="from_email"
              type="email"
              required
              placeholder="yourname@gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="from_name">Илгээгчийн нэр</Label>
            <Input id="from_name" name="from_name" placeholder="Your Name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">Нэвтрэх нэр (имэйл) *</Label>
            <Input
              id="username"
              name="username"
              type="email"
              required
              placeholder="yourname@gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Нууц үг (App Password) *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Gmail App Password"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="host">SMTP сервер</Label>
            <Input
              id="host"
              name="host"
              defaultValue="smtp.gmail.com"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="port">Порт</Label>
            <Input id="port" name="port" type="number" defaultValue="587" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Тэргүүлэх дараалал</Label>
            <NativeSelect id="priority" name="priority" defaultValue="0">
              <option value="0">Тэнцүү</option>
              <option value="1">Өндөр</option>
              <option value="2">Дунд</option>
              <option value="3">Бага</option>
            </NativeSelect>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Нэмж байна..." : "Нэмэх"}
            </Button>
          </div>

          {state?.error ? (
            <p className="col-span-full text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          {state?.success ? (
            <p className="col-span-full text-sm text-emerald-600">
              Амжилттай нэмэгдлээ.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
