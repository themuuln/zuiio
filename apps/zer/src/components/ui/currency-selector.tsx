import { NativeSelect, NativeSelectOption } from "./native-select";

export interface CurrencyOption {
  id: string;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_default: boolean;
}

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: CurrencyOption) => void;
  currencies: CurrencyOption[];
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  currencies,
  className,
}: CurrencySelectorProps) {
  return (
    <NativeSelect
      value={value}
      className={className}
      onChange={(e) => {
        const selected = currencies.find((c) => c.id === e.target.value);
        if (selected) onChange(selected);
      }}
    >
      {currencies.map((currency) => (
        <NativeSelectOption key={currency.id} value={currency.id}>
          {currency.code} — {currency.name} ({currency.symbol})
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
