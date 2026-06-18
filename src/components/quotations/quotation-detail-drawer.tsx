"use client";

import { DrawerLayout } from "@/components/ui/drawer-layout";
import { X } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  convertQuotationToSale,
  updateQuotationStatus,
} from "@/app/(dashboard)/quotations/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { DrawerHeader } from "@/components/ui/drawer-header";

const STATUS_LABELS: Record<string, string> = {
  draft: "Ноорог",
  sent: "Илгээсэн",
  accepted: "Хүлээн зөвшөөрсөн",
  rejected: "Татгалзсан",
  expired: "Хугацаа дууссан",
  converted: "Борлуулалт болсон",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "secondary",
  sent: "outline",
  accepted: "default",
  rejected: "destructive",
  expired: "outline",
  converted: "default",
};

async function fetchQuotation(id: string) {
  const supabase = createClient();
  const { data: quotation } = await supabase
    .from("quotations")
    .select("*, contacts(name, phone)")
    .eq("id", id)
    .single();
  if (!quotation) return null;

  const { data: items } = await supabase
    .from("quotation_items")
    .select("*, products(name, unit)")
    .eq("quotation_id", id);

  return { quotation, items: items ?? [] };
}

export function QuotationDetailDrawer({
  quotationId,
  onClose,
}: {
  quotationId: string | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionPending, setActionPending] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["quotation-detail", quotationId],
    queryFn: async () => {
      if (!quotationId) return null;
      return fetchQuotation(quotationId);
    },
    enabled: !!quotationId,
  });

  const statusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const result = await updateQuotationStatus(id, status);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotation-detail"] });
      toast.success("Төлөв шинэчлэгдсэн.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await convertQuotationToSale(id);
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["quotation-detail"] });
      toast.success("Үнийн санал борлуулалт болж хувиргагдсан.");
      if (result?.saleId) {
        router.push(`/sales`);
      }
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleStatusChange = async (status: string) => {
    if (!quotationId) return;
    setActionPending(status);
    try {
      if (status === "accepted") {
        // Accept and create sale
        await convertMutation.mutateAsync(quotationId);
      } else {
        await statusMutation.mutateAsync({ id: quotationId, status });
      }
    } finally {
      setActionPending(null);
    }
  };

  const quotation = data?.quotation;
  const items = data?.items ?? [];

  const isDraft = quotation?.status === "draft";
  const isSent = quotation?.status === "sent";
  const isAccepted = quotation?.status === "accepted";
  const isConverted = quotation?.status === "converted";
  const isTerminal =
    quotation?.status === "rejected" ||
    quotation?.status === "expired" ||
    quotation?.status === "converted";

  return (
    <DrawerLayout
      open={!!quotationId}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      panelWidth="32rem"
    >
              <DrawerHeader title={quotation ? `#${quotation.quote_number}` : "Үнийн санал"} />


              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Уншиж байна...
                </p>
              ) : !quotation ? (
                <p className="text-sm text-muted-foreground">
                  Үнийн санал олдсонгүй.
                </p>
              ) : (
                <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={STATUS_VARIANTS[quotation.status] ?? "outline"}
                    >
                      {STATUS_LABELS[quotation.status] ?? quotation.status}
                    </Badge>
                  </div>

                  {/* Actions */}
                  {!isTerminal && (
                    <div className="flex flex-wrap gap-2">
                      {isDraft && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            actionPending === "sent" ||
                            statusMutation.isPending
                          }
                          onClick={() => handleStatusChange("sent")}
                        >
                          {actionPending === "sent"
                            ? "Илгээж байна..."
                            : "Илгээх"}
                        </Button>
                      )}
                      {(isDraft || isSent) && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={
                            actionPending === "accepted" ||
                            convertMutation.isPending
                          }
                          onClick={() => handleStatusChange("accepted")}
                        >
                          {actionPending === "accepted"
                            ? "Хүлээн зөвшөөрч байна..."
                            : "Хүлээн зөвшөөрөх"}
                        </Button>
                      )}
                      {(isDraft || isSent) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={
                            actionPending === "rejected" ||
                            statusMutation.isPending
                          }
                          onClick={() => handleStatusChange("rejected")}
                        >
                          {actionPending === "rejected"
                            ? "Татгалзаж байна..."
                            : "Татгалзах"}
                        </Button>
                      )}
                      {!isConverted && (isAccepted || isDraft || isSent) && (
                        <Button
                          size="sm"
                          variant="default"
                          disabled={
                            actionPending === "convert" ||
                            convertMutation.isPending
                          }
                          onClick={() => {
                            setActionPending("convert");
                            convertMutation.mutate(quotation.id, {
                              onSettled: () => setActionPending(null),
                            });
                          }}
                        >
                          {actionPending === "convert"
                            ? "Хувиргаж байна..."
                            : "Борлуулалт болгох"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Quotation metadata */}
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Дугаар
                      </span>
                      <span className="text-sm font-medium">
                        {quotation.quote_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Огноо
                      </span>
                      <span className="text-sm">
                        {formatDate(quotation.issue_date)}
                      </span>
                    </div>
                    {quotation.expiry_date && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">
                          Хүчинтэй
                        </span>
                        <span className="text-sm">
                          {formatDate(quotation.expiry_date)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Нийт дүн</span>
                      <span className="text-lg font-bold">
                        {formatCurrency(quotation.total_amount ?? 0)}
                      </span>
                    </div>
                  </div>

                  {/* Contact info */}
                  {quotation.contacts && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-2">
                        Харилцагч
                      </h4>
                      <p className="text-sm">
                        {
                          (quotation.contacts as { name: string })
                            .name
                        }
                      </p>
                      {(quotation.contacts as { phone?: string })
                        .phone && (
                        <p className="text-sm text-muted-foreground">
                          {
                            (quotation.contacts as { phone: string })
                              .phone
                          }
                        </p>
                      )}
                    </div>
                  )}

                  {/* Items */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Бараанууд
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Бараа</TableHead>
                          <TableHead className="text-right">
                            Тоо
                          </TableHead>
                          <TableHead className="text-right">
                            Үнэ
                          </TableHead>
                          <TableHead className="text-right">
                            Нийт
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          const product = item.products as {
                            name: string;
                            unit: string | null;
                          } | null;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                {item.description ||
                                  product?.name ||
                                  "Бүтээгдэхүүн"}
                              </TableCell>
                              <TableCell className="text-right">
                                {item.quantity} {product?.unit ?? ""}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(item.unit_price)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.total_price ?? 0)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {quotation.notes && (
                    <div className="rounded-lg border p-4">
                      <h4 className="text-sm font-medium mb-1">
                        Тэмдэглэл
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {quotation.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
    </DrawerLayout>
  );
}
