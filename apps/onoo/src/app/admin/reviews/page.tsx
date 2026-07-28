"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ShopReviewRow } from "@/app/admin/_lib/api";
import { shopReviewsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Button } from "@/components/ui/button";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`size-4 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();

  const { data: reviews, refetch } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => shopReviewsApi.list(),
  });

  const approveMutation = useMutation({
    mutationFn: (reviewId: string) =>
      shopReviewsApi.update(reviewId, {
        is_approved: true,
      } as Partial<ShopReviewRow>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Сэтгэгдэл баталгаажсан");
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  const rejectMutation = useMutation({
    mutationFn: (reviewId: string) =>
      shopReviewsApi.update(reviewId, {
        is_approved: false,
      } as Partial<ShopReviewRow>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Сэтгэгдэл цуцлагдсан");
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => shopReviewsApi.remove(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Сэтгэгдэл устгагдлаа");
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  return (
    <AdminPageLayout title="Сэтгэгдэл">
      {!reviews ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Сэтгэгдэл байхгүй байна
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 pr-4 font-medium">Бүтээгдэхүүн</th>
                <th className="py-3 pr-4 font-medium">Зохиогч</th>
                <th className="py-3 pr-4 font-medium">Үнэлгээ</th>
                <th className="py-3 pr-4 font-medium">Агуулга</th>
                <th className="py-3 pr-4 font-medium">Статус</th>
                <th className="py-3 pr-4 font-medium">Огноо</th>
                <th className="py-3 font-medium">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review: ShopReviewRow) => (
                <tr key={review.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 pr-4 font-medium">
                    {review.products?.name ?? "—"}
                  </td>
                  <td className="py-3 pr-4">{review.author_name}</td>
                  <td className="py-3 pr-4">
                    <StarRating rating={review.rating} />
                  </td>
                  <td className="max-w-xs truncate py-3 pr-4 text-muted-foreground">
                    {review.content}
                  </td>
                  <td className="py-3 pr-4">
                    {review.is_approved ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Баталгаажсан
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Хүлээгдэж буй
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {format(new Date(review.created_at), "yyyy-MM-dd HH:mm")}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      {!review.is_approved ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => approveMutation.mutate(review.id)}
                          disabled={approveMutation.isPending}
                        >
                          Зөвшөөрөх
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rejectMutation.mutate(review.id)}
                          disabled={rejectMutation.isPending}
                        >
                          Цуцлах
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => deleteMutation.mutate(review.id)}
                        disabled={deleteMutation.isPending}
                        title="Устгах"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageLayout>
  );
}
