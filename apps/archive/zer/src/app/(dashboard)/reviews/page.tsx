import { withDbCapture } from "@zuiio/capture";
import { Suspense } from "react";
import { requireAppContext } from "@/lib/erp";
import { ReviewsContent } from "./reviews-content";

function PageSkeleton() {
  return <div className="h-96 animate-pulse rounded-xl bg-muted" />;
}

async function DataFetcher() {
  const { supabase, organizationId } = await requireAppContext();

  const { data: reviews } = await withDbCapture(
    "page:reviews reviews",
    supabase
      .from("reviews")
      .select(
        "id, customer_name, rating, comment, status, created_at, moderated_at, product:products(name, id)",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  );

  const reviewRows: ReviewRow[] = (reviews ?? []).map((d) => ({
    id: d.id,
    customer_name: d.customer_name,
    rating: d.rating,
    comment: d.comment,
    status: d.status as ReviewRow["status"],
    created_at: d.created_at ?? new Date().toISOString(),
    moderated_at: d.moderated_at,
    product_id: d.product?.id ?? null,
    product_name: d.product?.name ?? "Мэдэгдэхгүй",
  }));

  return <ReviewsContent reviews={reviewRows} />;
}

export type ReviewRow = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  moderated_at: string | null;
  product_id: string | null;
  product_name: string;
};

export default async function ReviewsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DataFetcher />
    </Suspense>
  );
}
