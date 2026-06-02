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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

  function openAddDialog() {
    setIsEditing(false);
    setFormName("");
    setFormDescription("");
    setFormColor("#3b82f6");
    setDialogOpen(true);
  }

  function openEditDialog(category: ExpenseCategory) {
    setIsEditing(true);
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
              {error?.message ?? "Failed to load categories"}
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
            Categories
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            Organize expenses into categories for better tracking
          </Typography.Muted>
        </div>
        <Button onClick={openAddDialog} size="default">
          <Plus className="size-4" />
          Add Category
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
              Add Category
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        /* Category grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <div
                className="h-1.5 shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <CardHeader>
                <CardTitle className="capitalize">{cat.name}</CardTitle>
                {cat.description && (
                  <CardDescription className="line-clamp-2">
                    {cat.description}
                  </CardDescription>
                )}
                <CardAction>
                  <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    <Button
                      size="icon-sm"
                      variant="ghost"
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
            </Card>
          ))}
        </div>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t("expenses.editCategoryTitle")
                : t("expenses.addCategoryTitle")}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
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
                    onClick={() => setFormColor(color.value)}
                    variant="outline"
                    size="icon-sm"
                    className="rounded-full"
                    style={{
                      backgroundColor: color.value,
                      outline:
                        formColor === color.value
                          ? "2px solid hsl(var(--foreground))"
                          : undefined,
                      outlineOffset: 2,
                    }}
                    aria-label={color.name}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formName.trim() || createCategory.isPending}
            >
              {createCategory.isPending ? "Saving\u2026" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
              {deleteCategory.isPending ? "Deleting\u2026" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
