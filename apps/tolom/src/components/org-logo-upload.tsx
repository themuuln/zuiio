"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface OrgLogoUploadProps {
  orgId: string;
  logoUrl: string | null;
  orgName: string;
  onLogoChange: (url: string | null) => void;
}

export default function OrgLogoUpload({
  orgId,
  logoUrl,
  orgName,
  onLogoChange,
}: OrgLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const t = useTranslations("organization");

  async function uploadFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("logo.sizeError"));
      return;
    }

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast.error(t("logo.typeError"));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const filePath = `${orgId}/logo`;

      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) throw new Error(t("logo.uploadFailed"));

      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: urlData.publicUrl }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? t("logo.saveFailed"));
      }

      onLogoChange(urlData.publicUrl);
      toast.dismiss();
      toast.success(t("logo.uploaded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("logo.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0];
      if (file) uploadFile(file);
    },
    [uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
      "image/svg+xml": [".svg"],
    },
    maxFiles: 1,
    disabled: uploading,
    noClick: true,
    noKeyboard: true,
  });

  async function handleRemove() {
    setUploading(true);
    try {
      const supabase = createClient();
      await supabase.storage.from("org-logos").remove([`${orgId}/logo`]);

      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: null }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message ?? t("logo.removeFailed"));
      }

      onLogoChange(null);
      toast.dismiss();
      toast.success(t("logo.removed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("logo.removeFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div
        {...getRootProps()}
        className={`relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/10"
            : "border-border bg-muted"
        } ${uploading ? "cursor-default" : "cursor-pointer"}`}
      >
        <input {...getInputProps()} />
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={t("logo.altText", { name: orgName })}
            width={64}
            height={64}
            className="size-full object-contain p-1"
            unoptimized
          />
        ) : (
          <span className="text-lg font-semibold text-muted-foreground">
            {orgName.charAt(0).toUpperCase()}
          </span>
        )}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20 text-xs font-medium text-primary">
            Drop
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById("org-dropzone-input")?.click()}
          disabled={uploading}
        >
          <Camera className="mr-1.5 size-3.5" />
          {logoUrl ? t("logo.changeLogo") : t("logo.uploadLogo")}
        </Button>
        {logoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={uploading}
            className="text-muted-foreground"
          >
            <Trash2 className="mr-1.5 size-3.5" />
            {t("logo.remove")}
          </Button>
        )}
      </div>
    </div>
  );
}
