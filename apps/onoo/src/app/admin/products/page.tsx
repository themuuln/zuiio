"use client";

import { format } from "date-fns";
import { Plus, Loader2 } from "lucide-react";
import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import type { ShopProductRow } from "@/app/admin/_lib/api";
import { shopProductsApi } from "@/app/admin/_lib/api";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const productSchema = z.object({
  name: z.string().min(1, "Нэр шаардлагатай"),
  slug: z.string().min(1, "Slug шаардлагатай"),
  price_mnt: z.coerce.number().int().positive("Үнэ эерэг тоо байх ёстой"),
  description: z.string().optional(),
});

export default function AdminProductsPage() {
  const { data: products, refetch } = useQuery({
    queryKey: ["admin-products"],
    queryFn: shopProductsApi.list,
  });

  return (
    <AdminPageLayout
      title="Бүтээгдэхүүн"
      action={
        <Button onClick={() => {}}>
          <Plus className="mr-2 h-4 w-4" />
          Шинэ бүтээгдэхүүн
        </Button>
      }
    >
      {!products ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          Бүтээгдэхүүн байхгүй байна
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-3 pr-4 font-medium">Нэр</th>
                <th className="py-3 pr-4 font-medium">Slug</th>
                <th className="py-3 pr-4 font-medium">Үнэ</th>
                <th className="py-3 pr-4 font-medium">Хэмжээ</th>
                <th className="py-3 pr-4 font-medium">Статус</th>
                <th className="py-3 font-medium">Үүсгэсэн</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product: ShopProductRow) => (
                <tr key={product.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 pr-4">{product.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">
                    {product.slug}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    ₮{product.price_mnt.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4">
                    {product.variants?.length ?? 0} хэмжээтэй
                  </td>
                  <td className="py-3 pr-4">
                    <Badge
                      variant={
                        product.is_available ? "default" : "secondary"
                      }
                    >
                      {product.is_available ? "Зарах боломжтой" : "Дууссан"}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {format(new Date(product.created_at), "yyyy-MM-dd")}
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
