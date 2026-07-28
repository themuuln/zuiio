"use client";

import { CaretDown, Check } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface CurrencyOption {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
}

const DEFAULT_CURRENCIES: CurrencyOption[] = [
  {
    id: "mnt",
    code: "MNT",
    name: "Монгол төгрөг",
    symbol: "₮",
    exchange_rate: 1.0,
    is_default: true,
  },
  {
    id: "usd",
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    exchange_rate: 3400.0,
    is_default: false,
  },
  {
    id: "cny",
    code: "CNY",
    name: "Chinese Yuan",
    symbol: "¥",
    exchange_rate: 470.0,
    is_default: false,
  },
  {
    id: "rub",
    code: "RUB",
    name: "Russian Ruble",
    symbol: "₽",
    exchange_rate: 38.0,
    is_default: false,
  },
  {
    id: "eur",
    code: "EUR",
    name: "Euro",
    symbol: "€",
    exchange_rate: 3700.0,
    is_default: false,
  },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: CurrencyOption) => void;
  currencies?: CurrencyOption[];
  disabled?: boolean;
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  currencies = DEFAULT_CURRENCIES,
  disabled,
  className,
}: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = currencies.find((c) => c.id === value) ?? currencies[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[200px] justify-between", className)}
          disabled={disabled}
        >
          <span className="flex items-center gap-2">
            <span className="font-medium">{selected?.symbol}</span>
            <span>{selected?.code}</span>
          </span>
          <CaretDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Валют сонгох..." />
          <CommandList>
            <CommandEmpty>Валют олдсонгүй.</CommandEmpty>
            <CommandGroup>
              {currencies.map((currency) => (
                <CommandItem
                  key={currency.id}
                  value={`${currency.code} ${currency.name}`}
                  onSelect={() => {
                    onChange(currency);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === currency.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="mr-2 font-medium">{currency.symbol}</span>
                  <span>{currency.code}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {currency.name}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
