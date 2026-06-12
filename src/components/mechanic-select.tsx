"use client";

import { MechanicAvatar } from "@/components/mechanic-avatar";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

interface Mechanic {
  id: string;
  full_name?: string | null;
  fullName?: string | null;
  email?: string;
  current_jobs?: number;
}

interface MechanicSelectProps {
  value: string;
  onChange: (mechanicId: string) => void;
  mechanics: Mechanic[];
  disabled?: boolean;
  placeholder?: string;
  showJobCount?: boolean;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-9 text-xs",
  default: "h-11 text-sm",
  lg: "h-12 text-base",
};

function getMechanicName(m: Mechanic): string {
  return m.full_name ?? m.fullName ?? m.email ?? "Unknown";
}

function getMechanicLabel(m: Mechanic, showJobCount?: boolean): string {
  const name = getMechanicName(m);
  if (showJobCount && m.current_jobs !== undefined && m.current_jobs > 0) {
    return `${name} (${m.current_jobs} job${m.current_jobs !== 1 ? "s" : ""})`;
  }
  return name;
}

export function MechanicSelect({
  value,
  onChange,
  mechanics,
  disabled,
  placeholder = "Unassigned",
  showJobCount,
  className,
  size = "default",
}: MechanicSelectProps) {
  const selectedMechanic = mechanics.find((m) => m.id === value) ?? null;

  return (
    <div className={className}>
      <Combobox
        items={mechanics}
        value={selectedMechanic}
        onValueChange={(mechanic) => {
          onChange(mechanic?.id ?? "");
        }}
        isItemEqualToValue={(a, b) => a?.id === b?.id}
        itemToStringLabel={(mechanic: Mechanic | null) =>
          mechanic ? getMechanicName(mechanic) : ""
        }
        disabled={disabled}
      >
        <ComboboxInput
          placeholder={placeholder}
          disabled={disabled}
          showTrigger
          showClear={!!value}
          className={SIZE_CLASSES[size]}
        />
        <ComboboxContent>
          <ComboboxList>
            {(mechanic: Mechanic) => {
              return (
                <ComboboxItem key={mechanic.id} value={mechanic}>
                  <MechanicAvatar
                    mechanic={{
                      id: mechanic.id,
                      full_name: getMechanicName(mechanic),
                    }}
                    className="size-5 shrink-0"
                  />
                  <span>{getMechanicLabel(mechanic, showJobCount)}</span>
                </ComboboxItem>
              );
            }}
          </ComboboxList>
          <ComboboxEmpty>No mechanics found</ComboboxEmpty>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
