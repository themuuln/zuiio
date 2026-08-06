"use client";

import { ImageIcon, Loader2, Star, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAddPartImage,
  usePartImages,
  useRemovePartImage,
  useSetPrimaryImage,
} from "@/lib/queries/use-inventory";
import type { PartImage } from "@/lib/types";

interface PartImagesGalleryProps {
  orgId: string;
  partId: string;
}

export function PartImagesGallery({ orgId, partId }: PartImagesGalleryProps) {
  const t = useTranslations("inventory") as (key: string) => string;
  const [newImageUrl, setNewImageUrl] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: images = [], isPending } = usePartImages(orgId, partId);
  const addImage = useAddPartImage(orgId);
  const removeImage = useRemovePartImage(orgId);
  const setPrimary = useSetPrimaryImage(orgId);

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    await addImage.mutateAsync({
      partId,
      image_url: newImageUrl.trim(),
      is_primary: images.length === 0,
    });
    setNewImageUrl("");
    setShowAdd(false);
  };

  const handleRemoveImage = async (image: PartImage) => {
    await removeImage.mutateAsync({
      partId,
      imageId: image.id,
    });
  };

  const handleSetPrimary = async (imageId: string) => {
    await setPrimary.mutateAsync({ partId, imageId });
  };

  const primary = images.find((img) => img.is_primary);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          {t("images")}
          {images.length > 0 && (
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ({images.length})
            </span>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setShowAdd(!showAdd)}
        >
          <Upload className="size-4" />
          {t("addImage")}
        </Button>
      </CardHeader>
      <CardContent>
        {isPending && images.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 && !showAdd ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <ImageIcon className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t("noImages")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-lg overflow-hidden border bg-muted"
              >
                {primary?.id === image.id && (
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <div className="flex items-center gap-1 rounded-md bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-medium text-yellow-950">
                      <Star className="size-3 fill-current" />
                    </div>
                  </div>
                )}
                <img
                  src={image.image_url}
                  alt={`Part ${image.sort_order + 1}`}
                  className="size-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  {primary?.id !== image.id && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="size-8"
                            onClick={() => handleSetPrimary(image.id)}
                          >
                            <Star className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("setAsPrimary")}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8"
                          onClick={() => handleRemoveImage(image)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("removeImage")}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder={t("imageUrlPlaceholder")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddImage();
              }}
            />
            <Button
              size="sm"
              onClick={handleAddImage}
              disabled={!newImageUrl.trim() || addImage.isPending}
            >
              {addImage.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t("add")
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
