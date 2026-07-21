"use client";

import { format } from "date-fns";
import { Loader2, Package, Ship, XCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ShopOrderRow } from "@/app/admin/_lib/api";
import { shopOrdersApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Хүлээгдэж буй", variant: "secondary" },
  paid: { label: "Төлөгдсөн", variant: "default" },
  shipped: { label: "Хүргэгдсэн", variant: "outline" },
  cancelled: { label: "Цуцлагдсан", variant: "destructive" },
};

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const { data: orders, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: shopOrdersApi.list,
  });

  const shipMutation = useMutation({
    mutationFn: (orderId: string) => shopOrdersApi.ship(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Захиалга хүргэгдсэн");
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: string) => shopOrdersApi.cancel(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Захиалга цуцлагдсан");
    },
    onError: () => toast.error("Алдаа гарлаа"),
  });

  return (
    <AdminPageLayout title="Захиалга">
      {!orders ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Захиалга байхгүй байна
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 pr-4 font-medium">Захиалагч</th>
                <th className="py-3 pr-4 font-medium">Утас</th>
                <th className="py-3 pr-4 font-medium">Дүн</th>
                <th className="py-3 pr-4 font-medium">Статус</th>
                <th className="py-3 pr-4 font-medium">Огноо</th>
                <th className="py-3 font-medium">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: ShopOrderRow) => {
                const statusInfo = statusLabels[order.status] ?? {
                  label: order.status,
                  variant: "secondary" as const,
                };
                return (
                  <tr key={order.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 pr-4">{order.customer_name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {order.phone}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      ₮{order.total_mnt.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {order.status === "paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => shipMutation.mutate(order.id)}
                            disabled={shipMutation.isPending}
                          >
                            <Ship className="mr-1 h-3 w-3" />
                            Хүргэх
                          </Button>
                        )}
                        {order.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelMutation.mutate(order.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <XCircle className="mr-1 h-3 w-3" />
                            Цуцлах
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminPageLayout>
  );
}
