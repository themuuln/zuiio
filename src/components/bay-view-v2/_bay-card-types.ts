import type { BaySlotData } from "@/lib/services/bay-view-service";

export type BayCardMechanic = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type BayCardWorkOrder = NonNullable<BaySlotData["workOrder"]>;

export interface BayCardActionHandlers {
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (woId: string) => void;
  onAssignClick?: (bayNumber: number) => void;
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onPauseTimer?: (woId: string) => void;
  onAddNote?: (woId: string) => void;
  onQuickAddService?: (woId: string) => void;
  onQuickAddParts?: (woId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
}

export interface BayCardProps extends BayCardActionHandlers {
  bay: BaySlotData;
  isPending?: boolean;
  isKanbanMode?: boolean;
  orgId?: string | null;
  mechanics?: BayCardMechanic[];
}
