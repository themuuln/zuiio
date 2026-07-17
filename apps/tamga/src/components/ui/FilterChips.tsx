import { ScrollView } from "react-native";
import { Chip } from "./Chip";

interface FilterChipsProps {
  options: { label: string; value: string }[];
  selected: string;
  onSelect: (value: string) => void;
}

export function FilterChips({ options, selected, onSelect }: FilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4 py-2"
    >
      {options.map((opt) => (
        <Chip
          key={opt.value}
          label={opt.label}
          selected={selected === opt.value}
          onPress={() => onSelect(opt.value)}
        />
      ))}
    </ScrollView>
  );
}
