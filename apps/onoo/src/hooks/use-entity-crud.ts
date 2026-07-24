"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
/**
 * Hook for standard admin CRUD operations.
 * with toast notifications and query invalidation.
 */
import type { UseFormReturn } from "react-hook-form";
import { type DefaultValues, useForm } from "react-hook-form";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormType = UseFormReturn<any, any>;

export interface UseEntityCrudConfig<TRow extends { id: string }> {
  api: {
    create: (data: Partial<TRow>) => Promise<TRow>;
    update: (id: string, data: Partial<TRow>) => Promise<TRow>;
    remove: (id: string) => Promise<void>;
  };
  queryKey: readonly unknown[];
  schema: Parameters<typeof zodResolver>[0];
  defaultValues: Record<string, unknown>;
  successMessages: { create: string; update: string; delete: string };
  editMap: (row: TRow) => Record<string, unknown>;
}

export interface UseEntityCrudReturn<TRow extends { id: string }> {
  dialogOpen: boolean;
  editingItem: TRow | null;
  form: FormType;
  isMutating: boolean;
  confirmOpen: boolean;
  confirmItem: TRow | null;
  confirmMessage: string;
  confirmLoading: boolean;
  handleSubmit: (values: Record<string, unknown>) => void;
  handleEdit: (row: TRow) => void;
  handleDelete: (row: TRow, confirmMessage?: string) => void;
  handleCreate: () => void;
  handleDialogOpenChange: (open: boolean) => void;
  handleConfirmDelete: () => void;
  handleConfirmOpenChange: (open: boolean) => void;
}

export function useEntityCrud<TRow extends { id: string }>(
  config: UseEntityCrudConfig<TRow>,
): UseEntityCrudReturn<TRow> {
  const queryClient = useQueryClient();
  const { api, queryKey, schema, defaultValues, successMessages, editMap } =
    config;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TRow | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState<TRow | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("Устгах уу?");

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<Record<string, unknown>>,
  }) as unknown as FormType;

  const createMutation = useMutation({
    mutationFn: (data: Partial<TRow>) => api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMessages.create);
      setDialogOpen(false);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TRow> & { id: string }) => {
      const { id, ...rest } = data;
      return api.update(id, rest as Partial<TRow>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMessages.update);
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success(successMessages.delete);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(values: Record<string, unknown>) {
    if (editingItem) {
      updateMutation.mutate({
        ...values,
        id: editingItem.id,
      } as unknown as Partial<TRow> & { id: string });
    } else {
      createMutation.mutate(values as unknown as Partial<TRow>);
    }
  }

  function handleEdit(row: TRow) {
    setEditingItem(row);
    form.reset(editMap(row));
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingItem(null);
    form.reset();
    setDialogOpen(true);
  }

  function handleDelete(row: TRow, msg?: string) {
    setConfirmItem(row);
    setConfirmMessage(msg ?? "Устгах уу?");
    setConfirmOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      setEditingItem(null);
      form.reset();
    }
  }

  function handleConfirmDelete() {
    if (!confirmItem) return;
    deleteMutation.mutate(confirmItem.id);
    setConfirmOpen(false);
    setConfirmItem(null);
  }

  function handleConfirmOpenChange(open: boolean) {
    setConfirmOpen(open);
    if (!open) {
      setConfirmItem(null);
    }
  }

  return {
    dialogOpen,
    editingItem,
    form,
    isMutating,
    confirmOpen,
    confirmItem,
    confirmMessage,
    confirmLoading: deleteMutation.isPending,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleCreate,
    handleDialogOpenChange,
    handleConfirmDelete,
    handleConfirmOpenChange,
  };
}
