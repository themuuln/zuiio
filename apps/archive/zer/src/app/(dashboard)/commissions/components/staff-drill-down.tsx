"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  type CreatePayoutState,
  createPayout,
  type UnpaidSaleItem,
} from "../actions";

export function StaffDrillDown({
  orgId: _orgId,
  profileId,
  profileName,
  items,
  isLoading,
  onSuccess,
}: {
  orgId: string;
  profileId: string;
  profileName: string;
  items: UnpaidSaleItem[];
  isLoading: boolean;
  onSuccess: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const prevProfileIdRef = useRef(profileId);

  const [state, formAction, isPending] = useActionState<
    CreatePayoutState | undefined,
    FormData
  >(createPayout, undefined);

  // Reset selection when profile changes
  useEffect(() => {
    if (prevProfileIdRef.current !== profileId) {
      prevProfileIdRef.current = profileId;
      setSelectedIds(new Set());
      setShowConfirm(false);
    }
  });

  // Handle success: notify parent
  useEffect(() => {
    if (state === undefined && !isPending && selectedIds.size > 0) {
      // Payout succeeded - formAction returned undefined
      setSelectedIds(new Set());
      setShowConfirm(false);
      onSuccess();
    }
  }, [state, isPending, selectedIds.size, onSuccess]);

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  const totalSelected = useMemo(() => {
    let sum = 0;
    for (const item of items) {
      if (selectedIds.has(item.id)) {
        sum += item.total_price * (item.commission_amount / 100);
      }
    }
    return sum;
  }, [items, selectedIds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        Уншиж байна...
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="font-semibold">{profileName}</h3>
          <p className="text-xs text-muted-foreground">
            {items.length} ширхэг төлөгдөөгүй комисс
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            {selectedIds.size === items.length
              ? "Бүгдийг цуцлах"
              : "Бүгдийг сонгох"}
          </Button>
        </div>
      </div>

      {/* Unpaid Items List */}
      <div className="divide-y divide-border/40">
        {items.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/50",
                isSelected && "bg-primary/5",
              )}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleItem(item.id)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <div className="flex flex-1 items-center justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    Борлуулалт #{item.sale_id.slice(0, 8)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.sale_date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-green-600">
                    {item.commission_amount.toLocaleString()}₮
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Дүн: {item.total_price.toLocaleString()}₮
                  </p>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Footer with total and payout button */}
      <div className="flex items-center justify-between border-t px-5 py-4">
        <div>
          {selectedIds.size > 0 && (
            <p className="text-sm">
              Сонгосон: <strong>{selectedIds.size}</strong> комисс, нийт{" "}
              <strong>{totalSelected.toLocaleString()}₮</strong>
            </p>
          )}
          {state?.error && (
            <p className="text-sm text-red-500">{state.error}</p>
          )}
        </div>
        <div className="flex gap-2">
          {showConfirm ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowConfirm(false)}
              >
                Цуцлах
              </Button>
              <form action={formAction}>
                <input type="hidden" name="profile_id" value={profileId} />
                {Array.from(selectedIds).map((id) => (
                  <input
                    key={id}
                    type="hidden"
                    name="sale_item_ids"
                    value={id}
                  />
                ))}
                <Button type="submit" size="sm" disabled={isPending}>
                  {isPending ? "Үүсгэж байна..." : `Баталгаажуулах`}
                </Button>
              </form>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled={selectedIds.size === 0}
              onClick={() => {
                if (selectedIds.size === 0) return;
                setShowConfirm(true);
              }}
            >
              Төлөлт хийх ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation step */}
      {showConfirm && selectedIds.size > 0 && (
        <div className="border-t bg-muted/30 px-5 py-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-medium">Төлөлт баталгаажуулах</p>
            <p className="mt-1">
              <strong>{profileName}</strong>-д{" "}
              <strong>{selectedIds.size}</strong> комисс, нийт{" "}
              <strong>{totalSelected.toLocaleString()}₮</strong> төлөх гэж
              байна. Та итгэлтэй байна уу?
            </p>
          </div>
        </div>
      )}

      {/* Empty selection error */}
      {state?.error && selectedIds.size === 0 && (
        <div className="border-t bg-red-50/50 px-5 py-3">
          <p className="text-sm text-red-600">{state.error}</p>
        </div>
      )}
    </div>
  );
}
