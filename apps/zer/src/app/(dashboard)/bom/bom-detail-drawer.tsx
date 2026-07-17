"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { ErrorBanner } from "@/components/ui/error-banner";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { bomKeys } from "@/lib/query/keys";
import { activateBom, deleteBom, getBom } from "./bom-actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Ноорог",
  active: "Идэвхтэй",
  retired: "Хуучирсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> =
  {
    draft: "secondary",
    active: "default",
    retired: "destructive",
  };

export type BomDetailData = {
  id: string;
  name: string;
};

export function BomDetailDrawer({
  bomId,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: {
  bomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (bom: { id: string; name: string }) => void;
  onRefresh?: () => void;
}) {
  const queryClient = useQueryClient();
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: bom,
    isPending,
    error,
  } = useQuery({
    queryKey: [...bomKeys.all(), bomId],
    queryFn: async () => {
      const result = await getBom(bomId);
      if ("data" in result) return result.data;
      throw new Error(result.error);
    },
    enabled: open,
  });

  const totalCost =
    bom?.items.reduce(
      (sum, item) => sum + item.quantity * (item.estimated_unit_cost ?? 0),
      0,
    ) ?? 0;

  async function handleActivate() {
    if (isActivating) return;
    setIsActivating(true);
    setActionError(null);

    try {
      const result = await activateBom(bomId);
      if (result?.error) {
        setActionError(result.error);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: bomKeys.all() });
      setConfirmActivate(false);
      onOpenChange(false);
      onRefresh?.();
      toast.success("BOM идэвхжүүлэгдлээ.");
    } catch (err) {
      capture(err, { context: "bom: activateBom UI" });
      setActionError("BOM идэвхжүүлэхэд алдаа гарлаа.");
    } finally {
      setIsActivating(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      const result = await deleteBom(bomId);
      if (result?.error) {
        setActionError(result.error);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: bomKeys.all() });
      setConfirmDelete(false);
      onOpenChange(false);
      onRefresh?.();
      toast.success("BOM устгагдлаа.");
    } catch (err) {
      capture(err, { context: "bom: deleteBom UI" });
      setActionError("BOM устгахад алдаа гарлаа.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DrawerLayout
        open={open}
        onOpenChange={onOpenChange}
        title={bom?.name ?? "BOM дэлгэрэнгүй"}
        description="Бүтээгдэхүүний бүрэлдэхүүний дэлгэрэнгүй мэдээлэл"
        footer={
          bom?.status === "draft" ? (
            <DrawerFooter>
              {onEdit && (
                <Button
                  variant="outline"
                  onClick={() => {
                    onEdit({ id: bom.id, name: bom.name });
                    onOpenChange(false);
                  }}
                >
                  Засах
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Устгах
              </Button>
              <Button onClick={() => setConfirmActivate(true)}>
                Идэвхжүүлэх
              </Button>
            </DrawerFooter>
          ) : undefined
        }
      >
        {isPending && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        )}

        {error && <ErrorBanner error={error.message} />}

        {bom && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{bom.name}</h3>
                <Badge variant={STATUS_VARIANTS[bom.status] ?? "secondary"}>
                  {STATUS_LABELS[bom.status] ?? bom.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Хувилбар:</span>{" "}
                  <span className="font-medium">v{bom.version}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Үүсгэсэн:</span>{" "}
                  <span>{formatDate(bom.created_at)}</span>
                </div>
                {bom.activated_at && (
                  <div>
                    <span className="text-muted-foreground">Идэвхжүүлсэн:</span>{" "}
                    <span>{formatDate(bom.activated_at)}</span>
                  </div>
                )}
                {bom.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Тэмдэглэгээ:</span>{" "}
                    <span>{bom.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Materials Table */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">
                Материалууд ({bom.items.length})
              </h4>
              {bom.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Материал байхгүй.
                </p>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>Материал</TableHead>
                        <TableHead className="text-right">Тоо</TableHead>
                        <TableHead>Нэгж</TableHead>
                        <TableHead className="text-right">Нэгж өртөг</TableHead>
                        <TableHead className="text-right">Нийт</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.items
                        .sort((a, b) => a.sort_order - b.sort_order)
                        .map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {item.material_product_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.estimated_unit_cost ?? 0)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                item.quantity * (item.estimated_unit_cost ?? 0),
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Total Cost */}
            {bom.items.length > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">
                  Нийт тооцооны өртөг:
                </span>
                <span className="text-lg font-bold">
                  {formatCurrency(totalCost)}
                </span>
              </div>
            )}

            {/* Dimension details for items that have them */}
            {bom.items.some(
              (item) =>
                item.required_width_mm ||
                item.required_length_mm ||
                item.required_thickness_mm,
            ) && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Хэмжилтийн шаардлага</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Материал</TableHead>
                        <TableHead className="text-right">Өргөн (мм)</TableHead>
                        <TableHead className="text-right">Урт (мм)</TableHead>
                        <TableHead className="text-right">
                          Зузаан (мм)
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.items
                        .filter(
                          (item) =>
                            item.required_width_mm ||
                            item.required_length_mm ||
                            item.required_thickness_mm,
                        )
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.material_product_name}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.required_width_mm ?? "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.required_length_mm ?? "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.required_thickness_mm ?? "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerLayout>

      {/* Activate Confirmation */}
      <SlideInDrawer
        open={confirmActivate}
        onOpenChange={setConfirmActivate}
        title="BOM идэвхжүүлэх"
        description="Энэ үйлдэл нь одоогийн идэвхтэй BOM-ыг хуучирсан төлөвт шилжүүлнэ."
        panelWidth="24rem"
        footer={
          <DrawerFooter>
            <DrawerCancel onClick={() => setConfirmActivate(false)} />
            <DrawerSubmit
              form="bom-activate-confirm"
              isPending={isActivating}
              label="Идэвхжүүлэх"
              loadingLabel="Идэвхжүүлж байна..."
            />
          </DrawerFooter>
        }
      >
        <form
          id="bom-activate-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            handleActivate();
          }}
          className="space-y-4"
        >
          {actionError && <ErrorBanner error={actionError} />}
          <p className="text-sm text-muted-foreground">
            &ldquo;{bom?.name}&rdquo; BOM-ыг идэвхжүүлэх үү? Энэ нь тус
            бүтээгдэхүүний одоогийн идэвхтэй BOM-ыг хуучирсан болгоно.
          </p>
        </form>
      </SlideInDrawer>

      {/* Delete Confirmation */}
      <SlideInDrawer
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="BOM устгах"
        description="Энэ үйлдэл буцаж болохгүй."
        panelWidth="24rem"
        footer={
          <DrawerFooter>
            <DrawerCancel onClick={() => setConfirmDelete(false)} />
            <button
              type="submit"
              form="bom-delete-confirm"
              disabled={isDeleting}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Устгаж байна..." : "Устгах"}
            </button>
          </DrawerFooter>
        }
      >
        <form
          id="bom-delete-confirm"
          onSubmit={(e) => {
            e.preventDefault();
            handleDelete();
          }}
          className="space-y-4"
        >
          {actionError && <ErrorBanner error={actionError} />}
          <p className="text-sm text-muted-foreground">
            &ldquo;{bom?.name}&rdquo; BOM-ыг устгах уу? Зөвхөн ноорог төлөвтэй
            BOM-ыг устгах боломжтой.
          </p>
        </form>
      </SlideInDrawer>
    </>
  );
}
