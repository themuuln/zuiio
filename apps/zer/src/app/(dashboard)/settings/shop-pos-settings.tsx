"use client";

import { Storefront } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateOrgFeatureSetting,
  updateShopDefaultPaymentMethod,
} from "./actions";

export type ShopPosSettingsValues = {
  has_checkout_customer: boolean;
  has_checkout_quick_amounts: boolean;
  has_receipt_drawer: boolean;
  has_track_stock: boolean;
  shop_default_payment_method: string;
};

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Бэлэн" },
  { value: "card", label: "Карт" },
  { value: "bank_transfer", label: "Данс" },
  { value: "invoice", label: "Нэхэмжлэл" },
] as const;

const TOGGLES: {
  key:
    | "has_checkout_customer"
    | "has_checkout_quick_amounts"
    | "has_receipt_drawer"
    | "has_track_stock";
  label: string;
  description: string;
}[] = [
  {
    key: "has_checkout_customer",
    label: "Худалдан авалтад харилцагч бүртгэх",
    description:
      "Төлбөр тооцооны цонхонд харилцагч, борлуулагч сонгох хэсэг харагдана. CRM хэрэггүй дэлгүүрт унтраана.",
  },
  {
    key: "has_checkout_quick_amounts",
    label: "Бэлэн дүнгийн товчнууд",
    description:
      "Төлсөн дүнг 5,000₮, 10,000₮ гэх мэт дэвсгэртээр хурдан сонгох товчнууд харагдана.",
  },
  {
    key: "has_receipt_drawer",
    label: "Баримтыг цонхонд харуулах",
    description:
      "Борлуулалт хийсний дараа баримтыг цонхонд харуулна. Баримт хэвлэх шаардлагагүй дэлгүүрт унтраана.",
  },
  {
    key: "has_track_stock",
    label: "Барааны үлдэгдэл хянах",
    description:
      "Унтраасан үед дэлгүүр бүх барааг боломжтой гэж харуулна (үлдэгдэл тооцохгүй). Эхний үлдэгдэл оруулаагүй дэлгүүрт зориулагдсан.",
  },
];

/**
 * POS / shop checkout settings — quality-of-life toggles for the checkout
 * drawer plus the default payment method.
 */
export function ShopPosSettings({
  initial,
}: {
  initial: ShopPosSettingsValues;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Storefront className="size-5" />
          Дэлгүүр (POS) тохиргоо
        </CardTitle>
        <CardDescription>
          Төлбөр тооцооны цонхны харагдац, үндсэн утгууд
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {TOGGLES.map((t) => (
            <PosToggle
              key={t.key}
              settingKey={t.key}
              label={t.label}
              description={t.description}
              defaultValue={initial[t.key]}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div>
            <p className="text-sm font-medium">Үндсэн төлбөрийн хэлбэр</p>
            <p className="text-xs text-muted-foreground">
              Төлбөр тооцоо нээгдэхэд урьдчилан сонгогдсон байх хэлбэр
            </p>
          </div>
          <DefaultPaymentMethodSelect
            initial={initial.shop_default_payment_method}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PosToggle({
  settingKey,
  label,
  description,
  defaultValue,
}: {
  settingKey: string;
  label: string;
  description: string;
  defaultValue: boolean;
}) {
  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      const formData = new FormData();
      formData.append("setting", settingKey);
      formData.append("value", String(value));
      const result = await updateOrgFeatureSetting(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success(`${label} шинэчлэгдлээ.`);
    },
  });

  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: shadcn Checkbox renders a semantic checkbox button
    <label className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors">
      <Checkbox
        defaultChecked={defaultValue}
        onCheckedChange={(checked) => {
          mutation.mutate(checked === true);
        }}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </label>
  );
}

function DefaultPaymentMethodSelect({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const mutation = useMutation({
    mutationFn: async (method: string) => {
      const formData = new FormData();
      formData.append("payment_method", method);
      const result = await updateShopDefaultPaymentMethod(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Үндсэн төлбөрийн хэлбэр шинэчлэгдлээ.");
    },
  });

  return (
    <Select
      value={value}
      onValueChange={(method) => {
        setValue(method);
        mutation.mutate(method);
      }}
    >
      <SelectTrigger className="w-[140px]" aria-label="Үндсэн төлбөрийн хэлбэр">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAYMENT_METHOD_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
