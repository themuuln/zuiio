import { Image, ImageSquare, Sparkle } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ProductAiActionsProps {
  productId: string;
  productName: string;
  imageUrl?: string | null;
  onEnhanceImage?: () => void;
}

export function ProductAiActions({
  productId,
  productName,
  imageUrl,
  onEnhanceImage,
}: ProductAiActionsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
        <Sparkle className="size-3.5" />
        AI хэрэгслүүд
      </h4>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link
            href={`/ai/poster?product=${productId}&name=${encodeURIComponent(productName)}`}
          >
            <ImageSquare className="size-3.5" />
            Постер
          </Link>
        </Button>
        {imageUrl && (
          <Button variant="outline" size="sm" onClick={onEnhanceImage}>
            <Image className="size-3.5" />
            Зураг сайжруулах
          </Button>
        )}
      </div>
    </div>
  );
}
