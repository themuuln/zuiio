"use client";

import {
  CalendarBlank,
  Cube,
  Gift,
  Percent,
  ShoppingBag,
  Stack,
  Tag,
  Truck,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { formatCurrency, formatDate } from "@/lib/format";

const TYPE_LABELS: Record<string, string> = {
  "1+1": "1+1",
  "2+1": "2+1",
  buy_x_get_y: "1+1 / 2+1",
  threshold_discount: "Босго хямдрал",
  bundle_discount: "Багц хямдрал",
  free_shipping: "Үнэгүй хүргэлт",
};

const CONDITION_TYPE_LABELS: Record<string, string> = {
  min_quantity: "Мин. тоо хэмжээ",
  min_amount: "Мин. дүн",
  specific_products: "Тодорхой бүтээгдэхүүн",
  specific_categories: "Тодорхой ангилал",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: "=",
  gte: "≥",
  lte: "≤",
};

const REWARD_TYPE_LABELS: Record<string, string> = {
  free_product: "Үнэгүй бүтээгдэхүүн",
  percentage_discount: "%-ийн хямдрал",
  fixed_discount: "Тогтмол дүнгийн хямдрал",
  free_shipping: "Үнэгүй хүргэлт",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  buy_x_get_y: <Gift className="size-4" />,
  threshold_discount: <Percent className="size-4" />,
  bundle_discount: <Cube className="size-4" />,
  free_shipping: <Truck className="size-4" />,
};

export interface PromotionConditionData {
  id: string;
  condition_type: string;
  operator: string;
  condition_value: string;
}

export interface PromotionRewardData {
  id: string;
  reward_type: string;
  reward_value: number;
  reward_product_id: string | null;
  reward_product_name?: string | null;
  reward_max_count: number | null;
}

export interface PromotionDetailData {
  id: string;
  name: string;
  description: string | null;
  type: string;
  is_active: boolean;
  priority: number;
  stackable: boolean;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
  conditions?: PromotionConditionData[];
  rewards?: PromotionRewardData[];
}

export function PromotionDetailDrawer({
  promotion,
  open,
  onOpenChange,
}: {
  promotion: PromotionDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={promotion.name}
      description="Урамшууллын дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={promotion.is_active ? "default" : "secondary"}>
            {promotion.is_active ? "Идэвхтэй" : "Идэвхгүй"}
          </Badge>
          {promotion.stackable && (
            <Badge variant="outline">
              <Stack weight="bold" className="mr-1 size-3" />
              Давхцуулах боломжтой
            </Badge>
          )}
        </div>

        {/* Type card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Төрөл</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg">
              {TYPE_ICONS[promotion.type] ?? <Tag className="size-4" />}
            </span>
            <p className="text-xl font-semibold">
              {TYPE_LABELS[promotion.type] ?? promotion.type}
            </p>
          </div>
          {promotion.priority > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Эрэмбэ: {promotion.priority}
            </p>
          )}
        </div>

        {/* Info rows */}
        <div className="divide-y rounded-xl border border-border/80">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <CalendarBlank className="size-4" />
              Хүчинтэй эхлэх
            </span>
            <span className="font-medium">
              {formatDate(promotion.valid_from)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Хүчинтэй дуусах</span>
            <span className="font-medium">
              {promotion.valid_until
                ? formatDate(promotion.valid_until)
                : "Тодорхойгүй"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Ашигласан</span>
            <span className="font-medium">
              {promotion.used_count}
              {promotion.usage_limit !== null
                ? ` / ${promotion.usage_limit}`
                : ""}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-muted-foreground">Үүсгэсэн</span>
            <span className="font-medium">
              {formatDate(promotion.created_at)}
            </span>
          </div>
          {promotion.description && (
            <div className="px-4 py-3 text-sm">
              <span className="mb-1 block text-muted-foreground">Тайлбар</span>
              <span className="font-medium">{promotion.description}</span>
            </div>
          )}
        </div>

        {/* Conditions */}
        {promotion.conditions && promotion.conditions.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Нөхцөлүүд
            </h4>
            <div className="space-y-1.5">
              {promotion.conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {CONDITION_TYPE_LABELS[cond.condition_type] ??
                        cond.condition_type}
                    </span>
                    <span className="font-medium">
                      {OPERATOR_LABELS[cond.operator] ?? cond.operator}{" "}
                      {cond.condition_type === "min_amount"
                        ? formatCurrency(Number(cond.condition_value))
                        : cond.condition_value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rewards */}
        {promotion.rewards && promotion.rewards.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Урамшуулалууд
            </h4>
            <div className="space-y-1.5">
              {promotion.rewards.map((reward) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Gift className="size-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {REWARD_TYPE_LABELS[reward.reward_type] ??
                        reward.reward_type}
                    </span>
                    <span className="font-medium">
                      {reward.reward_type === "percentage_discount"
                        ? `${reward.reward_value}%`
                        : reward.reward_type === "free_shipping"
                          ? formatCurrency(reward.reward_value)
                          : reward.reward_type === "fixed_discount"
                            ? formatCurrency(reward.reward_value)
                            : reward.reward_product_name
                              ? `${reward.reward_product_name} (${
                                  reward.reward_max_count
                                    ? `${reward.reward_max_count} ширхэг`
                                    : "1 ширхэг"
                                })`
                              : formatCurrency(reward.reward_value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DrawerLayout>
  );
}
