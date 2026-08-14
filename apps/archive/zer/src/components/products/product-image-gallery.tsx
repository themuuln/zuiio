"use client";

import {
  CaretDown,
  CaretUp,
  Plus,
  Star,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import {
  addProductImage,
  removeProductImage,
  reorderProductImages,
} from "@/app/(dashboard)/products/actions";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { compressImage } from "@/lib/compress-image";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ProductImageRow = {
  id: string;
  url: string;
  sort_order: number;
};

const IMAGES_QUERY_KEY = (productId: string) =>
  ["product_images", "by_product", productId] as const;

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ProductImageGallery({
  productId,
  primaryImageUrl,
}: {
  productId: string;
  primaryImageUrl: string | null;
}) {
  const { organizationId } = useOrgSettings();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const imagesQuery = useQuery({
    queryKey: IMAGES_QUERY_KEY(productId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("product_images")
        .select("id, url, sort_order")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ProductImageRow[];
    },
    enabled: !!productId && !!organizationId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: IMAGES_QUERY_KEY(productId) });
  };

  const addMutation = useMutation({
    mutationFn: async (url: string) => {
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("url", url);
      return addProductImage(undefined, formData);
    },
    onSuccess: (result) => {
      if (result && "error" in result) throw new Error(result.error);
      invalidate();
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const formData = new FormData();
      formData.append("id", id);
      return removeProductImage(undefined, formData);
    },
    onSuccess: (result) => {
      if (result && "error" in result) throw new Error(result.error);
      invalidate();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("ordered_ids", JSON.stringify(orderedIds));
      return reorderProductImages(undefined, formData);
    },
    onSuccess: (result) => {
      if (result && "error" in result) throw new Error(result.error);
      invalidate();
    },
  });

  const images = imagesQuery.data ?? [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const accepted = Array.from(files).filter((f) =>
        ACCEPTED_TYPES.includes(f.type),
      );

      const uploadedUrls: string[] = [];
      for (const file of accepted) {
        const compressed = await compressImage(file);
        const ext = compressed.name.split(".").pop();
        const filePath = `products/${productId}/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from("brand_assets")
          .upload(filePath, compressed);
        if (error) throw error;

        const { data } = supabase.storage
          .from("brand_assets")
          .getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }

      for (const url of uploadedUrls) {
        await addMutation.mutateAsync(url);
      }
      if (uploadedUrls.length > 0) {
        toast.success(`${uploadedUrls.length} зураг нэмэгдлээ.`);
      }
    } catch (err) {
      capture(err, { context: "ProductImageGallery: upload" });
      toast.error("Зураг байршуулахад алдаа гарлаа.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeMutation.mutateAsync(id);
      toast.success("Зураг устгагдлаа.");
    } catch {
      toast.error("Зураг устгахад алдаа гарлаа.");
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const next = [...images];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    try {
      await reorderMutation.mutateAsync(next.map((img) => img.id));
    } catch {
      toast.error("Дараалал хадгалахад алдаа гарлаа.");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Зурагнууд</p>
      <div className="flex flex-wrap gap-3">
        {primaryImageUrl && (
          <div className="relative">
            <div className="overflow-hidden rounded-lg border-2 border-primary">
              <OptimizedImage
                src={primaryImageUrl}
                alt="Нүүр зураг"
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
            </div>
            <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-primary px-1.5 py-0.5 text-xs font-medium text-primary-foreground">
              <Star className="size-2.5" weight="fill" /> Нүүр
            </span>
          </div>
        )}
        {images.map((img, index) => (
          <div key={img.id} className="group relative">
            <div className="overflow-hidden rounded-lg border-2 border-border">
              <OptimizedImage
                src={img.url}
                alt={`Зураг ${index + 1}`}
                width={96}
                height={96}
                className="h-24 w-24 object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute -right-1.5 -top-1.5 hidden size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow group-hover:flex"
              title="Устгах"
            >
              <Trash className="size-3" />
            </button>
            <div className="absolute bottom-1 right-1 hidden gap-0.5 group-hover:flex">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  className="flex size-5 items-center justify-center rounded bg-background/80 text-foreground shadow"
                  title="Дээш"
                >
                  <CaretUp className="size-3" />
                </button>
              )}
              {index < images.length - 1 && (
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  className="flex size-5 items-center justify-center rounded bg-background/80 text-foreground shadow"
                  title="Доош"
                >
                  <CaretDown className="size-3" />
                </button>
              )}
            </div>
          </div>
        ))}
        <label
          className={cn(
            "flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60",
            uploading && "cursor-wait opacity-60",
          )}
        >
          {uploading ? (
            <span className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <UploadSimple className="size-5" />
              <span className="mt-1 text-xs">Нэмэх</span>
            </>
          )}
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      {!primaryImageUrl && images.length === 0 && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Plus className="size-3" />
          Зураг нэмнэ үү. Зурагнууд каталогт харуулагдана.
        </p>
      )}
    </div>
  );
}
