"use client";

import { Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CrudFormDrawer } from "@/components/ui/crud-form-drawer";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from "@/lib/queries/use-expense-categories";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { ExpenseCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Orange", value: "#f59e0b" },
  { name: "Green", value: "#10b981" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Red", value: "#ef4444" },
  { name: "Amber", value: "#f97316" },
  { name: "Gray", value: "#6b7280" },
];

// ── Schema ─────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  color: z.string().min(1, "Color is required"),
});

type CategoryValues = z.infer<typeof categorySchema>;

// ── Helpers ────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={`skel-${i}`}>
          <Skeleton className="h-1.5 rounded-none" />
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-1.5 size-48" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────

export default function CategoriesPage() {
  const t = useTranslations();

  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data: categories,
    isPending,
    isError,
    error,
    refetch,
  } = useExpenseCategories(orgId);
  const createCategory = useCreateExpenseCategory(orgId);
  const updateCategory = useUpdateExpenseCategory(orgId);
  const deleteCategory = useDeleteExpenseCategory(orgId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const categoryCount = categories?.length ?? 0;
  const isPendingMutation =
    createCategory.isPending || updateCategory.isPending;

  function getDefaultValues(): CategoryValues {
    if (isEditing && selectedCategory) {
      return {
        name: selectedCategory.name,
        description: selectedCategory.description ?? "",
        color: selectedCategory.color,
      };
    }
    return {
      name: "",
      description: "",
      color: "#3b82f6",
    };
  }

  function openAddDialog() {
    setIsEditing(false);
    setSelectedCategory(null);
    setDialogOpen(true);
  }

  function openEditDialog(category: ExpenseCategory) {
    setIsEditing(true);
    setSelectedCategory(category);
    setDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    if (!open) setSelectedCategory(null);
    setDialogOpen(open);
  }

  async function handleSubmit(data: CategoryValues) {
    const params = {
      name: data.name.trim(),
      description: data.description?.trim() || undefined,
      color: data.color,
    };

    if (isEditing && selectedCategory) {
      await updateCategory.mutateAsync({
        id: selectedCategory.id,
        body: params,
      });
    } else {
      await createCategory.mutateAsync(params);
    }
  }

  const hasLoadedOnce = Boolean(categories);
  const showSkeleton =
    (orgLoading || (isPending && !categories)) && !hasLoadedOnce;

  return (
    <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("expenses.categories")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("expenses.categoriesDescription")}
          </Typography.Muted>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
              {categoryCount} {t("expenses.categories").toLowerCase()}
            </span>
          </div>
        </div>
        <Button onClick={openAddDialog} size="default">
          <Plus className="size-4" />
          {t("expenses.addCategory")}
        </Button>
      </div>

      {isError && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-4 py-4">
            <p className="text-sm text-destructive">
              {error?.message ?? t("common.somethingWentWrong")}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {showSkeleton ? (
        <SkeletonGrid />
      ) : (
        <>
          {/* Empty state */}
          {!categories || categories.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Circle />
                </EmptyMedia>
                <EmptyTitle>{t("expenses.noCategories")}</EmptyTitle>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={openAddDialog} variant="outline">
                  <Plus className="size-4" />
                  {t("expenses.addCategory")}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            /* Category grid */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <Card
                  key={cat.id}
                  className="border-border/70 shadow-xs transition-colors hover:border-foreground/15"
                >
                  <div
                    className="h-1.5 shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <CardHeader>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <CardTitle className="capitalize">{cat.name}</CardTitle>
                      </div>
                      {cat.description && (
                        <CardDescription className="line-clamp-2">
                          {cat.description}
                        </CardDescription>
                      )}
                    </div>
                    <CardAction>
                      <div className="flex rounded-lg border border-border bg-muted/20 p-0.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-md"
                          onClick={() => openEditDialog(cat)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="rounded-md"
                          onClick={() => {
                            setSelectedCategory(cat);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </CardAction>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Add/Edit Drawer ── */}
      <CrudFormDrawer
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        mode={isEditing ? "edit" : "create"}
        title={{
          create: t("expenses.addCategoryTitle"),
          edit: t("expenses.editCategoryTitle"),
        }}
        formId="category-form"
        schema={categorySchema}
        defaultValues={getDefaultValues()}
        onSubmit={handleSubmit}
        isPending={isPendingMutation}
        size="md"
      >
        {(form) => (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                {t("expenses.categoryName")}{" "}
                <span className="text-destructive">*</span>
              </label>
              <input
                id="name"
                {...form.register("name")}
                placeholder={t("expenses.categoryNamePlaceholder")}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                {t("expenses.description")}
              </label>
              <input
                id="description"
                {...form.register("description")}
                placeholder={t("expenses.descriptionPlaceholder")}
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                {t("expenses.color")}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORY_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    onClick={() => form.setValue("color", color.value)}
                    variant="outline"
                    size="icon-sm"
                    className={cn(
                      "rounded-full border-2",
                      form.watch("color") === color.value &&
                        "scale-105 border-foreground",
                    )}
                    style={{
                      backgroundColor: color.value,
                    }}
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="rounded-lg bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                {t("expenses.color")}:{" "}
                <span className="font-mono uppercase text-foreground">
                  {form.watch("color")}
                </span>
              </div>
            </div>
          </div>
        )}
      </CrudFormDrawer>

      {/* ── Delete Confirmation ── */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false);
            setSelectedCategory(null);
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("expenses.deleteCategoryTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("expenses.deleteCategoryDesc", {
                name: selectedCategory?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteCategory.isPending}
              onClick={() => {
                if (selectedCategory)
                  deleteCategory.mutate(selectedCategory.id, {
                    onSuccess: () => {
                      setDeleteDialogOpen(false);
                      setSelectedCategory(null);
                    },
                  });
              }}
            >
              {deleteCategory.isPending
                ? t("common.loading")
                : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
