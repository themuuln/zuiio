"use client";

import {
  CheckCircle,
  Envelope,
  FacebookLogo,
  Globe,
  Image,
  InstagramLogo,
  LinkedinLogo,
  Link as LinkIcon,
  MapPin,
  Phone,
  Spinner,
  TiktokLogo,
  Trash,
  UploadSimple,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  updatePublicProfile,
  verifyCustomDomain,
} from "@/app/(dashboard)/settings/organization/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

const DAY_LABELS: Record<string, string> = {
  Monday: "Даваа",
  Tuesday: "Мягмар",
  Wednesday: "Лхагва",
  Thursday: "Пүрэв",
  Friday: "Баасан",
  Saturday: "Бямба",
  Sunday: "Ням",
};

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", Icon: FacebookLogo },
  { key: "instagram", label: "Instagram", Icon: InstagramLogo },
  { key: "twitter", label: "Twitter / X", Icon: XLogo },
  { key: "youtube", label: "YouTube", Icon: YoutubeLogo },
  { key: "tiktok", label: "TikTok", Icon: TiktokLogo },
  { key: "linkedin", label: "LinkedIn", Icon: LinkedinLogo },
] as const;

type PublicProfile = {
  catalog_enabled: boolean;
  display_name: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  website_url: string | null;
  logo_url: string | null;
  banner_url: string | null;
  business_hours: Record<string, string> | null;
  ga_measurement_id: string | null;
  meta_description: string | null;
  meta_pixel_id: string | null;
  meta_title: string | null;
  og_image_url: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  policies: string | null;
  social_links: Record<string, string> | null;
};

