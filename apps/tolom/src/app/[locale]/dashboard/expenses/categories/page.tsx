"use client";

import { Circle, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from "@/lib/queries/use-expenses";
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

export default function CategoriesPage() {
  const t = useTranslations();

  const { data: org, isLoading: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;

  const {
    data: categories,
    isLoading,
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

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("#3b82f6");
  const [isEditing, setIsEditing] = useState(false);
  const categoryCount = categories?.length ?? 0;

  function openAddDialog() {
    setIsEditing(false);
    setFormName("");
    setFormDescription("");
    setFormColor("#3b82f6");
    setDialogOpen(true);
  }

  function openEditDialog(category: ExpenseCategory) {
    setIsEditing(true);
    setSelectedCategory(category);
    setFormName(category.name);
    setFormDescription(category.description ?? "");
    setFormColor(category.color);
    setDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    if (!open) setSelectedCategory(null);
    setDialogOpen(open);
  }

  function handleSave() {
    if (!formName.trim()) return;
    const params = {
      name: formName.trim(),
      description: formDescription.trim() || undefined,
      color: formColor,
    };
    if (isEditing && selectedCategory) {
      updateCategory.mutate(
        { id: selectedCategory.id, ...params },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setSelectedCategory(null);
          },
        },
      );
    } else {
      createCategory.mutate(params, {
        onSuccess: () => {
          setDialogOpen(false);
          setSelectedCategory(null);
        },
      });
    }
  }

  // ── Loading ──
  if (orgLoading || (isLoading && !categories)) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-40" />
            <Skeleton className="mt-2 size-56" />
          </div>
          <Skeleton className="h-9 w-36" />
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="flex flex-col gap-6 tablet:gap-6 tablet:px-2">
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <Typography.Text className="text-destructive">
              {error?.message ?? t("common.somethingWentWrong")}
            </Typography.Text>
            <Button onClick={() => refetch()} variant="outline">
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                      aria-label={t("expenses.editCategory", {
                        name: cat.name,
                      })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="rounded-md"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setDeleteDialogOpen(true);
                      }}
                      aria-label={t("expenses.deleteCategory", {
                        name: cat.name,
                      })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardAction>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between rounded-lg bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                  <span>{t("expenses.color")}</span>
                  <span className="font-mono uppercase">{cat.color}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Add/Edit Dialog ── */}
      <DetailDrawer
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        size="md"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>
            {isEditing
              ? t("expenses.editCategoryTitle")
              : t("expenses.addCategoryTitle")}
          </DetailDrawer.Title>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">
                {t("expenses.categoryName")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("expenses.categoryNamePlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t("expenses.description")}</Label>
              <Input
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("expenses.descriptionPlaceholder")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t("expenses.color")}</Label>
              <div className="flex flex-wrap gap-2.5">
                {CATEGORY_COLORS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    onClick={() => setFormColor(color.value)}
                    variant="outline"
                    size="icon-sm"
                    className={cn(
                      "rounded-full border-2",
                      formColor === color.value &&
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
                  {formColor}
                </span>
              </div>
            </div>
          </div>
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <Button variant="outline" onClick={() => handleDialogChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !formName.trim() ||
              createCategory.isPending ||
              updateCategory.isPending
            }
          >
            {createCategory.isPending || updateCategory.isPending
              ? t("common.loading")
              : t("common.save")}
          </Button>
        </DetailDrawer.Footer>
      </DetailDrawer>

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
