"use client";

import {
  CheckCircle,
  CopySimple,
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
  type CheckDnsState,
  checkAdminDomainDns,
  checkCustomDomainDns,
  updatePublicProfile,
  type VerifyDomainState,
  verifyAdminDomain,
  verifyCustomDomain,
} from "@/app/(dashboard)/settings/organization/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { compressImage } from "@/lib/compress-image";
import { deriveDomainVerificationToken } from "@/lib/domain-verify";
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
  admin_domain: string | null;
  admin_domain_verified: boolean;
  policies: string | null;
  social_links: Record<string, string> | null;
  delivery_fee_amount?: string | null;
  free_delivery_threshold?: string | null;
  estimated_delivery_hours?: number | null;
  delivery_enabled?: boolean;
  pickup_enabled?: boolean;
  show_stock?: boolean;
  payment_bank_name?: string | null;
  payment_bank_account?: string | null;
  payment_account_name?: string | null;
  qpay_qr_url?: string | null;
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
      <p className="text-xs text-muted-foreground">{description}</p>
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

function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (non-secure context) — value stays visible.
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <code className="block w-fit max-w-full break-all rounded-md bg-muted px-3 py-2 text-xs">
        {value}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={copy}
      >
        <CopySimple className="size-3.5" weight="bold" />
        {copied ? "Хуулсан" : (label ?? "Хуулах")}
      </Button>
    </div>
  );
}

function dnsRecordForDomain(domain: string): {
  type: "A" | "CNAME";
  name: string;
  value: string;
} {
  const dots = domain.split(".").length - 1;
  if (dots <= 1 && !domain.startsWith("www.")) {
    return { type: "A", name: "@", value: "76.76.21.21" };
  }
  return {
    type: "CNAME",
    name: domain.split(".")[0],
    value: "cname.vercel-dns.com",
  };
}

/**
 * Self-service custom domain card shared by the storefront domain
 * (custom_domain) and the ERP domain (admin_domain): TXT ownership proof,
 * Vercel attach status, and the DNS-pointing check. Behavior is identical
 * for both roles — only labels and the action state differ.
 */
