"use client";

import {
  Check,
  FunnelSimple,
  Plus,
  Trash,
  Warning,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { productKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import {
  type AttributeDefinitionRow,
  checkBuddhistPresetsEnabled,
  checkReligiousPresetsEnabled,
  createAttributeDefinition,
  deleteAttributeDefinition,
  listAttributeCategoryLinks,
  listAttributeDefinitions,
  seedReligiousCategories,
  seedReligiousProducts,
  setAttributeCategories,
  updateAttributeDefinition,
} from "./actions";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const VALUE_TYPE_LABELS: Record<string, string> = {
  text: "Текст",
  number: "Тоо",
  boolean: "Тийм/Үгүй",
  select: "Сонголт",
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function AttributeSettingsContent() {
  const queryClient = useQueryClient();
  const _router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<AttributeDefinitionRow | null>(
    null,
  );
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false);
  const [selectedDefId, setSelectedDefId] = useState<string | null>(null);

  const { data: definitions = [], isPending } = useQuery<
    AttributeDefinitionRow[]
  >({
    queryKey: productKeys.definitions(),
    queryFn: async () => {
      const result = await listAttributeDefinitions();
      if (result.error) toast.error(result.error);
      return result.definitions;
    },
  });

  const { data: buddhistPresets } = useQuery({
    queryKey: ["buddhist-presets-enabled"],
    queryFn: async () => {
      return checkBuddhistPresetsEnabled();
    },
  });
  const { data: religiousPresets } = useQuery({
    queryKey: ["religious-presets-enabled"],
    queryFn: async () => {
      return checkReligiousPresetsEnabled();
    },
  });

  const religiousSeedMutation = useMutation({
    mutationFn: async () => {
      const cats = await seedReligiousCategories();
      const prods = await seedReligiousProducts();
      return {
        created:
          ("created" in cats ? cats.created : 0) +
          ("created" in prods ? prods.created : 0),
        error:
          ("error" in cats ? cats.error : null) ||
          ("error" in prods ? prods.error : null),
      };
    },
    onSuccess: (result) => {
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.created} ангилал, бүтээгдэхүүн үүсгэгдлээ.`);
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
      }
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const { seedBuddhistAttributeTemplate, seedBuddhistCategories } =
        await import("./actions");
      const attrs = await seedBuddhistAttributeTemplate();
      const cats = await seedBuddhistCategories();
      return {
        created:
          ("created" in attrs ? attrs.created : 0) +
          ("created" in cats ? cats.created : 0),
        error:
          ("error" in attrs ? attrs.error : null) ||
          ("error" in cats ? cats.error : null),
      };
    },
    onSuccess: (result) => {
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${result.created} шинж чанар, ангилал үүсгэгдлээ.`);
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Бүтээгдэхүүний шинж чанар</h1>
          <p className="text-sm text-muted-foreground">
            Бүтээгдэхүүний нэмэлт мэдээллийг удирдан зохицуулах
          </p>
        </div>
        <div className="flex gap-2">
          {buddhistPresets?.enabled && (
            <Button
              variant="outline"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending
                ? "Үүсгэж байна..."
                : "Буддын загвар нэмэх"}
            </Button>
          )}
          {religiousPresets?.enabled && (
            <Button
              variant="outline"
              onClick={() => religiousSeedMutation.mutate()}
              disabled={religiousSeedMutation.isPending}
            >
              {religiousSeedMutation.isPending
                ? "Үүсгэж байна..."
                : "Шашны дэлгүүр загвар нэмэх"}
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingDef(null);
              setDrawerOpen(true);
            }}
          >
            <Plus className="mr-2 size-4" />
            Шинэ шинж чанар
          </Button>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : definitions.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FunnelSimple />
            </EmptyMedia>
            <EmptyDescription>
              Бүтээгдэхүүнд нэмэлт мэдээлэл нэмэх шинж чанарыг үүсгэнэ үү. "Шинэ
              шинж чанар" товчийг дарж эхлээрэй.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left">
                <th className="px-4 py-3 font-medium">Нэр</th>
                <th className="px-4 py-3 font-medium">Төрөл</th>
                <th className="px-4 py-3 font-medium">Нэгж</th>
                <th className="px-4 py-3 font-medium">Албан журмын</th>
                <th className="px-4 py-3 font-medium">Шүүлтүүр</th>
                <th className="px-4 py-3 font-medium">Эрэмбэ</th>
                <th className="px-4 py-3 font-medium text-right">Үйлдэл</th>
              </tr>
            </thead>
            <tbody>
              {definitions.map((def) => (
                <tr
                  key={def.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{def.name}</td>
                  <td className="px-4 py-3">
                    {VALUE_TYPE_LABELS[def.value_type]}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {def.unit ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {def.is_required ? (
                      <Check className="size-4 text-green-600" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    {def.is_filterable ? (
                      <FunnelSimple className="size-4 text-blue-600" />
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {def.sort_order}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDefId(def.id);
                          setCategoryDrawerOpen(true);
                        }}
                      >
                        Ангилал
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDef(def);
                          setDrawerOpen(true);
                        }}
                      >
                        Засах
                      </Button>
                      <DeleteButton def={def} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Drawer */}
      <AttributeDefinitionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editingDef}
      />

      {/* Category Link Drawer */}
      {selectedDefId && (
        <CategoryLinkDrawer
          open={categoryDrawerOpen}
          onOpenChange={setCategoryDrawerOpen}
          definitionId={selectedDefId}
          definitionName={
            definitions.find((d) => d.id === selectedDefId)?.name ?? ""
          }
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Button                                                      */
/* ------------------------------------------------------------------ */

function DeleteButton({ def }: { def: AttributeDefinitionRow }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteAttributeDefinition(def.id),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Шинж чанар устгагдлаа.");
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
      }
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={() => {
        if (window.confirm(`"${def.name}" шинж чанарыг устгах уу?`)) {
          deleteMutation.mutate();
        }
      }}
      disabled={deleteMutation.isPending}
    >
      <Trash className="size-4" />
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / Edit Drawer                                               */
/* ------------------------------------------------------------------ */

function AttributeDefinitionDrawer({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AttributeDefinitionRow | null;
}) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (formData: FormData) =>
      createAttributeDefinition(undefined, formData),
    onSuccess: (result) => {
      if (result && "error" in result) {
        setError(result.error);
        setIsPending(false);
      } else {
        toast.success("Шинж чанар үүсгэгдлээ.");
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
        onOpenChange(false);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (formData: FormData) =>
      editing
        ? updateAttributeDefinition(editing.id, undefined, formData)
        : Promise.resolve({ error: "No editing item" }),
    onSuccess: (result) => {
      if (result && "error" in result) {
        setError(result.error);
        setIsPending(false);
      } else {
        toast.success("Шинж чанар шинэчлэгдлээ.");
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
        onOpenChange(false);
      }
    },
  });

  useEffect(() => {
    if (!open) {
      setError(null);
      setIsPending(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    if (editing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Шинж чанар засах" : "Шинэ шинж чанар"}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <DrawerSubmit
            form="attr-def-form"
            isPending={isPending}
            label={editing ? "Хадгалах" : "Үүсгэх"}
          />
        </DrawerFooter>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <Warning className="size-4 shrink-0" />
          {error}
        </div>
      )}

      <form id="attr-def-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Нэр *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={editing?.name ?? ""}
            placeholder="Жишээ: Материал"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="value_type">Төрөл *</Label>
          <select
            id="value_type"
            name="value_type"
            defaultValue={editing?.value_type ?? "text"}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            required
          >
            <option value="text">Текст</option>
            <option value="number">Тоо</option>
            <option value="boolean">Тийм/Үгүй</option>
            <option value="select">Сонголт</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit">Нэгж</Label>
          <Input
            id="unit"
            name="unit"
            defaultValue={editing?.unit ?? ""}
            placeholder="Жишээ: см, г, ширхэг"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="options">Сонголтууд (таслaugaар тусгаарлан)</Label>
          <Input
            id="options"
            name="options"
            defaultValue={editing?.options?.join(", ") ?? ""}
            placeholder="Жишээ: Зэс, Мөнгө, Шавар"
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

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_required"
              value="true"
              defaultChecked={editing?.is_required ?? false}
              className="rounded"
            />
            Албан журмын
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_filterable"
              value="true"
              defaultChecked={editing?.is_filterable ?? false}
              className="rounded"
            />
            Шүүлтүүрт хэрэглэх
          </label>
        </div>
      </form>
    </SlideInDrawer>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Link Drawer                                               */
/* ------------------------------------------------------------------ */

function CategoryLinkDrawer({
  open,
  onOpenChange,
  definitionId,
  definitionName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  definitionId: string;
  definitionName: string;
}) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      return (data ?? []) as { id: string; name: string }[];
    },
  });

  // Load current links
  useEffect(() => {
    if (!open || !definitionId) return;
    let cancelled = false;
    (async () => {
      try {
        const { links } = await listAttributeCategoryLinks(definitionId);
        if (!cancelled) {
          setSelectedCats(new Set(links.map((l) => l.category_id)));
        }
      } catch {
        capture("Failed to load attribute category links");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, definitionId]);

  const saveMutation = useMutation({
    mutationFn: () =>
      setAttributeCategories(definitionId, Array.from(selectedCats)),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Ангиллын холболт хадгалагдлаа.");
        queryClient.invalidateQueries({ queryKey: productKeys.definitions() });
        onOpenChange(false);
      }
    },
  });

  return (
    <SlideInDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={`"${definitionName}" ангиллууд`}
      footer={
        <DrawerFooter>
          <DrawerCancel onClick={() => onOpenChange(false)} />
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        </DrawerFooter>
      }
    >
      <p className="mb-4 text-sm text-muted-foreground">
        Эдгээр ангилалд энэ шинж чанар харагдана. Холбогдоогүй бол бүх ангилалд
        харагдана.
      </p>
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ангилал байхгүй байна.</p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={selectedCats.has(cat.id)}
                onChange={(e) => {
                  const next = new Set(selectedCats);
                  if (e.target.checked) next.add(cat.id);
                  else next.delete(cat.id);
                  setSelectedCats(next);
                }}
                className="rounded"
              />
              <span className="text-sm">{cat.name}</span>
            </label>
          ))}
        </div>
      )}
    </SlideInDrawer>
  );
}
