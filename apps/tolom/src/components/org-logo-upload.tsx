"use client";

import { useOrgMutation } from "@zuiio/query";
import { reportServerError } from "@/lib/sentry-report-server";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
    onSuccess: (_data, vars) => {
      onLogoChange(vars.logoUrl);
      toast.dismiss();
      toast.success(vars.logoUrl ? t("logo.uploaded") : t("logo.removed"));
    },
  });

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("logo.sizeError"));
        return;
      }

      const allowed = [
        "image/png",
        "image/jpeg",
        "image/webp",
        "image/svg+xml",
      ];
      if (!allowed.includes(file.type)) {
        toast.error(t("logo.typeError"));
        return;
      }

      try {
        // 1. Upload to Supabase Storage via server proxy
        const formData = new FormData();
        formData.append("file", file, file.name);
        formData.append(
          "metadata",
          JSON.stringify({
            orgId,
            fileName: file.name,
            mimeType: file.type,
            fileSize: file.size,
            entityType: "logos",
            entityId: orgId,
          }),
        );

        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error?.message ?? "Failed to upload");
        }
        const { data } = await res.json();

        // 2. Update org logo with public URL, use blob URL for instant preview
        const previewUrl = URL.createObjectURL(file);
        updateLogo.mutate({ logoUrl: data.url });
        onLogoChange(previewUrl);
      } catch (err) {
    reportServerError("Unexpected error", err);
        toast.error(
          err instanceof Error ? err.message : t("logo.uploadFailed"),
        );
      }
    },
    [orgId, updateLogo, onLogoChange, t],
  );

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
      // Delete from R2 if it's an R2-stored logo
      if (logoUrl?.startsWith("r2:")) {
        const key = logoUrl.slice(3);
        await fetch(`/api/storage/object?key=${encodeURIComponent(key)}`, {
          method: "DELETE",
        });
      }
      updateLogo.mutate({ logoUrl: null });
    } catch (err) {
    reportServerError("Unexpected error", err);
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
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={t("logo.altText", { name: orgName })}
            className="size-full object-contain p-1"
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
