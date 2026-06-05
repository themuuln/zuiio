"use client";

import { Check, Crown, Loader2, Plus, UserMinus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getMechanicColor, getMechanicInitials } from "@/lib/mechanic-colors";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface MechanicOption {
  id: string;
  full_name: string;
  current_jobs?: number;
}

interface Helper {
  id: string;
  full_name?: string | null | undefined;
}

interface MechanicMultiSelectProps {
  leadMechanicId: string | null;
  leadMechanicName: string | null;
  helpers: Helper[];
  mechanics: MechanicOption[];
  orgId: string;
  workOrderId: string;
  saving: boolean;
  onLeadChange: (mechanicId: string) => void;
  onHelpersChange: () => void;
}

export function MechanicMultiSelect({
  leadMechanicId,
  leadMechanicName,
  helpers,
  mechanics,
  orgId,
  workOrderId,
  saving,
  onLeadChange,
  onHelpersChange,
}: MechanicMultiSelectProps) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isBusy = saving || busy;

  const helperIds = new Set(helpers.map((h) => h.id));
  const availableForHelper = mechanics.filter(
    (m) => m.id !== leadMechanicId && !helperIds.has(m.id),
  );

  const helperIdSet = new Set(helpers.map((h) => h.id));
  const availableForLead = mechanics.filter((m) => !helperIdSet.has(m.id));

  async function addHelper(mechanicId: string) {
    if (!workOrderId || isBusy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mechanic_id: mechanicId }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to add helper");
      } else {
        toast.success("Helper added");
        onHelpersChange();
      }
    } catch {
      toast.error("Failed to add helper");
    } finally {
      setBusy(false);
      setAddOpen(false);
    }
  }

  async function removeHelper(mechanicId: string) {
    if (!workOrderId || isBusy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers?mechanicId=${mechanicId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? "Failed to remove helper");
      } else {
        toast.success("Helper removed");
        onHelpersChange();
      }
    } catch {
      toast.error("Failed to remove helper");
    } finally {
      setBusy(false);
      setRemoveTarget(null);
    }
  }

  function selectLead(mechanicId: string) {
    onLeadChange(mechanicId);
    setLeadOpen(false);
  }

  const leadColor = leadMechanicId ? getMechanicColor(leadMechanicId) : null;
  const leadInitials = leadMechanicName
    ? getMechanicInitials(leadMechanicName)
    : null;

  return (
    <div className="flex items-center gap-1 min-w-0">
      {/* Lead mechanic trigger */}
      <Popover open={leadOpen} onOpenChange={setLeadOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className="h-7 gap-1.5 px-1.5 py-1 justify-start shrink-0"
            />
          }
        >
          <Crown className="size-3 shrink-0 text-amber-500" />
          {leadMechanicId && leadColor && leadInitials ? (
            <>
              <Avatar className="size-5 shrink-0 after:hidden">
                <AvatarFallback
                  className={cn(
                    "text-[9px] font-medium",
                    leadColor.bg,
                    leadColor.text,
                  )}
                >
                  {leadInitials}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-semibold text-foreground max-w-[90px]">
                {leadMechanicName}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground italic text-xs">Lead</span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" side="bottom" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty className="text-xs">No mechanics</CommandEmpty>
              <CommandGroup>
                {availableForLead.map((m) => {
                  const color = getMechanicColor(m.id);
                  const initials = getMechanicInitials(m.full_name);
                  return (
                    <CommandItem
                      key={m.id}
                      value={m.full_name}
                      onSelect={() => selectLead(m.id)}
                      className="cursor-pointer"
                    >
                      <Avatar className="size-4 shrink-0 after:hidden">
                        <AvatarFallback
                          className={cn(
                            "text-[8px] font-medium",
                            color.bg,
                            color.text,
                          )}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-xs">
                        {m.full_name}
                      </span>
                      {helperIdSet.has(m.id) && (
                        <Check className="size-3 text-primary shrink-0" />
                      )}
                      {m.current_jobs !== undefined && m.current_jobs > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {m.current_jobs}j
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Helper badges */}
      {helpers.map((helper) => {
        const color = getMechanicColor(helper.id);
        const initials = getMechanicInitials(helper.full_name);
        return (
          <Popover
            key={helper.id}
            open={removeTarget === helper.id}
            onOpenChange={(open) => setRemoveTarget(open ? helper.id : null)}
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          disabled={isBusy}
                          className={cn(
                            "shrink-0 rounded-full ring-1 ring-border/60 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                            isBusy && "opacity-50 cursor-not-allowed",
                          )}
                        />
                      }
                    />
                  }
                >
                  <Avatar className="size-5">
                    <AvatarFallback
                      className={cn(
                        "text-[9px] font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {helper.full_name ?? "Unknown"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-40 p-2" side="bottom" align="center">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 px-1.5 py-0.5">
                  <Avatar className="size-4 shrink-0 after:hidden">
                    <AvatarFallback
                      className={cn(
                        "text-[8px] font-medium",
                        color.bg,
                        color.text,
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate font-medium">
                    {helper.full_name ?? "Unknown"}
                  </span>
                </div>
                <span className="px-1.5 text-[9px] text-muted-foreground font-mono">
                  ID: {helper.id.slice(-6)}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start gap-1.5 h-6 text-[10px]"
                  disabled={isBusy}
                  onClick={() => removeHelper(helper.id)}
                >
                  <UserMinus className="size-3" />
                  Remove
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        );
      })}

      {/* Add helper */}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              disabled={isBusy || availableForHelper.length === 0}
              className="shrink-0 rounded-full border border-dashed border-border/60 text-muted-foreground hover:text-foreground"
              title="Add helper"
            />
          }
        >
          {isBusy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Plus className="size-3" />
          )}
        </PopoverTrigger>
        <PopoverContent className="w-52 p-0" side="bottom" align="start">
          <Command>
            <CommandInput placeholder="Search..." className="h-8 text-xs" />
            <CommandList>
              <CommandEmpty className="text-xs">No mechanics</CommandEmpty>
              <CommandGroup>
                {availableForHelper.map((m) => {
                  const color = getMechanicColor(m.id);
                  const initials = getMechanicInitials(m.full_name);
                  return (
                    <CommandItem
                      key={m.id}
                      value={m.full_name}
                      onSelect={() => addHelper(m.id)}
                      className="cursor-pointer"
                    >
                      <Avatar className="size-4 shrink-0 after:hidden">
                        <AvatarFallback
                          className={cn(
                            "text-[8px] font-medium",
                            color.bg,
                            color.text,
                          )}
                        >
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-xs">
                        {m.full_name}
                      </span>
                      {m.current_jobs !== undefined && m.current_jobs > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {m.current_jobs}j
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
