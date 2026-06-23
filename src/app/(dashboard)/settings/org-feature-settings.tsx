"use client";

import { GearSix } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { updateOrgFeatureSetting } from "./actions";

type OrgSettings = {
  has_suppliers: boolean;
  has_inventory: boolean;
  has_customer_credit: boolean;
  has_multi_branch: boolean;
  has_variants: boolean;
  has_brands: boolean;
  has_categories: boolean;
  has_email_reports: boolean;
  has_audit_log: boolean;
};

const SETTINGS: {
  key: keyof OrgSettings;
  label: string;
  description: string;
}[] = [
  {
    key: "has_suppliers",
    label: "Нийлүүлэгчтэй ажиллах",
    description:
      "Худалдан авалт, нөөц дүүргэлтэд нийлүүлэгч сонгох шаардлагатай",
  },
  {
    key: "has_inventory",
    label: "Барааны үлдэгдэл хянах",
    description:
      "Агуулах, үлдэгдэл хөдөлгөөн, тохируулга, нөөц дүүргэлт харагдана",
  },
  {
    key: "has_customer_credit",
    label: "Харилцагчийн өр/авлага хянах",
    description: "Харилцагчийн үлдэгдэл, авлагын мэдээлэл харагдана",
  },
  {
    key: "has_multi_branch",
    label: "Олон салбартай",
    description: "Салбар сонгогч, салбарын тохиргоо харагдана",
  },
  {
    key: "has_variants",
    label: "Бүтээгдэхүүн варианттай",
    description: "Хэмжээ, өнгө, амт гэх мэт вариант бүртгэх боломжтой",
  },
  {
    key: "has_brands",
    label: "Брэндээр ялгах",
    description: "Брэнд сонголт, брэнд сан, шүүлт харагдана",
  },
  {
    key: "has_categories",
    label: "Ангилал хэрэглэх",
    description: "Ангилалын хуудас, шүүлт харагдана",
  },
  {
    key: "has_email_reports",
    label: "И-мэйл тайлан",
    description: "Өдөр тутмын тайлан, SMTP тохиргоо харагдана",
  },
  {
    key: "has_audit_log",
    label: "Үйлдлийн түүх",
    description: "Үйлдлийн түүх хажуугийн цэсэнд харагдана",
  },
];

export function OrgFeatureSettings({ initial }: { initial: OrgSettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GearSix className="size-5" />
          Байгууллагын тохиргоо
        </CardTitle>
        <CardDescription>
          Модулиуд болон боломжуудыг идэвхжүүлэх/идэвхгүй болгох
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {SETTINGS.map((s) => (
            <FeatureToggle
              key={s.key}
              settingKey={s.key}
              label={s.label}
              description={s.description}
              defaultValue={initial[s.key]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FeatureToggle({
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
      if (result?.error) throw new Error(result.error);
    },
    onError: (err) => {
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success(`${label} шинэчлэгдлээ.`);
    },
  });

  return (
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
