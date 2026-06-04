import { Car, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BuuzHint } from "@/components/ui/plate-input";
import { formatPlateInput } from "@/lib/form-ux";
import { transliterateMongolianPlate } from "@/lib/form-validation";
import type { SearchVehicleResult } from "./_vehicle-registration-schema";

interface PlateSearchInputProps {
  plate: string;
  onPlateChange: (value: string) => void;
  searchResults: SearchVehicleResult[];
  searchLoading: boolean;
  showDropdown: boolean;
  onSearch: (term: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSelect: (vehicle: SearchVehicleResult) => void;
  onLookup: () => void;
  lookupLoading: boolean;
  placeholder: string;
  lookupLabel: string;
  plateRef: React.RefObject<HTMLInputElement | null>;
  /** Whether the plate input is focused — controls Buuz hint visibility */
  plateFocused: boolean;
}

export function PlateSearchInput({
  plate,
  onPlateChange,
  searchResults,
  searchLoading,
  showDropdown,
  onSearch,
  onFocus,
  onBlur,
  onKeyDown,
  onSelect,
  onLookup,
  lookupLoading,
  placeholder,
  lookupLabel,
  plateRef,
  plateFocused,
}: PlateSearchInputProps) {
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          ref={plateRef}
          value={plate}
          onChange={(e) => {
            const val = formatPlateInput(
              transliterateMongolianPlate(e.target.value),
            );
            onPlateChange(val);
            onSearch(val);
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-11 pl-10 pr-8 font-mono uppercase"
        />
        {searchLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
        )}
        {plateFocused && (
          <div className="absolute left-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-popover p-2.5 shadow-md transition-all duration-150">
            <BuuzHint />
          </div>
        )}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
            {searchResults.map((v) => (
              <button
                key={v.id}
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors first:rounded-t-lg last:rounded-b-lg"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(v);
                }}
              >
                <div className="size-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Car className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {v.plate_number}
                    </span>
                    {v.year && (
                      <span className="text-xs text-muted-foreground">
                        {v.year}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {v.make} {v.model}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <Button
        type="button"
        onClick={onLookup}
        disabled={lookupLoading || !plate.trim()}
      >
        {lookupLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
        {lookupLabel}
      </Button>
    </div>
  );
}
