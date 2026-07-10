/** Minimal mechanic reference — used in work order data, avatars, chips, and pickers. */
export interface MechanicRef {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

/** Mechanic with workload info — used in pickers that show "N active jobs". */
export interface MechanicPickerOption extends MechanicRef {
  current_jobs?: number;
}

/** Helper assignment reference — `mechanic_id` is the real ID on DB join rows. */
export interface HelperRef {
  id: string;
  mechanic_id?: string;
  full_name?: string | null;
  avatar_url?: string | null;
}