function DomainSetupCard({
  title,
  label,
  description,
  inputId,
  inputName,
  placeholder,
  value,
  onValueChange,
  verified,
  verifiedDomain,
  txtValue,
  liveMessage,
  verifyState,
  dnsState,
  verifyFormAction,
  dnsFormAction,
  isVerifying,
  isCheckingDns,
}: {
  title: string;
  label: string;
  description: string;
  inputId: string;
  inputName: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  verified: boolean;
  verifiedDomain: string | null;
  txtValue: string;
  liveMessage: string;
  verifyState: VerifyDomainState | undefined;
  dnsState: CheckDnsState | undefined;
  verifyFormAction: (formData: FormData) => void;
  dnsFormAction: (formData: FormData) => void;
  isVerifying: boolean;
  isCheckingDns: boolean;
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-muted-foreground"
        >
          {label}
        </label>
        <Input
          id={inputId}
          name={inputName}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange(e.target.value.toLowerCase())}
        />
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Step 1 — TXT ownership */}
      {value.trim() && (
        <div className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-medium text-muted-foreground">
            TXT бичлэг нэмнэ үү:
          </p>
          <CopyField value={txtValue} label="TXT хуулах" />
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
        </div>
      )}
      {verifyState?.vercelError && (
        <p className="text-xs text-amber-600">
          Домэйн баталгаажсан, гэхдээ Vercel-д холбоход алдаа гарлаа. Доорх "DNS
          шалгах" товчийг дараад дахин оролдоно уу.
        </p>
      )}
      {verifyState?.error && (
        <p className="text-xs text-destructive">{verifyState.error}</p>
      )}

      {/* Step 2 — point DNS at Vercel */}
      {(verified || verifyState?.verified) && (
        <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle className="size-4" weight="fill" />
            Домэйн баталгаажсан
          </p>
          {(() => {
            const record = verifiedDomain
              ? dnsRecordForDomain(verifiedDomain)
              : null;
            return record ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Одоо DNS бичлэгээ нэмээд Vercel рүү чиглүүлнэ үү:
                </p>
                <div className="space-y-1">
                  <CopyField
                    value={`${record.type} ${record.name} → ${record.value}`}
                    label="Бичлэг хуулах"
                  />
                  <p className="text-xs text-muted-foreground">
                    {record.type === "A"
                      ? "Дээрх A бичлэгийг домэйнийнхээ DNS тохиргоонд нэмнэ үү."
                      : "Дээрх CNAME бичлэгийг домэйнийнхээ DNS тохиргоонд нэмнэ үү."}
                  </p>
                </div>
              </div>
            ) : null;
          })()}
          <form action={dnsFormAction}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isCheckingDns}
            >
              {isCheckingDns ? (
                <>
                  <Spinner className="size-3 animate-spin" />
                  Шалгаж байна...
                </>
              ) : (
                "DNS шалгах"
              )}
            </Button>
          </form>
          {dnsState?.live && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle className="size-3.5" weight="fill" />
              {liveMessage}
            </p>
          )}
          {dnsState?.success && !dnsState?.live && (
            <p className="text-xs text-muted-foreground">
              DNS тархаж байна. Хэдэн минутын дараа дахин шалгана уу.
            </p>
          )}
          {dnsState?.error && (
            <p className="text-xs text-destructive">{dnsState.error}</p>
          )}
        </div>
      )}
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
  const { organizationId } = useOrgSettings();
  const [state, formAction, isPending] = useActionState(
    updatePublicProfile,
    undefined,
  );
  const [verifyState, verifyFormAction, isVerifying] = useActionState(
    verifyCustomDomain,
    undefined,
  );
  const [dnsState, dnsFormAction, isCheckingDns] = useActionState(
    checkCustomDomainDns,
    undefined,
  );
  const [adminVerifyState, adminVerifyFormAction, isVerifyingAdmin] =
    useActionState(verifyAdminDomain, undefined);
  const [adminDnsState, adminDnsFormAction, isCheckingAdminDns] =
    useActionState(checkAdminDomainDns, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Controlled state for images and complex inputs (not easily represented in plain form inputs)
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialProfile?.logo_url ?? null,
  );
  const [bannerUrl, setBannerUrl] = useState<string | null>(
    initialProfile?.banner_url ?? null,
  );
  const [customDomainInput, setCustomDomainInput] = useState<string>(
    initialProfile?.custom_domain ?? "",
  );
  const [adminDomainInput, setAdminDomainInput] = useState<string>(
    initialProfile?.admin_domain ?? "",
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

  // Delivery, pickup & stock toggles (persisted as "true"/"false" strings)
  const [deliveryEnabled, setDeliveryEnabled] = useState(
    initialProfile?.delivery_enabled ?? false,
  );
  const [pickupEnabled, setPickupEnabled] = useState(
    initialProfile?.pickup_enabled ?? false,
  );
  const [showStock, setShowStock] = useState(
    initialProfile?.show_stock ?? false,
  );

  useEffect(() => {
    if (state?.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state?.success]);

  const handleFormSubmit = async (formData: FormData) => {
    // Validate delivery fee fields (non-negative numbers)
    for (const name of ["delivery_fee_amount", "free_delivery_threshold"]) {
      const raw = String(formData.get(name) ?? "");
      if (raw.trim() === "") continue;
      const value = Number(raw);
      if (Number.isNaN(value) || value < 0) {
        toast.error(
          name === "delivery_fee_amount"
            ? "Хүргэлтийн төлбөр 0-ээс багагүй тоо байх ёстой."
            : "Үнэгүй хүргэлтийн босго 0-ээс багагүй тоо байх ёстой.",
        );
        return;
      }
    }

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

          {/* Custom Domain (storefront) */}
          <DomainSetupCard
            title="Өөрийн домэйн (дэлгүүр)"
            label="Домэйн (жишээ: shop.mydomain.mn)"
            description={
              'Нийтийн дэлгүүр энэ домэйноор нээгдэнэ. Домэйнээ хадгалаад доорх TXT бичлэгийг DNS тохиргоондоо нэмж, "Баталгаажуулах" товчийг дарна уу.'
            }
            inputId="custom_domain"
            inputName="custom_domain"
            placeholder="shop.mydomain.mn"
            value={customDomainInput}
            onValueChange={setCustomDomainInput}
            verified={initialProfile?.domain_verified ?? false}
            verifiedDomain={
              initialProfile?.custom_domain?.trim().toLowerCase() ?? null
            }
            txtValue={`zer-verify=${deriveDomainVerificationToken(organizationId)}`}
            liveMessage="Холбогдсон ✓ Дэлгүүр таны домэйноор нээгдэж байна."
            verifyState={verifyState}
            dnsState={dnsState}
            verifyFormAction={verifyFormAction}
            dnsFormAction={dnsFormAction}
            isVerifying={isVerifying}
            isCheckingDns={isCheckingDns}
          />

          <Separator />

          {/* Admin (ERP) Domain */}
          <DomainSetupCard
            title="ERP домэйн"
            label="Домэйн (жишээ: erp.mydomain.mn)"
            description={
              'ERP самбар энэ домэйноор нээгдэнэ. Домэйнээ хадгалаад доорх TXT бичлэгийг DNS тохиргоондоо нэмж, "Баталгаажуулах" товчийг дарна уу.'
            }
            inputId="admin_domain"
            inputName="admin_domain"
            placeholder="erp.mydomain.mn"
            value={adminDomainInput}
            onValueChange={setAdminDomainInput}
            verified={initialProfile?.admin_domain_verified ?? false}
            verifiedDomain={
              initialProfile?.admin_domain?.trim().toLowerCase() ?? null
            }
            txtValue={`zer-verify=${deriveDomainVerificationToken(organizationId)}`}
            liveMessage="Холбогдсон ✓ ERP таны домэйноор нээгдэж байна."
            verifyState={adminVerifyState}
            dnsState={adminDnsState}
            verifyFormAction={adminVerifyFormAction}
            dnsFormAction={adminDnsFormAction}
            isVerifying={isVerifyingAdmin}
            isCheckingDns={isCheckingAdminDns}
          />

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

          <Separator />

          {/* Delivery & Pickup */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Хүргэлт ба хүлээн авалт</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label
                  htmlFor="delivery_enabled"
                  className="text-sm font-medium leading-none"
                >
                  Хүргэлтийн захиалга авах
                </label>
              </div>
              <Switch
                checked={deliveryEnabled}
                onCheckedChange={setDeliveryEnabled}
              />
              <input
                type="hidden"
                name="delivery_enabled"
                value={deliveryEnabled ? "true" : "false"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="delivery_fee_amount"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Хүргэлтийн төлбөр (₮)
                </label>
                <Input
                  id="delivery_fee_amount"
                  name="delivery_fee_amount"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  defaultValue={initialProfile?.delivery_fee_amount ?? "0"}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="free_delivery_threshold"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Үнэгүй хүргэлтийн босго (₮)
                </label>
                <Input
                  id="free_delivery_threshold"
                  name="free_delivery_threshold"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  defaultValue={initialProfile?.free_delivery_threshold ?? "0"}
                />
                <p className="text-xs text-muted-foreground">
                  Энэ дүнгээс дээш захиалга үнэгүй хүргэгдэнэ. 0 = үнэгүй
                  хүргэлтгүй
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="estimated_delivery_hours"
                className="text-xs font-medium text-muted-foreground"
              >
                Ойролцоо хүргэлтийн хугацаа (цаг)
              </label>
              <Input
                id="estimated_delivery_hours"
                name="estimated_delivery_hours"
                type="number"
                min={1}
                step={1}
                placeholder="24"
                defaultValue={
                  initialProfile?.estimated_delivery_hours?.toString() ?? ""
                }
              />
              <p className="text-xs text-muted-foreground">
                Худалдан авагчид хүргэлтийн ойролцоо хугацааг харуулна
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label
                  htmlFor="pickup_enabled"
                  className="text-sm font-medium leading-none"
                >
                  Дэлгүүрээс авах захиалга авах
                </label>
              </div>
              <Switch
                checked={pickupEnabled}
                onCheckedChange={setPickupEnabled}
              />
              <input
                type="hidden"
                name="pickup_enabled"
                value={pickupEnabled ? "true" : "false"}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label
                  htmlFor="show_stock"
                  className="text-sm font-medium leading-none"
                >
                  Худалдан авагчид нөөцийн тоо харуулах
                </label>
                <p className="text-xs text-muted-foreground">
                  Худалдан авагчид барааны нөөц, 'Дууссан' төлөвийг харах
                  боломжтой болно
                </p>
              </div>
              <Switch checked={showStock} onCheckedChange={setShowStock} />
              <input
                type="hidden"
                name="show_stock"
                value={showStock ? "true" : "false"}
              />
            </div>
          </div>

          <Separator />

          {/* Payment information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Төлбөрийн мэдээлэл</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="payment_bank_name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Банкны нэр
                </label>
                <Input
                  id="payment_bank_name"
                  name="payment_bank_name"
                  placeholder="Хаан банк"
                  defaultValue={initialProfile?.payment_bank_name ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="payment_bank_account"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Дансны дугаар
                </label>
                <Input
                  id="payment_bank_account"
                  name="payment_bank_account"
                  placeholder="4000000000"
                  defaultValue={initialProfile?.payment_bank_account ?? ""}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="payment_account_name"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Данс эзэмшигч
                </label>
                <Input
                  id="payment_account_name"
                  name="payment_account_name"
                  placeholder="Байгууллагын нэр"
                  defaultValue={initialProfile?.payment_account_name ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="qpay_qr_url"
                  className="text-xs font-medium text-muted-foreground"
                >
                  QPay QR зурагны URL
                </label>
                <Input
                  id="qpay_qr_url"
                  name="qpay_qr_url"
                  placeholder="https://..."
                  defaultValue={initialProfile?.qpay_qr_url ?? ""}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Худалдан авагчид QPay-ээр төлөхөд энэ зургийг харуулна. Эдгээр
              мэдээлэл QPay болон банкны шилжүүлгийн төлбөрийн аргуудын үед
              төлбөрийн хэсэгт харагдана.
            </p>
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
