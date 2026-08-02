"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Buildings, Storefront } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { COMPANY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { createOrganization } from "./actions";

const orgSchema = z.object({
  name: z.string().min(1, "Байгууллагын нэр шаардлагатай."),
  company_type: z.string(),
  slug: z.string().min(1, "Холбоос шаардлагатай."),
});

type OrgValues = z.infer<typeof orgSchema>;

export default function NewOrganizationPage() {
  const { t } = useI18n();
  const [serverError, setServerError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrgValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: {
      name: "",
      company_type: "gym",
      slug: "",
    },
  });

  const name = watch("name");

  useEffect(() => {
    if (!slugTouched) {
      setValue("slug", slugify(name));
    }
  }, [name, slugTouched, setValue]);

  const onSubmit = async (data: OrgValues) => {
    setServerError(null);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("company_type", data.company_type);
    formData.append("slug", data.slug);

    const result = await createOrganization(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Байгууллага үүсгэх</CardTitle>
        <CardDescription>Байгууллагын нэрээ оруулаад эхэлцгээе</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Байгууллагын нэр</FieldLabel>
              <div className="relative">
                <Buildings className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Жишээ дэлгүүр"
                  required
                  className="text-sm pl-9"
                  {...register("name")}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="company_type">
                {t("settings.organizationType")}
              </FieldLabel>
              <div className="relative">
                <Storefront className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                <NativeSelect
                  id="company_type"
                  className="w-full pl-9"
                  {...register("company_type")}
                >
                  {COMPANY_TYPES.map((ct) => (
                    <NativeSelectOption key={ct.value} value={ct.value}>
                      {t(ct.labelKey)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </Field>
            <Field>
              <FieldLabel htmlFor="slug">Холбоос</FieldLabel>
              <Input
                id="slug"
                placeholder="jishee-delguur"
                required
                className="font-mono text-sm"
                {...register("slug", {
                  onChange: () => setSlugTouched(true),
                })}
              />
              <p className="text-xs text-muted-foreground">
                Автоматаар үүсэх болно. Хэрэв засварлавал автомат шинэчлэлт
                зогсоно.
              </p>
            </Field>
          </FieldGroup>

          <ErrorBanner error={serverError} />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Үүсгэж байна..." : "Байгууллага үүсгэх"}
            <ArrowRight data-icon="inline-end" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