function ImageUploadField({
  label,
  description,
  currentUrl,
  storagePath,
  onUrlChange,
}: {
  label: string;
  description: string;
  currentUrl: string | null;
  storagePath: string;
  onUrlChange: (url: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        file.type,
      )
    ) {
      toast.error("Зөвхөн PNG, JPEG, WebP, SVG файл байршуулах боломжтой.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop();
      const filePath = `${storagePath}/${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from("brand_assets")
        .upload(filePath, compressed);
      if (error) throw error;

      const { data } = supabase.storage
        .from("brand_assets")
        .getPublicUrl(filePath);

      onUrlChange(data.publicUrl);
    } catch (err) {
      capture(err, { context: "public profile image upload" });
      toast.error("Зураг байршуулахад алдаа гарлаа.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{description}</p>
      <div className="flex items-start gap-3">
        {currentUrl ? (
          <div className="relative overflow-hidden rounded-lg border bg-muted">
            {storagePath === "logos" ? (
              <div className="flex size-20 items-center justify-center">
                <OptimizedImage
                  src={currentUrl}
                  alt={label}
                  width={80}
                  height={80}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-24 w-48">
                <OptimizedImage
                  src={currentUrl}
                  alt={label}
                  className="h-full w-full object-cover"
                  width={384}
                  height={96}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg border border-dashed bg-muted/50">
            <Image className="size-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            className="relative"
          >
            {uploading ? (
              <>
                <Spinner className="size-4 animate-spin" />
                Байршуулж байна...
              </>
            ) : (
              <>
                <UploadSimple className="size-4" />
                {currentUrl ? "Солих" : "Байршуулах"}
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleUpload}
              disabled={uploading}
            />
          </Button>
          {currentUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => onUrlChange(null)}
              disabled={uploading}
            >
              <Trash className="size-3" />
              Устгах
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PublicProfileSettings({
  slug,
  initialProfile,
}: {
  slug: string;
  initialProfile?: PublicProfile | null;
}) {
  useOrgSettings();
  const [state, formAction, isPending] = useActionState(
    updatePublicProfile,
    undefined,
  );
  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    verifyCustomDomain,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Controlled state for images and complex inputs (not easily represented in plain form inputs)
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialProfile?.logo_url ?? null,
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialProfile?.banner_url ?? null,
  );

  // Business hours state
  const [businessHours, setBusinessHours] = useState<Record<string, string>>(
    () => {
      if (initialProfile?.business_hours) {
        return Object.fromEntries(
          DAY_LABELS_ORDER.map((day) => [
            day,
            initialProfile.business_hours?.[day] ?? "",
          ]),
        );
      }
      return Object.fromEntries(DAY_LABELS_ORDER.map((day) => [day, ""]));
    },
  );

  // Social links state
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(() => {
    const links: Record<string, string> = {};
    for (const { key } of SOCIAL_PLATFORMS) {
      links[key] = initialProfile?.social_links?.[key] ?? "";
    }
    return links;
  });

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  const handleFormSubmit = async (formData: FormData) => {
    // Append controlled values to form data
    if (logoUrl) formData.set("logo_url", logoUrl);
    else formData.set("logo_url", "");

    if (bannerUrl) formData.set("banner_url", bannerUrl);
    else formData.set("banner_url", "");

    // Business hours as JSON
    const filledHours: Record<string, string> = {};
    for (const [day, hours] of Object.entries(businessHours)) {
      if (hours.trim()) {
        filledHours[day] = hours.trim();
      }
    }
    formData.set(
      "business_hours",
      Object.keys(filledHours).length > 0 ? JSON.stringify(filledHours) : "",
    );

    // Social links
    for (const { key } of SOCIAL_PLATFORMS) {
      const url = socialLinks[key]?.trim();
      if (url) {
        formData.set(`social_${key}`, url);
      }
    }

    return formAction(formData);
  };

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
              href={`/${slug}`}
              target="_blank"
              className="text-xs text-primary hover:underline"
            >
              Нийтийн хуудас харах →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleFormSubmit} className="space-y-6">
          {/* Catalog enable */}
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
          <p className="-mt-4 ml-7 text-xs text-muted-foreground">
            Идэвхижүүлбэл танай бүтээгдэхүүний каталог нийтийн хуудаснаа
            харагдана.
          </p>

          <Separator />

          {/* Logo & Banner */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Зурагнууд</h3>
            <ImageUploadField
              label="Лого"
              description="Дөрвөлжин зураг — 80×80px хэмжээтэй харуулна"
              currentUrl={logoUrl}
              storagePath="logos"
              onUrlChange={setLogoUrl}
            />
            <ImageUploadField
              label="Баннер"
              description="Хэвтээ зураг — дэвсгэр зураг болон харуулна"
              currentUrl={bannerUrl}
              storagePath="banners"
              onUrlChange={setBannerUrl}
            />
          </div>

          <Separator />

          {/* Basic Info */}
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

          <Separator />

          {/* Analytics & SEO */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Аналитик & SEO</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="ga_measurement_id"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Google Analytics ID
                </label>
                <Input
                  id="ga_measurement_id"
                  name="ga_measurement_id"
                  placeholder="G-XXXXXXXXXX"
                  defaultValue={initialProfile?.ga_measurement_id ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="meta_pixel_id"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Meta Pixel ID
                </label>
                <Input
                  id="meta_pixel_id"
                  name="meta_pixel_id"
                  placeholder="1234567890"
                  defaultValue={initialProfile?.meta_pixel_id ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="meta_title"
                className="text-xs font-medium text-muted-foreground"
              >
                SEO гарчиг
              </label>
              <Input
                id="meta_title"
                name="meta_title"
                placeholder="Хайлтын системд харагдах гарчиг"
                defaultValue={initialProfile?.meta_title ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="meta_description"
                className="text-xs font-medium text-muted-foreground"
              >
                SEO тайлбар
              </label>
              <Textarea
                id="meta_description"
                name="meta_description"
                placeholder="Хайлтын системд харагдах тайлбар"
                rows={3}
                defaultValue={initialProfile?.meta_description ?? ""}
              />
            </div>
          </div>

          <Separator />

          {/* Custom Domain */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Өөрийн домэйн</h3>
            <div className="space-y-1.5">
              <label
                htmlFor="custom_domain"
                className="text-xs font-medium text-muted-foreground"
              >
                Домэйн (жишээ: shop.mydomain.mn)
              </label>
              <Input
                id="custom_domain"
                name="custom_domain"
                placeholder="shop.mydomain.mn"
                defaultValue={initialProfile?.custom_domain ?? ""}
              />
              <p className="text-xs text-muted-foreground">
                Нийтийн дэлгүүр энэ домэйноор нээгдэнэ. Домэйнээ энэ апп руу
                чиглүүлж (CNAME эсвэл A бичлэг), доорх TXT бичлэгийг DNS
                тохиргоондоо нэмээд "Баталгаажуулах" товчийг дарна уу.
              </p>
            </div>
            <div className="space-y-2">
              {initialProfile?.domain_verified ? (
                <Badge variant="outline" className="text-emerald-600">
                  <CheckCircle className="size-3" weight="fill" />
                  Домэйн баталгаажсан
                </Badge>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Домэйн эзэмшиж буйгаа баталгаажуулахын тулд DNS TXT бичлэг
                  нэмнэ үү:
                </p>
              )}
              {verifyState?.token && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    TXT бичлэгийн утга
                  </p>
                  <code className="block w-fit break-all rounded-md bg-muted px-3 py-2 text-xs">
                    zer-verify={verifyState.token}
                  </code>
                </div>
              )}
              <form action={verifyFormAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <Spinner className="size-3 animate-spin" />
                      Шалгаж байна...
                    </>
                  ) : (
                    "Баталгаажуулах"
                  )}
                </Button>
              </form>
              {verifyState?.verified && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle className="size-3.5" weight="fill" />
                  Домэйн амжилттай баталгаажуулсан.
                </p>
              )}
              {verifyState?.error && (
                <p className="text-xs text-destructive">{verifyState.error}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Business Hours */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Ажлын цаг</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {DAY_LABELS_ORDER.map((day) => (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-muted-foreground">
                    {DAY_LABELS[day]}
                  </span>
                  <Input
                    placeholder="09:00-18:00"
                    className="h-8 text-xs"
                    value={businessHours[day]}
                    onChange={(e) =>
                      setBusinessHours((prev) => ({
                        ...prev,
                        [day]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Сошиал холбоосууд</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {SOCIAL_PLATFORMS.map(({ key, label, Icon }) => (
                <div key={key} className="relative">
                  <Icon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={`${label} URL`}
                    className="h-9 pl-8 text-xs"
                    value={socialLinks[key]}
                    onChange={(e) =>
                      setSocialLinks((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Policies */}
          <div className="space-y-1.5">
            <label
              htmlFor="policies"
              className="text-xs font-medium text-muted-foreground"
            >
              Бодлого
            </label>
            <Textarea
              id="policies"
              name="policies"
              placeholder="Буцаалт, хүргэлт, баталгаат хугацааны нөхцөл..."
              rows={4}
              defaultValue={initialProfile?.policies ?? ""}
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

const DAY_LABELS_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
