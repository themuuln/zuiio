"use client";

import { useMemo, useState } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface ItemGroup {
  label?: string;
  items: readonly string[];
}

interface CreatableComboboxProps {
  name: string;
  id: string;
  placeholder: string;
  initialItems: readonly string[] | readonly ItemGroup[];
  value: string;
  onChange: (value: string) => void;
  emptyLabel?: string;
}

function flattenItems(
  initialItems: readonly string[] | readonly ItemGroup[],
): string[] {
  if (initialItems.length === 0) return [];
  if (typeof initialItems[0] === "string") {
    return initialItems as string[];
  }
  return (initialItems as ItemGroup[]).flatMap((g) => g.items);
}

function getGroups(
  initialItems: readonly string[] | readonly ItemGroup[],
): readonly ItemGroup[] | undefined {
  if (initialItems.length === 0) return undefined;
  if (typeof initialItems[0] === "string") return undefined;
  return initialItems as ItemGroup[];
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
  const loweredQuery = query.trim().toLowerCase();

  const flatAllItems = useMemo(
    () => flattenItems(initialItems),
    [initialItems],
  );
  const groups = useMemo(() => getGroups(initialItems), [initialItems]);

  const [allItems, setAllItems] = useState<string[]>([...flatAllItems]);

  const filtered = loweredQuery
    ? allItems.filter((i) => i.toLowerCase().includes(loweredQuery))
    : allItems;
  const items: string[] =
    query.trim() !== "" && filtered.length === 0 ? [query.trim()] : filtered;

  // When filtering, don't pass groups — show flat results
  const showGroups = groups && !loweredQuery;

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
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        showTrigger
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList groups={showGroups ? groups : undefined}>
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
