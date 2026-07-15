"use client";

import {
  Envelope,
  Globe,
  Link as LinkIcon,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { updatePublicProfile } from "@/app/(dashboard)/settings/organization/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrgSettings } from "@/lib/org-settings-context";

export function PublicProfileSettings({
  slug,
  initialProfile,
}: {
  slug: string;
  initialProfile?: {
    catalog_enabled: boolean;
    display_name: string | null;
    description: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    address: string | null;
    website_url: string | null;
  } | null;
}) {
  useOrgSettings();
  const [state, formAction, isPending] = useActionState(
    updatePublicProfile,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" />
            Нийтийн хуудас
          </CardTitle>
          {initialProfile?.catalog_enabled && slug && (
            <Link
              href={`/${slug}/products`}
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              Каталог харах →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="catalog_enabled"
              name="catalog_enabled"
              defaultChecked={initialProfile?.catalog_enabled ?? false}
            />
            <label
              htmlFor="catalog_enabled"
              className="text-sm font-medium leading-none"
            >
              Каталог идэвхижүүлэх
            </label>
          </div>
          <p className="ml-7 text-xs text-muted-foreground">
            Идэвхижүүлбэл танай бүтээгдэхүүний каталог нийтийн хуудаснаа
            харагдана.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="display_name"
                className="text-xs font-medium text-muted-foreground"
              >
                Дэлгэцийн нэр
              </label>
              <Input
                id="display_name"
                name="display_name"
                placeholder="Танай байгууллагын нэр"
                defaultValue={initialProfile?.display_name ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contact_email"
                className="text-xs font-medium text-muted-foreground"
              >
                Холбоо барих имэйл
              </label>
              <div className="relative">
                <Envelope className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  placeholder="info@example.com"
                  className="pl-8"
                  defaultValue={initialProfile?.contact_email ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="contact_phone"
                className="text-xs font-medium text-muted-foreground"
              >
                Холбоо барих утас
              </label>
              <div className="relative">
                <Phone className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  placeholder="+976 99112233"
                  className="pl-8"
                  defaultValue={initialProfile?.contact_phone ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="address"
                className="text-xs font-medium text-muted-foreground"
              >
                Хаяг
              </label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="address"
                  name="address"
                  placeholder="Сурганы гудамж 12"
                  className="pl-8"
                  defaultValue={initialProfile?.address ?? ""}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="website_url"
              className="text-xs font-medium text-muted-foreground"
            >
              Вебсайт
            </label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="website_url"
                name="website_url"
                placeholder="https://example.com"
                className="pl-8"
                defaultValue={initialProfile?.website_url ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-xs font-medium text-muted-foreground"
            >
              Тайлбар
            </label>
            <Textarea
              id="description"
              name="description"
              placeholder="Танай байгууллагын тухай товч тайлбар"
              rows={3}
              defaultValue={initialProfile?.description ?? ""}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Хадгалж байна..." : "Хадгалах"}
            </Button>
            {state?.error && (
              <p className="text-xs text-destructive">{state.error}</p>
            )}
            {state?.success && (
              <p className="text-xs text-emerald-600">
                Амжилттай хадгалагдлаа.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
