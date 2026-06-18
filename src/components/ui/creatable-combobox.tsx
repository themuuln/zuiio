"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface CreatableComboboxProps {
  name: string;
  id: string;
  placeholder: string;
  initialItems: string[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
}

export function CreatableCombobox({
  name,
  id,
  placeholder,
  initialItems,
  value,
  onChange,
  emptyLabel = "Сонголт байхгүй",
}: CreatableComboboxProps) {
  const [query, setQuery] = useState(value || "");
  const trimmedQuery = query.trim();
  const loweredQuery = trimmedQuery.toLowerCase();
  const [allItems, setAllItems] = useState<string[]>([...initialItems]);
  const labelMatch =
    loweredQuery === "" ||
    allItems.some((i) => i.toLowerCase().includes(loweredQuery));
  const items: string[] =
    trimmedQuery !== "" && !labelMatch
      ? [...allItems, query.trim()]
      : allItems;

  return (
    <Combobox
      name={name}
      items={items}
      value={value}
      onValueChange={(next: string | null) => {
        if (next && !allItems.includes(next)) {
          setAllItems((prev) => [...prev, next]);
        }
        setQuery(next ?? "");
        onChange(next ?? "");
      }}
      itemToStringLabel={(item: string | null) =>
        item ? (allItems.includes(item) ? item : `"${item}" үүсгэх`) : ""
      }
      inputValue={query}
      onInputValueChange={setQuery}
    >
      <ComboboxInput id={id} placeholder={placeholder} showTrigger className="w-full" />
      <ComboboxContent>
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
