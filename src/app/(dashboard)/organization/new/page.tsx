"use client";

import { ArrowRight, Buildings, Storefront } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { COMPANY_TYPES } from "@/lib/constants";
import { slugify } from "@/lib/format";
import { createOrganization } from "./actions";

export default function NewOrganizationPage() {
  const [state, action, pending] = useActionState(
    createOrganization,
    undefined,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const _handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (!slugTouched) {
      setSlug(slugify(newName));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(e.target.value);
    setSlugTouched(true);
  };

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Байгууллага үүсгэх</CardTitle>
          <CardDescription>
            Байгууллагын нэрээ оруулаад эхэлцгээе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Байгууллагын нэр</FieldLabel>
                <div className="relative">
                  <Buildings className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Жишээ дэлгүүр"
                    required
                    className="pl-9"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="company_type">
                  Байгууллагын төрөл
                </FieldLabel>
                <div className="relative">
                  <Storefront className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <NativeSelect
                    id="company_type"
                    name="company_type"
                    className="w-full pl-9"
                    defaultValue="retail"
                  >
                    {COMPANY_TYPES.map((ct) => (
                      <NativeSelectOption key={ct.value} value={ct.value}>
                        {ct.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="slug">Холбоос</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  placeholder="jishee-delguur"
                  required
                  value={slug}
                  onChange={handleSlugChange}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Автоматаар үүсэх болно. Хэрэв засварлавал автомат шинэчлэлт
                  зогсоно.
                </p>
              </Field>
            </FieldGroup>

            {state?.error && (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <Button type="submit" disabled={pending}>
              Байгууллага үүсгэх
              <ArrowRight data-icon="inline-end" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
