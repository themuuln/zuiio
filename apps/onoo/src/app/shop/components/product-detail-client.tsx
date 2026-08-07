"use client";

import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Heart,
  Info,
  LinkIcon,
  MessageCircle,
  Ruler,
  Share2,
  ShoppingBag,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { toast } from "sonner";
import type {
  ProductBundle,
  ProductReview,
  ShopProductRow,
} from "@/app/lib/data-shop";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { submitProductReviewAction } from "../actions/submit-review";
import { OrderDialog } from "./order-dialog";
import { ProductCard } from "./product-card";

interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<number, number>;
}

interface ProductDetailClientProps {
  product: ShopProductRow;
  relatedProducts?: ShopProductRow[];
  reviews?: ProductReview[];
  ratingSummary?: RatingSummary;
  bundles?: ProductBundle[];
}

const SIZE_GUIDE = [
  { size: "S", chest: "86-91", length: "66", waist: "71-76" },
  { size: "M", chest: "91-97", length: "69", waist: "76-81" },
  { size: "L", chest: "97-102", length: "71", waist: "81-86" },
  { size: "XL", chest: "102-107", length: "74", waist: "86-91" },
  { size: "XXL", chest: "107-112", length: "76", waist: "91-97" },
];

const STORAGE_KEY = "onoo_wishlist";

