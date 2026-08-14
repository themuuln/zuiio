import type { HelperRef, MechanicPickerOption } from "@/lib/types/mechanic";

/**
 * Build ordered mechanic list: [lead, ...helpers, ...unassigned].
 * Used by MechanicAssignSheet and MechanicMultiSelect.
 */
export function buildSelectedMechanics(
  leadMechanicId: string | null,
  helpers: HelperRef[],
  mechanics: MechanicPickerOption[],
): MechanicPickerOption[] {
  const result: MechanicPickerOption[] = [];
  if (leadMechanicId) {
    const lead = mechanics.find((m) => m.id === leadMechanicId);
    if (lead) result.push(lead);
  }
  for (const h of helpers) {
    const hid = h.mechanic_id ?? h.id;
    if (hid === leadMechanicId) continue;
    const m = mechanics.find((mech) => mech.id === hid);
    if (m) result.push(m);
  }
  return result;
}
