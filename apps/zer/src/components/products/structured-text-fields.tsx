"use client";

import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateProductDescription } from "@/lib/ai/product-description";

export interface StructuredTextValues {
  description: string;
  additional_info: string;
  usage_instructions: string;
  care_instructions: string;
}

interface StructuredTextFieldsProps {
  values: StructuredTextValues;
  onChange: (values: StructuredTextValues) => void;
  productName?: string;
}

const FIELDS = [
  {
    key: "description" as const,
    label: "Тайлбар",
    placeholder: "Бүтээгдэхүүний ерөнхий тайлбар...",
    maxLength: 2000,
  },
  {
    key: "additional_info" as const,
    label: "Нэмэлт мэдээлэл",
    placeholder: "Бүтээгдэхүүний нэмэлт мэдээлэл...",
    maxLength: 2000,
  },
  {
    key: "usage_instructions" as const,
    label: "Хэрэглэх заавар",
    placeholder: "Хэрхэн хэрэглэх талаар...",
    maxLength: 2000,
  },
  {
    key: "care_instructions" as const,
    label: "Арчилгаа",
    placeholder: "Хадгалах, арчлах заавар...",
    maxLength: 2000,
  },
] as const;

export function StructuredTextFields({
  values,
  onChange,
  productName,
}: StructuredTextFieldsProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleGenerate() {
    if (!productName) return;
    setIsGenerating(true);
    try {
      const result = await generateProductDescription({ productName });
      if (result.description) {
        onChange({ ...values, description: result.description });
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Тайлбар үүсгэхэд алдаа гарлаа");
    } finally {
      setIsGenerating(false);
    }
  }
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Дэлгэрэнгүй мэдээлэл</Label>
      <div className="grid gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label
              htmlFor={`text-${field.key}`}
              className="text-xs text-muted-foreground flex items-center gap-2"
            >
              {field.label}
              {field.key === "description" && productName && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 transition-colors"
                >
                  <Sparkle className="size-3" />
                  {isGenerating ? "Үүсгэж байна..." : "AI үүсгэх"}
                </button>
              )}
            </Label>
            <Textarea
              id={`text-${field.key}`}
              value={values[field.key]}
              onChange={(e) =>
                onChange({ ...values, [field.key]: e.target.value })
              }
              placeholder={field.placeholder}
              maxLength={field.maxLength}
              rows={3}
              className="resize-y"
            />
            <p className="text-right text-[10px] text-muted-foreground">
              {values[field.key].length}/{field.maxLength}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
