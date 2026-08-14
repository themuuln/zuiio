"use client";

import { Plus, Trash, Warning } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DrawerCancel,
  DrawerFooter,
  DrawerSubmit,
} from "@/components/ui/drawer-footer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { createClient } from "@/lib/supabase/client";

type Segment = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
};

export function SegmentSettingsContent() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);

  const { data: segments = [], isPending } = useQuery<Segment[]>({
    queryKey: ["customer-segments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_segments")
        .select("*")
        .order("sort_order");
      if (error) return [];
      return (data ?? []) as Segment[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("customer_segments")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Бүлэг устгагдлаа.");
      queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
    },
    onError: (e) => {
      capture(e, { context: "deleteSegment" });
      toast.error("Устгахад алдаа гарлаа.");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Үйлчлүүлэгчийн бүлэг</h1>
          <p className="text-sm text-muted-foreground">
            Үйлчлүүлэгчдийг бүлэглэх, үнийн нөхцөл холбох
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const { seedCustomerSegmentPreset } = await import("./actions");
              const result = await seedCustomerSegmentPreset();
              if (result && "error" in result) {
                toast.error(result.error);
              } else {
                toast.success(
                  `${(result as { created: number }).created} бүлэг үүсгэгдлээ.`,
                );
              }
              queryClient.invalidateQueries({
                queryKey: ["customer-segments"],
              });
            }}
          >
            Урьдчилсан загвар нэмэх
          </Button>
          <Button
            onClick={() => {
              setEditing(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Шинэ бүлэг
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : segments.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Plus />
            </EmptyMedia>
            <EmptyTitle>Бүлэг байхгүй</EmptyTitle>
            <EmptyDescription>
              "Урьдчилсан загвар нэмэх" товчийг дарж эхлээрэй.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Нэр</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Эрэмбэ</th>
                <th className="px-4 py-3 font-medium">Идэвхтэй</th>
                <th className="px-4 py-3 font-medium text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => (
                <tr
                  key={seg.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{seg.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {seg.slug}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {seg.sort_order}
                  </td>
                  <td className="px-4 py-3">
                    {seg.is_active && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Идэвхтэй
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditing(seg);
                          setDrawerOpen(true);
                        }}
                      >
                        Засах
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (
                            window.confirm(`"${seg.name}" бүлгийг устгах уу?`)
                          ) {
                            deleteMutation.mutate(seg.id);
                          }
                        }}
                      >
                        <Trash className="size-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SegmentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editing}
      />
    </div>
  );
}

function SegmentDrawer({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Segment | null;
}) {
  const queryClient = useQueryClient();
  const _supabase = createClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    if (!name) {
      setError("Нэр шаардлагатай.");
      setIsPending(false);
      return;
    }
    const sortOrder = Number(formData.get("sort_order") ?? 0);
    try {
      const { createCustomerSegment, updateCustomerSegment } = await import(
        "./actions"
      );
      const fd = new FormData();
      fd.append("name", name);
      fd.append("sort_order", String(sortOrder));

      const result = editing
        ? await updateCustomerSegment(editing.id, undefined, fd)
        : await createCustomerSegment(undefined, fd);

      if (result && "error" in result) {
        setError(result.error);
      } else {
        toast.success(editing ? "Бүлэг шинэчлэгдлээ." : "Бүлэг үүсгэгдлээ.");
        queryClient.invalidateQueries({ queryKey: ["customer-segments"] });
        onOpenChange(false);
      }
    } catch (e) {
      capture(e, { context: "SegmentDrawer: save" });
      setError("Хадгалахад алдаа гарлаа.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Бүлэг засах" : "Шинэ бүлэг"}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit form="segment-form" isPending={isPending} />
        </DrawerFooter>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {error}
        </div>
      )}
      <form id="segment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Нэр *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={editing?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort_order">Эрэмбэ</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            defaultValue={editing?.sort_order ?? 0}
          />
        </div>
      </form>
    </SlideInDrawer>
  );
}