function getWishlist(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function toggleWishlist(id: string): boolean {
  const list = getWishlist();
  const idx = list.indexOf(id);
  if (idx > -1) {
    list.splice(idx, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return false;
  }
  list.push(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return true;
}

function ReviewForm({ productId }: { productId: string }) {
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Үнэлгээ сонгоно уу");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Нэрээ оруулна уу");
      return;
    }
    if (!content.trim()) {
      toast.error("Сэтгэгдлээ бичнэ үү");
      return;
    }

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("authorName", authorName.trim());
    formData.set("rating", String(rating));
    formData.set("content", content.trim());

    const result = await submitProductReviewAction(
      { success: false },
      formData,
    );

    if (result.success) {
      toast.success("Сэтгэгдэл илгээгдлээ, баталгаажсаны дараа харагдана");
      setSubmitted(true);
    } else {
      toast.error(
        result.error ?? "Сэтгэгдэл илгээхэд алдаа гарлаа. Дахиж оролдоно уу.",
      );
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
        <p className="text-sm font-medium text-green-600 dark:text-green-400">
          Сэтгэгдэл илгээгдлээ, баталгаажсаны дараа харагдана
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-xl border border-border/50 bg-[var(--surface-1)] p-6"
    >
      <h3 className="mb-4 font-display text-lg tracking-tight">
        Сэтгэгдэл үлдээх
      </h3>

      <div className="space-y-4">
        {/* Author name */}
        <div>
          <label
            htmlFor="review-author"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Нэр
          </label>
          <input
            id="review-author"
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Таны нэр"
            className="w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-sports)] focus:ring-1 focus:ring-[var(--brand-sports)]"
            maxLength={100}
          />
        </div>

        {/* Star rating selector */}
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Үнэлгээ
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHoverRating(s)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
                aria-label={`${s} од`}
              >
                <Star
                  className={`size-7 ${
                    s <= (hoverRating || rating)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label
            htmlFor="review-content"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Сэтгэгдэл
          </label>
          <textarea
            id="review-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Бүтээгдэхүүний талаарх сэтгэгдлээ хуваалцана уу..."
            rows={4}
            className="w-full resize-none rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-sports)] focus:ring-1 focus:ring-[var(--brand-sports)]"
            maxLength={1000}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {content.length}/1000
          </p>
        </div>

        <Button type="submit" className="w-full">
          Сэтгэгдэл илгээх
        </Button>
      </div>
    </form>
  );
}

export function ProductDetailClient({
  product,
  relatedProducts = [],
  reviews,
  ratingSummary,
  bundles,
}: ProductDetailClientProps) {
  const [imgError, setImgError] = useState<Record<number, boolean>>({});
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeRecOpen, setSizeRecOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recHeight, setRecHeight] = useState<number | null>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const hasVariants = product.variants.length > 0;
  const currentVariant = hasVariants ? product.variants[selectedVariant] : null;
  const hasStock = currentVariant
    ? currentVariant.stock > 0
    : !hasVariants && product.is_available;
  const isClothing = hasVariants;
  const images = product.images ?? [];
  const productUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `/shop/${product.slug}`;

  // Wishlist on mount
  useEffect(() => {
    setWishlisted(getWishlist().includes(product.id));
  }, [product.id]);

  // Sticky buy bar on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-64px 0px 0px 0px" },
    );
    const el = buyRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const handleWishlist = () => {
    const now = toggleWishlist(product.id);
    setWishlisted(now);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        url: productUrl,
      });
    } else {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  // Determine recommended size based on height
  const recSize = hasVariants
    ? recHeight
      ? recHeight <= 160
        ? "S"
        : recHeight <= 170
          ? "M"
          : recHeight <= 180
            ? "L"
            : "XL"
      : null
    : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 pb-24 md:pb-8">
      {/* ── Back link ─────────────────────────────────────────── */}
      <Link
        href="/shop"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Дэлгүүр лүү буцах
      </Link>

      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Нүүр
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-foreground">
          Дэлгүүр
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <span>
              {product.category === "clothing" ? "Хувцас" : "Дагалдах хэрэгсэл"}
            </span>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        {/* ════════════════════════════════════════════════════════
            IMAGE GALLERY
           ════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3">
          {/* Main image */}
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-[var(--surface-2)] to-[var(--surface-1)]">
            {images.length > 0 && !imgError[selectedImage] ? (
              <Image
                src={images[selectedImage] ?? ""}
                alt={`${product.name} — ${selectedImage + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                onError={() =>
                  setImgError((prev) => ({ ...prev, [selectedImage]: true }))
                }
                priority={selectedImage === 0}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-muted-foreground/40">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[var(--surface-2)]">
                  <ShoppingBag className="h-16 w-16" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                  Зураг бэлтгэгдэж байна
                </span>
              </div>
            )}

            {/* Category badge */}
            {product.category && images.length > 0 && (
              <Badge
                variant="secondary"
                className="absolute left-3 top-3 bg-background/80 backdrop-blur-sm"
              >
                {product.category === "clothing" ? "Хувцас" : "Хэрэгсэл"}
              </Badge>
            )}

            {/* Out of stock overlay */}
            {(!product.is_available || !hasStock) && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
                <Badge
                  variant="destructive"
                  className="px-4 py-1.5 text-sm font-semibold"
                >
                  Дууссан
                </Badge>
              </div>
            )}

            {/* Social share buttons */}
            <div className="absolute right-3 top-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleWishlist}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                aria-label={wishlisted ? "Хадгалсан" : "Хадгалах"}
              >
                <Heart
                  className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={handleFacebookShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                aria-label="Facebook хуваалцах"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
                aria-label={copied ? "Хуулагдсан" : "Холбоос хуулах"}
              >
                {copied ? (
                  <LinkIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => {
                    setSelectedImage(i);
                    setImgError((prev) => {
                      const next = { ...prev };
                      delete next[i];
                      return next;
                    });
                  }}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    i === selectedImage
                      ? "border-[var(--brand-sports)] opacity-100"
                      : "border-border/50 opacity-60 hover:opacity-90"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════
            PRODUCT INFO
           ════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-6" ref={buyRef}>
          {/* Name + description */}
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            {product.name_en && (
              <p className="mt-1.5 text-base text-muted-foreground">
                {product.name_en}
              </p>
            )}
          </div>

          {product.description && (
            <p className="leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <Separator />

          {/* SKU */}
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            SKU: ONOO-{product.id.slice(0, 8).toUpperCase()}
          </p>

          {/* Price */}
          <p className="font-display text-4xl tracking-tight text-[var(--brand-sports)]">
            ₮{product.price_mnt.toLocaleString()}
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Үнэгүй хүргэлт
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              1-3 хоногт
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Буцаах боломжтой
            </span>
          </div>

          {/* Variant selector with stock per size */}
          {hasVariants && (
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <p className="text-sm font-medium">Хэмжээ</p>
                {isClothing && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSizeRecOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                    >
                      <Ruler className="h-3 w-3" />
                      Хэмжээгээ мэдэх
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizeGuideOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
                    >
                      <Ruler className="h-3 w-3" />
                      Заавар
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v, i) => {
                  const isSelected = i === selectedVariant;
                  const isOutOfStock = v.stock === 0;
                  const isLow = v.stock > 0 && v.stock <= 3;
                  return (
                    <Button
                      key={v.size}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedVariant(i);
                      }}
                      className={
                        isLow && !isOutOfStock && !isSelected
                          ? "border-orange-500/30 text-orange-600 hover:border-orange-500/50 dark:text-orange-400"
                          : ""
                      }
                    >
                      {v.size}
                      {isOutOfStock && (
                        <span className="ml-1 text-[10px] font-normal text-destructive">
                          Дууссан
                        </span>
                      )}
                    </Button>
                  );
                })}
              </div>
              {recSize && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {recHeight
                    ? `${recHeight} см өндөрт ${recSize} хэмжээ тохиромжтой`
                    : ""}
                </p>
              )}
            </div>
          )}

          {/* Selected variant low-stock warning */}
          {hasVariants &&
            currentVariant &&
            currentVariant.stock > 0 &&
            currentVariant.stock <= 5 && (
              <p className="flex items-center gap-2 text-sm text-orange-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-orange-500" />
                Яараарай! Зөвхөн {currentVariant.stock} ширхэг үлдсэн.
              </p>
            )}

          {/* Quantity + Buy section */}
          {hasStock && product.is_available ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="w-full sm:flex-1"
                onClick={() => setOrderOpen(true)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                Худалдаж авах
              </Button>

              {/* Wishlist button (desktop, inline) */}
              <Button
                variant="outline"
                size="lg"
                onClick={handleWishlist}
                className="hidden sm:inline-flex"
                aria-label={wishlisted ? "Хадгалсан" : "Хадгалах"}
              >
                <Heart
                  className={`mr-2 h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            </div>
          ) : (
            /* Out of stock */
            <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-[var(--surface-1)] p-5">
              <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                <Info className="h-4 w-4" />
                Энэ бүтээгдэхүүн дууссан
              </p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Бараа материал нэмэгдэхэд танд мэдэгдэх боломж хараахан
                нэмэгдээгүй байна. Бусад бүтээгдэхүүнээ үзэх бол дэлгүүр лүү
                буцах.
              </p>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="self-start"
              >
                <Link href="/shop">Бусад бүтээгдэхүүн үзэх</Link>
              </Button>
            </div>
          )}

          {/* ── Payment methods ─────────────────────────────── */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Төлбөрийн хэрэгсэл
            </p>
            <div className="flex flex-wrap gap-2">
              {["QPay", "Visa", "Mastercard", "Банкны шилжүүлэг"].map(
                (method) => (
                  <Badge
                    key={method}
                    variant="secondary"
                    className="text-[11px]"
                  >
                    {method}
                  </Badge>
                ),
              )}
            </div>
          </div>

          {/* Order dialog */}
          <OrderDialog
            open={orderOpen}
            onOpenChange={setOrderOpen}
            productId={product.id}
            variantIndex={selectedVariant}
            priceMnt={product.price_mnt}
            productName={product.name}
            variantSize={currentVariant ? currentVariant.size : "Стандарт"}
          />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          TEAM CARD
         ════════════════════════════════════════════════════════ */}
      {product.team_id && (
        <section className="mt-16">
          <Link
            href={`/teams/${product.team_slug}`}
            className="group flex items-center gap-5 rounded-xl border border-border/50 bg-[var(--surface-1)] p-5 transition-all hover:border-[var(--brand-sports)]/40 hover:bg-[var(--surface-2)]"
          >
            <div
              className="flex size-14 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{
                backgroundColor:
                  product.team_primary_color ?? "var(--brand-sports)",
              }}
            >
              {product.team_short_code ?? "T"}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Багийн бүтээгдэхүүн
              </p>
              <p className="mt-0.5 font-display text-xl tracking-tight group-hover:text-[var(--brand-sports)]">
                {product.team_name}
              </p>
            </div>
            {product.team_primary_color && (
              <div
                className="size-5 shrink-0 rounded-full ring-2 ring-border/30"
                style={{ backgroundColor: product.team_primary_color }}
                title={product.team_primary_color}
              />
            )}
          </Link>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          MATERIAL & CARE SECTION (clothing)
         ════════════════════════════════════════════════════════ */}
      {isClothing && (
        <section className="mt-16">
          <h2 className="mb-4 font-display text-2xl tracking-tight">
            Материал ба арчилгаа
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Материал",
                value: "100% полиэстер, амьсгалдаг торгон нэхмэл",
              },
              {
                label: "Арчилгаа",
                value:
                  "30°C-д угаах, цайруулагч хэрэглэхгүй байх, төмрөөр индүүдэхгүй байх",
              },
              {
                label: "Тохиомж",
                value: "Спорт загвар, regular fit, хөдөлгөөнд саадгүй",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-border/50 bg-[var(--surface-1)] p-5"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  {item.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          PRODUCT DETAILS
         ════════════════════════════════════════════════════════ */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {/* Details */}
        <div className="md:col-span-2">
          <h2 className="mb-4 font-display text-2xl tracking-tight">
            Бүтээгдэхүүний дэлгэрэнгүй
          </h2>
          <div className="rounded-xl border border-border/50 bg-[var(--surface-1)] p-6">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="mb-0.5 font-medium">Ангилал</dt>
                <dd className="text-muted-foreground">
                  {product.category === "clothing"
                    ? "Хувцас"
                    : product.category === "accessories"
                      ? "Дагалдах хэрэгсэл"
                      : "Бусад"}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-medium">Хэмжээнүүд</dt>
                <dd className="text-muted-foreground">
                  {hasVariants
                    ? product.variants.map((v) => v.size).join(", ")
                    : "Стандарт"}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-medium">SKU</dt>
                <dd className="font-mono text-xs text-muted-foreground">
                  ONOO-{product.id.slice(0, 8).toUpperCase()}
                </dd>
              </div>
              <div>
                <dt className="mb-0.5 font-medium">Үнэ</dt>
                <dd className="text-muted-foreground">
                  ₮{product.price_mnt.toLocaleString()}
                </dd>
              </div>
              {product.description && (
                <div className="sm:col-span-2">
                  <dt className="mb-0.5 font-medium">Тодорхойлолт</dt>
                  <dd className="leading-relaxed text-muted-foreground">
                    {product.description}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Shipping info */}
        <div>
          <h2 className="mb-4 font-display text-2xl tracking-tight">Хүргэлт</h2>
          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-[var(--surface-1)] p-6">
            <div className="flex items-start gap-3">
              <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-sports)]" />
              <div>
                <p className="text-sm font-medium">Үнэгүй хүргэлт</p>
                <p className="text-xs text-muted-foreground">
                  50,000₮-с дээш захиалга
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-sports)]" />
              <div>
                <p className="text-sm font-medium">Хүргэлтийн хугацаа</p>
                <p className="text-xs text-muted-foreground">
                  Улаанбаатарт 1-3 хоног, бусад газар 3-7 хоног
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand-sports)]" />
              <div>
                <p className="text-sm font-medium">Буцаалт</p>
                <p className="text-xs text-muted-foreground">
                  14 хоногийн дотор буцаах боломжтой
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          REVIEWS SECTION
         ════════════════════════════════════════════════════════ */}
      <section className="mt-16">
        <h2 className="mb-6 font-display text-2xl tracking-tight">
          Сэтгэгдлүүд
        </h2>
        {ratingSummary && ratingSummary.count > 0 ? (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Rating summary */}
            <div className="md:col-span-1">
              <div className="rounded-xl border border-border/50 bg-[var(--surface-1)] p-6 text-center">
                <p className="font-display text-5xl leading-none tracking-tight">
                  {ratingSummary.average}
                </p>
                <div className="mt-2 flex items-center justify-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`size-5 ${
                        s <= Math.round(ratingSummary.average)
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {ratingSummary.count} сэтгэгдэл
                </p>

                {/* Distribution bars */}
                <div className="mt-6 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratingSummary.distribution[star] ?? 0;
                    const pct =
                      ratingSummary.count > 0
                        ? (count / ratingSummary.count) * 100
                        : 0;
                    return (
                      <div
                        key={star}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-4 text-right text-muted-foreground">
                          {star}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-3)]">
                          <div
                            className="h-full rounded-full bg-yellow-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews list */}
            <div className="flex flex-col gap-4 md:col-span-2">
              {(reviews ?? []).map((review: ProductReview) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-border/50 bg-[var(--surface-1)] p-5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {review.author_name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`size-3.5 ${
                              s <= review.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: mn,
                      })}
                    </span>
                  </div>
                  {review.content && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {review.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Энэ бүтээгдэхүүнд сэтгэгдэл хараахан байхгүй байна. Та анхны
            сэтгэгдлээ үлдээгээрэй!
          </p>
        )}

        {/* Review submission form */}
        <ReviewForm productId={product.id} />
      </section>

      {/* ════════════════════════════════════════════════════════
          BUNDLE SECTION
         ════════════════════════════════════════════════════════ */}
      {(bundles ?? []).length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl tracking-tight">
            Багц санал
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {bundles?.map((bundle: ProductBundle) => (
              <div
                key={bundle.id}
                className="relative overflow-hidden rounded-xl border border-border/50 bg-[var(--surface-1)] p-6"
              >
                {/* Discount badge */}
                <div className="absolute right-3 top-3 rounded-full bg-[var(--brand-sports)] px-2.5 py-1 text-xs font-bold text-white">
                  -{bundle.discount_percent}%
                </div>

                <h3 className="font-display text-xl tracking-tight">
                  {bundle.name}
                </h3>
                {bundle.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {bundle.description}
                  </p>
                )}

                {/* Bundle items */}
                <div className="mt-4 space-y-2">
                  {bundle.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-[var(--surface-2)] px-3 py-2"
                    >
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">
                        ₮{item.price_mnt.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border/30 pt-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="line-through">
                      ₮{bundle.total_original.toLocaleString()}
                    </span>
                  </p>
                  <p className="font-display text-2xl tracking-tight text-[var(--brand-sports)]">
                    ₮{bundle.total_discounted.toLocaleString()}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={`/shop/${bundle.items[0]?.slug ?? ""}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand-sports)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Захиалах
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          RELATED PRODUCTS
         ════════════════════════════════════════════════════════ */}
      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl tracking-tight">
            Санал болгох
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((rp) => (
              <ProductCard key={rp.id} product={rp} />
            ))}
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SIZE GUIDE DIALOG
         ════════════════════════════════════════════════════════ */}
      <Dialog open={sizeGuideOpen} onOpenChange={setSizeGuideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Хэмжээний заавар</DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="pb-2 font-medium">Хэмжээ</th>
                  <th className="pb-2 font-medium">Цээж (см)</th>
                  <th className="pb-2 font-medium">Урт (см)</th>
                  <th className="pb-2 font-medium">Бүсэлхий (см)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_GUIDE.map((row) => (
                  <tr
                    key={row.size}
                    className="border-b border-border/20 last:border-0"
                  >
                    <td className="py-2.5 font-medium">{row.size}</td>
                    <td className="py-2.5 text-muted-foreground">
                      {row.chest}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {row.length}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {row.waist}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Хэмжээ нь ойролцоо бөгөөд загвар, материалын зүсэлтээс хамаарч бага
            зэрэг ялгаатай байж болно.
          </p>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════
          SIZE RECOMMENDATION DIALOG
         ════════════════════════════════════════════════════════ */}
      <Dialog open={sizeRecOpen} onOpenChange={setSizeRecOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Хэмжээгээ мэдэх</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Өндрөө сонгоод тохирох хэмжээг харна уу.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "~155 см", value: 155 },
                { label: "160 см", value: 160 },
                { label: "165 см", value: 165 },
                { label: "170 см", value: 170 },
                { label: "175 см", value: 175 },
                { label: "180 см", value: 180 },
                { label: "185 см", value: 185 },
                { label: "190+ см", value: 190 },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  variant={recHeight === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRecHeight(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
            {recHeight && recSize && (
              <div className="rounded-xl border border-border/50 bg-[var(--surface-1)] p-4">
                <p className="text-sm">
                  {recHeight} см өндөрт{" "}
                  <span className="font-semibold text-[var(--brand-sports)]">
                    {recSize}
                  </span>{" "}
                  хэмжээ тохиромжтой
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Энэ нь ерөнхий зөвлөмж бөгөөд хувцасны загвараас хамаарч
                  өөрчлөгдөж болно.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════
          STICKY MOBILE BUY BAR
         ════════════════════════════════════════════════════════ */}
      {showSticky && hasStock && product.is_available && (
        <div
          ref={stickyRef}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-lg md:hidden"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{product.name}</p>
              <p className="font-display text-lg tracking-tight text-[var(--brand-sports)]">
                ₮{product.price_mnt.toLocaleString()}
              </p>
            </div>
            <Button
              size="default"
              className="shrink-0"
              onClick={() => setOrderOpen(true)}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Худалдаж авах
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
