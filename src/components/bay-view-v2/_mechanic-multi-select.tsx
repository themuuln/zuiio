"use client";

import { Crown, Loader2, Plus, UserMinus, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface MechanicOption {
  id: string;
  full_name: string;
  current_jobs?: number;
}

interface Helper {
  id: string;
  full_name: string | null;
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
  size?: 'sm' | 'default';
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
  size = 'default',
}: MechanicMultiSelectProps) {
  const [leadOpen, setLeadOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isBusy = saving || busy;

  // Mechanics available for helper selection:
  // exclude the lead mechanic and existing helpers
  const helperIds = new Set(helpers.map((h) => h.id));
  const availableForHelper = mechanics.filter(
    (m) => m.id !== leadMechanicId && !helperIds.has(m.id),
  );

  // Mechanics available for lead selection:
  // exclude existing helpers (they'd need to be removed first)
  const helperIdSet = new Set(helpers.map((h) => h.id));
  const availableForLead = mechanics.filter((m) => !helperIdSet.has(m.id));

  async function addHelper(mechanicId: string) {
    if (!workOrderId || isBusy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/organizations/${orgId}/work-orders/${workOrderId}/helpers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mechanic_id: mechanicId }),
        },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? 'Failed to add helper');
      } else {
        toast.success('Helper added');
        onHelpersChange();
      }
    } catch {
      toast.error('Failed to add helper');
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
        { method: 'DELETE' },
      );
      const json = await res.json();
      if (json.error) {
        toast.error(json.error.message ?? 'Failed to remove helper');
      } else {
        toast.success('Helper removed');
        onHelpersChange();
      }
    } catch {
      toast.error('Failed to remove helper');
    } finally {
      setBusy(false);
      setRemoveTarget(null);
    }
  }

  function selectLead(mechanicId: string) {
    onLeadChange(mechanicId);
    setLeadOpen(false);
  }

  const leadColor = leadMechanicId
    ? getMechanicColor(leadMechanicId)
    : null;
  const leadInitials = leadMechanicName
    ? getMechanicInitials(leadMechanicName)
    : null;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {/* Lead mechanic section */}
      <div className="flex items-center gap-1.5 min-w-0">
        <Popover open={leadOpen} onOpenChange={setLeadOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className={cn(
                'h-auto min-h-7 gap-1.5 px-2 py-1 justify-start max-w-full',
                size === 'sm' && 'min-h-6 text-xs',
              )}
            >
              <Crown
                className={cn(
                  'shrink-0',
                  size === 'sm' ? 'size-3 text-amber-500' : 'size-3.5 text-amber-500',
                )}
              />
              {leadMechanicId && leadColor && leadInitials ? (
                <>
                  <Avatar className="shrink-0 after:hidden">
                    <AvatarFallback
                      className={cn(
                        'font-medium',
                        size === 'sm'
                          ? 'size-5 text-[8px]'
                          : 'size-6 text-[9px]',
                        leadColor.bg,
                        leadColor.text,
                      )}
                    >
                      {leadInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate font-semibold text-foreground">
                    {leadMechanicName}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground italic text-xs">
                  Assign lead mechanic
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-0"
            side="bottom"
            align="start"
          >
            <Command>
              <CommandInput placeholder="Search mechanics..." />
              <CommandList>
                <CommandEmpty>No mechanics found</CommandEmpty>
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
                        <Avatar className="size-5 shrink-0 after:hidden">
                          <AvatarFallback
                            className={cn(
                              'text-[8px] font-medium',
                              color.bg,
                              color.text,
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{m.full_name}</span>
                        {m.current_jobs !== undefined && m.current_jobs > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {m.current_jobs} job{m.current_jobs !== 1 ? 's' : ''}
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

      {/* Helper badges + Add button */}
      <div className="flex items-center gap-1.5 flex-wrap min-h-6">
        {helpers.map((helper) => {
          const color = getMechanicColor(helper.id);
          const initials = getMechanicInitials(helper.full_name);
          return (
            <Popover
              key={helper.id}
              open={removeTarget === helper.id}
              onOpenChange={(open) =>
                setRemoveTarget(open ? helper.id : null)
              }
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={isBusy}
                  className={cn(
                    'shrink-0 rounded-full ring-1 ring-border/60 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isBusy && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <Avatar className={cn(size === 'sm' ? 'size-5' : 'size-6')}>
                    <AvatarFallback
                      className={cn(
                        'font-medium',
                        size === 'sm' ? 'text-[8px]' : 'text-[9px]',
                        color.bg,
                        color.text,
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1.5" side="bottom" align="center">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 px-2 py-1">
                    <Avatar className="size-5 shrink-0 after:hidden">
                      <AvatarFallback
                        className={cn(
                          'text-[8px] font-medium',
                          color.bg,
                          color.text,
                        )}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate font-medium">
                      {helper.full_name ?? 'Unknown'}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full justify-start gap-1.5 h-7 text-xs"
                    disabled={isBusy}
                    onClick={() => removeHelper(helper.id)}
                  >
                    <UserMinus className="size-3.5" />
                    Remove helper
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}

        {/* Add helper button */}
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size={size === 'sm' ? 'icon-xs' : 'icon-sm'}
              disabled={isBusy || availableForHelper.length === 0}
              className="rounded-full border border-dashed border-border/60 text-muted-foreground hover:text-foreground"
              title="Add helper mechanic"
            >
              {isBusy ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" side="bottom" align="start">
            <Command>
              <CommandInput placeholder="Search mechanics..." />
              <CommandList>
                <CommandEmpty>No mechanics available</CommandEmpty>
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
                        <Avatar className="size-5 shrink-0 after:hidden">
                          <AvatarFallback
                            className={cn(
                              'text-[8px] font-medium',
                              color.bg,
                              color.text,
                            )}
                          >
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{m.full_name}</span>
                        {m.current_jobs !== undefined && m.current_jobs > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {m.current_jobs} job{m.current_jobs !== 1 ? 's' : ''}
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
    </div>
  );
}
