"use client";

import { useEffect, useState } from "react";
import { getStaffList } from "@/app/(dashboard)/shop/actions";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

type StaffProfile = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type StaffPickerProps = {
  /** Name attribute for the hidden form input. Defaults to "salesperson_id". */
  name?: string;
};

/**
 * Reusable staff picker component that fetches profiles in the current
 * organization and allows selecting one. Defaults to the logged-in user.
 * Passes the selected staff ID as a hidden form field with the given `name`.
 */
export function StaffPicker({ name = "salesperson_id" }: StaffPickerProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    getStaffList()
      .then(
        (result: {
          error?: string;
          profiles?: StaffProfile[];
          currentUserId?: string;
        }) => {
          if (result.error) {
            console.error(result.error);
            return;
          }
          const staffList = result.profiles ?? [];
          setProfiles(staffList);

          // Pre-select the current user
          const currentUser = staffList.find(
            (p) => p.id === result.currentUserId,
          );
          if (currentUser) {
            setSelectedProfile(currentUser);
            setInputValue(currentUser.full_name ?? "");
          }
        },
      )
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        Борлуулагч
      </span>

      {loading ? (
        <div className="flex h-[44px] items-center rounded-xl border border-border bg-card px-3 text-sm text-muted-foreground">
          Ачаалж байна...
        </div>
      ) : (
        <Combobox
          name={name}
          items={profiles}
          value={selectedProfile}
          onValueChange={(next) => {
            setSelectedProfile(next);
            setInputValue(next?.full_name ?? "");
          }}
          itemToStringValue={(profile: StaffProfile | null) =>
            profile?.id ?? ""
          }
          itemToStringLabel={(profile: StaffProfile | null) =>
            profile?.full_name ?? ""
          }
          inputValue={inputValue}
          onInputValueChange={setInputValue}
        >
          <ComboboxInput
            placeholder="Борлуулагч сонгох..."
            showTrigger
            className="w-full"
          />
          <ComboboxContent>
            <ComboboxEmpty>Борлуулагч олдсонгүй</ComboboxEmpty>
            <ComboboxList>
              {(profile: StaffProfile) => (
                <ComboboxItem key={profile.id} value={profile}>
                  {profile.full_name ?? "Нэргүй"}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </div>
  );
}
