"use client";

import { Camera, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useOrgMutation } from "@zuiio/query";

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
  const t = useTranslations("organization");

  const updateLogo = useOrgMutation({
    endpoint: `/api/organizations/${orgId}`,
    method: "PATCH",
    queryKey: ["organizations", orgId],
    bodyFn: (vars: { logoUrl: string | null }) => ({ logoUrl: vars.logoUrl }),
    onSuccess: (data, vars) => {
      onLogoChange(vars.logoUrl);
      toast.dismiss();
      toast.success(vars.logoUrl ? t("logo.uploaded") : t("logo.removed"));
    },
  });

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

      updateLogo.mutate({ logoUrl: urlData.publicUrl });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("logo.uploadFailed"));
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
    disabled: updateLogo.isPending,
    noClick: true,
    noKeyboard: true,
  });

  async function handleRemove() {
    try {
      const supabase = createClient();
      await supabase.storage.from("org-logos").remove([`${orgId}/logo`]);

      updateLogo.mutate({ logoUrl: null });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("logo.removeFailed"));
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
        } ${updateLogo.isPending ? "cursor-default" : "cursor-pointer"}`}
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
        {updateLogo.isPending && (
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
          disabled={updateLogo.isPending}
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
            disabled={updateLogo.isPending}
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
