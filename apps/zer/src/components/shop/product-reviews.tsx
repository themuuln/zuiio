"use client";

import { Star, StarHalf } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type PublicReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;

const STAR_IDS = [0, 1, 2, 3, 4];

function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      className="inline-flex items-center gap-0.5 text-amber-500"
      aria-label={`${rating} од`}
    >
      {STAR_IDS.map((id) => {
        const filled = id + 1 <= rating;
        return filled ? (
          <Star key={id} weight="fill" className="size-3.5" />
        ) : (
          <StarHalf key={id} className="size-3.5 opacity-40" />
        );
      })}
    </span>
  );
}

/**
 * Public product reviews: approved review list + submission form.
 * Talks to the anon-executable get_public_reviews / submit_product_review RPCs.
 */
export function ProductReviews({
  slug,
  productId,
}: {
  slug: string;
  productId: string;
}) {
  const supabase = createClient();
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");

  const loadReviews = async () => {
    if (reviews !== null) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_public_reviews", {
        p_slug: slug,
        p_product_id: productId,
      });
      if (!error && Array.isArray(data)) {
        setReviews(data as PublicReview[]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!customerName.trim() || !comment.trim()) {
      toast.error("Нэр болон сэтгэгдэл шаардлагатай.");
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("submit_product_review", {
        p_slug: slug,
        p_product_id: productId,
        p_customer_name: customerName.trim(),
        p_rating: rating,
        p_comment: comment.trim(),
      });
      const result = data as { success?: boolean; error?: string } | null;
      if (error || !result?.success) {
        toast.error(result?.error ?? "Сэтгэгдэл илгээхэд алдаа гарлаа.");
        return;
      }
      toast.success("Сэтгэгдэл илгээгдлээ. Батлагдсаны дараа харагдана.");
      setCustomerName("");
      setComment("");
      setRating(5);
    } catch {
      toast.error("Сэтгэгдэл илгээхэд алдаа гарлаа.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-border/80 bg-card p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        <Star weight="fill" className="size-4" />
        Сэтгэгдэл
      </h2>

      {reviews === null && !loading && (
        <Button variant="outline" size="sm" onClick={loadReviews}>
          Сэтгэгдэл харах
        </Button>
      )}

      {loading && <p className="text-sm text-muted-foreground">Уншиж байна…</p>}

      {reviews !== null && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Одоогоор сэтгэгдэл байхгүй.
            </p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-lg bg-muted/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {r.customer_name}
                      </span>
                      <RatingStars rating={r.rating} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(r.created_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {r.comment}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Submission form */}
          <div className="border-t border-border/60 pt-4">
            <h3 className="mb-3 text-sm font-medium">Сэтгэгдэл үлдээх</h3>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="review-name">Нэр</Label>
                  <Input
                    id="review-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Таны нэр"
                    maxLength={60}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Үнэлгээ</Label>
                  <div className="flex items-center gap-1 pt-1">
                    {RATING_OPTIONS.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        aria-label={`${value} од`}
                        className="rounded p-0.5 transition-transform hover:scale-110"
                      >
                        <Star
                          className={cn(
                            "size-5",
                            value <= rating
                              ? "text-amber-500"
                              : "text-muted-foreground/30",
                          )}
                          weight={value <= rating ? "fill" : "regular"}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="review-comment">Сэтгэгдэл</Label>
                <Textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Бүтээгдэхүүний талаарх сэтгэгдлээ үлдээнэ үү"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? "Илгээж байна…" : "Сэтгэгдэл илгээх"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
