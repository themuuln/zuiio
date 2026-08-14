"use client";

import { Storefront } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";
import {
  updateOrgFeatureSetting,
  updateOrgHardwareSetting,
  updateShopDefaultPaymentMethod,
} from "./actions";

export type ShopPosSettingsValues = {
  has_checkout_customer: boolean;
  has_checkout_quick_amounts: boolean;
  has_receipt_drawer: boolean;
  has_receipt_printer: boolean;
  has_cash_drawer: boolean;
  has_track_stock: boolean;
  shop_default_payment_method: string;
  escpos_host: string | null;
  escpos_port: number | null;
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
    | "has_receipt_printer"
    | "has_cash_drawer"
    | "has_track_stock";
  label: string;
  description: string;
  /** i18n keys — when present, the label/description are translated. */
  labelKey?: MessageKey;
  descriptionKey?: MessageKey;
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
    key: "has_receipt_printer",
    label: "Баримт хэвлэгч",
    description:
      "Борлуулалт бүрийн дараа баримтыг автоматаар хэвлэх. Баримт хэвлэгч холбогдсон дэлгүүрт асаана.",
    labelKey: "settings.receiptPrinter",
    descriptionKey: "settings.receiptPrinter.description",
  },
  {
    key: "has_cash_drawer",
    label: "Мөнгөн хайрцаг",
    description:
      "Бэлэн төлбөр бүрийн дараа мөнгөн хайрцгийг автоматаар нээх. Хайрцаг ESC/POS принтерийн портоос удирдагдана.",
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
  const { t } = useI18n();
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
          {TOGGLES.map((tgl) => (
            <PosToggle
              key={tgl.key}
              settingKey={tgl.key}
              label={tgl.labelKey ? t(tgl.labelKey) : tgl.label}
              description={
                tgl.descriptionKey ? t(tgl.descriptionKey) : tgl.description
              }
              defaultValue={initial[tgl.key]}
            />
          ))}
        </div>

        <EscPosConfig host={initial.escpos_host} port={initial.escpos_port} />

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

function EscPosConfig({
  host,
  port,
}: {
  host: string | null;
  port: number | null;
}) {
  const [hostValue, setHostValue] = useState(host ?? "");
  const [portValue, setPortValue] = useState(String(port ?? 9100));
  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("escpos_host", hostValue);
      formData.append("escpos_port", portValue);
      const result = await updateOrgHardwareSetting(undefined, formData);
      if (result && "error" in result) throw new Error(result.error);
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success("Принтерийн тохиргоо хадгалагдлаа.");
    },
  });

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">ESC/POS принтер</p>
        <p className="text-xs text-muted-foreground">
          Сүлжээний дулааны принтерийн хаяг. Тохируулсан үед баримтыг ESC/POS
          драйвераар хэвлэж, бэлэн төлбөрт мөнгөн хайрцгийг нээнэ. Хоосон үед
          хөтчийн хэвлэх цонх ашиглана.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
        <div className="space-y-1">
          <Label htmlFor="escpos-host">Хаяг (IP / hostname)</Label>
          <Input
            id="escpos-host"
            value={hostValue}
            onChange={(e) => setHostValue(e.target.value)}
            placeholder="192.168.1.50"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="escpos-port">Порт</Label>
          <Input
            id="escpos-port"
            value={portValue}
            onChange={(e) => setPortValue(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder="9100"
            autoComplete="off"
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        Хадгалах
      </Button>
    </div>
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
        if (method === null) return;
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
