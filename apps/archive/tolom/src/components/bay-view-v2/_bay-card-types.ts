import type { BaySlotData } from "@/lib/services/bay-view-service";
import type { MechanicRef } from "@/lib/types/mechanic";

export type BayCardMechanic = MechanicRef;

export type BayCardWorkOrder = NonNullable<BaySlotData["workOrder"]>;

export interface BayCardActionHandlers {
  onStatusChange: (woId: string, status: string) => void;
  onRemoveFromBay?: (woId: string) => void;
  onOpenDetail: (
    woId: string,
    initialAction?: "add-service" | "add-part",
  ) => void;
  onAssignClick?: (bayNumber: number) => void;
  onRemoveHelper?: (woId: string, mechanicId: string) => void;
  onAssignMechanic?: (woId: string, mechanicId: string) => Promise<void>;
  onRemoveMechanic?: (woId: string) => Promise<void>;
  onAddHelper?: (woId: string, mechanicId: string) => Promise<void>;
  onReorderMechanics?: (
    woId: string,
    orderedMechanicIds: string[],
  ) => Promise<void>;
}

export interface BayCardProps extends BayCardActionHandlers {
  bay: BaySlotData;
  isPending?: boolean;
  isKanbanMode?: boolean;
  orgId?: string | null;
  mechanics?: BayCardMechanic[];
}
