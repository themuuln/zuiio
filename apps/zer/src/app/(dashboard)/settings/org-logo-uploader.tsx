"use client";

import { Spinner, Trash, UploadSimple } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/compress-image";
import { createClient } from "@/lib/supabase/client";
import { updateOrgLogo } from "./actions";

type OrgLogoUploaderProps = {
  logoUrl: string | null;
  organizationName: string;
};

export function OrgLogoUploader({
  logoUrl: initialLogoUrl,
  organizationName,
}: OrgLogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [uploading, setUploading] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return updateOrgLogo(null);
    },
    onSuccess: (result) => {
      if (result && "error" in result) {
        toast.error(result.error);
      } else {
        setLogoUrl(null);
        toast.success("Лого амжилттай устгагдлаа.");
      }
    },
    onError: () => {
      toast.error("Лого устгахад алдаа гарлаа.");
    },
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        file.type,
      )
    ) {
      toast.error("Зөвхөн PNG, JPEG, WebP, SVG формат дэмжигдэнэ.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const supabase = createClient();
      const ext = compressed.name.split(".").pop();
      const filePath = `logos/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("brand_assets")
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("brand_assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      const result = await updateOrgLogo(publicUrl);
      if (result && "error" in result) {
        toast.error(result.error);
        return;
      }

      setLogoUrl(publicUrl);
      toast.success("Лого амжилттай байршууллаа.");
    } catch (err) {
      toast.error("Лого байршуулахад алдаа гарлаа.");
      capture(err, { context: "org logo upload" });
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium">Байгууллагын лого</h4>
        <p className="text-xs text-muted-foreground">
          PNG, JPEG, WebP, SVG — автомат шахагдсан
        </p>
      </div>

      <div className="flex items-center gap-4">
        {logoUrl ? (
          <div className="flex size-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
            <img
              src={logoUrl}
              alt={`${organizationName} лого`}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex size-20 items-center justify-center rounded-lg border border-dashed bg-muted/50">
            <UploadSimple className="size-6 text-muted-foreground" />
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
                {logoUrl ? "Лого солих" : "Лого байршуулах"}
              </>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </Button>
          {logoUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Spinner className="size-4 animate-spin" />
                  Устгаж байна...
                </>
              ) : (
                <>
                  <Trash className="size-4" />
                  Устгах
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
