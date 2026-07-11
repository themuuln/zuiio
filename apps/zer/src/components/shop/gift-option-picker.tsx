"use client";

import { Gift } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export type GiftSelection = {
  giftOptionId: string | null;
  giftMessage: string;
};

interface GiftOptionPickerProps {
  value: GiftSelection;
  onChange: (value: GiftSelection) => void;
  disabled?: boolean;
}

export function GiftOptionPicker({
  value,
  onChange,
  disabled,
}: GiftOptionPickerProps) {
  const [expanded, setExpanded] = useState(false);
  const supabase = createClient();

  const { data: options = [] } = useQuery({
    queryKey: ["gift-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gift_options")
        .select("id, name, description, price")
        .eq("is_active", true)
        .order("price");
      return (data ?? []) as {
        id: string;
        name: string;
        description: string | null;
        price: number;
      }[];
    },
    staleTime: 60_000,
  });

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          value.giftOptionId
            ? "border-primary bg-primary/5 text-primary"
            : "hover:bg-muted/50",
          disabled && "opacity-50",
        )}
      >
        <Gift className="size-4" />
        Бэлэглэх
        {value.giftOptionId && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
            Сонгосон
          </span>
        )}
      </button>

      {expanded && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Бэлгийн сонголт
            </Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...value, giftOptionId: null })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  !value.giftOptionId
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted/50",
                )}
              >
                Үгүй
              </button>
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ ...value, giftOptionId: opt.id })}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
                    value.giftOptionId === opt.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted/50",
                  )}
                >
                  {opt.name} ({opt.price.toLocaleString()}₮)
                </button>
              ))}
            </div>
          </div>

          {value.giftOptionId && (
            <div className="space-y-1">
              <Label
                htmlFor="gift-message"
                className="text-xs text-muted-foreground"
              >
                Бэлгийн бичиг (заавал биш)
              </Label>
              <Textarea
                id="gift-message"
                value={value.giftMessage}
                onChange={(e) =>
                  onChange({
                    ...value,
                    giftMessage: e.target.value.slice(0, 200),
                  })
                }
                placeholder="Баярын мэндчилгээ..."
                rows={2}
                maxLength={200}
              />
              <p className="text-right text-[10px] text-muted-foreground">
                {value.giftMessage.length}/200
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
