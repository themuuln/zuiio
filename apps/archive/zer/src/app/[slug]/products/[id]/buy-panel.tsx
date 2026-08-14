"use client";

import { FacebookLogo, TelegramLogo } from "@phosphor-icons/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PublicVariant } from "./page";

/**
 * Price card + variant selector + add-to-cart for the public product page.
 * Variant selection is URL-driven (?variant=<id>) so it survives navigation;
 * the selected variant's price drives the add-to-cart unitPrice.
 */
export function BuyPanel({
  slug,
  productId,
  productName,
  basePrice,
  unit,
  currency,
  variants,
  soldOut = false,
  messengerPageHandle = null,
}: {
  slug: string;
  productId: string;
  productName: string;
  basePrice: number;
  unit: string | null;
  currency: string;
  variants: PublicVariant[];
  soldOut?: boolean;
  messengerPageHandle?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read at render time so tests can stub it; Next.js inlines NEXT_PUBLIC_*
  // vars at build regardless of where they are read.
  const telegramBotUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  // Default selection = first variant; a ?variant=<id> param overrides it.
  const urlVariantId = searchParams.get("variant");
  const selectedVariant =
    variants.find((v) => v.id === urlVariantId) ?? variants[0] ?? null;
  const unitPrice = selectedVariant
    ? Number(selectedVariant.sale_price ?? basePrice)
    : basePrice;

  const selectVariant = (variantId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("variant", variantId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Public storefront exposes no stock — never block on stock data.
  const item = {
    productId,
    name: productName,
    unitPrice,
    unit: unit ?? "ширхэг",
    maxStock: Number.POSITIVE_INFINITY,
    ...(selectedVariant
      ? {
          variantId: selectedVariant.id,
          variantLabels:
            selectedVariant.option_labels ?? selectedVariant.sku ?? "Вариант",
        }
      : {}),
  };

  return (
    <div className="space-y-4">
      {/* Price */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Үнэ
        </p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
          {formatCurrency(unitPrice)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{currency}</p>
      </div>

      {/* Variant selector */}
      {variants.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Вариант
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = variant.id === selectedVariant?.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => selectVariant(variant.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/80 bg-card hover:border-foreground/40",
                  )}
                >
                  <span className="font-medium">
                    {variant.option_labels ?? variant.sku ?? "Вариант"}
                  </span>
                  <span className="ml-2 tabular-nums opacity-80">
                    {formatCurrency(Number(variant.sale_price ?? basePrice))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add to cart — variant selectors stay functional; the add action is
          replaced by a disabled "Дууссан" state when the product is sold out. */}
      {soldOut ? (
        <Button disabled size="lg" className="w-full">
          Дууссан
        </Button>
      ) : (
        <AddToCartButton item={item} size="lg" className="w-full" />
      )}

      {/* AI chat commerce — order this product over Telegram. The deep link
          binds the buyer's chat to this shop (t.me/<bot>?start=<slug>). */}
      {telegramBotUsername && (
        <a
          href={`https://t.me/${telegramBotUsername}?start=${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full",
          )}
        >
          <TelegramLogo />
          Telegram-ээр захиалах
        </a>
      )}

      {/* AI chat commerce via Messenger — the deep link carries the shop
          slug as the referral ref (m.me/<page>?ref=<slug>). */}
      {messengerPageHandle && (
        <a
          href={`https://m.me/${messengerPageHandle}?ref=${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "w-full",
          )}
        >
          <FacebookLogo />
          Messenger-ээр захиалах
        </a>
      )}
    </div>
  );
}
