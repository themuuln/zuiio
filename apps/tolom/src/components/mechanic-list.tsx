"use client";

import { Plus, UserPlus, Users, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { NewMechanicSheet } from "@/components/new-mechanic-drawer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface MechanicListItem {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
  current_jobs?: number;
  /** Optional email shown as subtitle */
  email?: string | null;
}

export interface MechanicListProps {
  /** List of mechanics to display */
  mechanics: MechanicListItem[];
  /** Whether data is still loading */
  loading?: boolean;
  /** Error message if fetch failed */
  error?: string | null;
  /** Title shown in the card header */
  title?: string;
  /** Description shown in the card header */
  description?: string;
  /** Whether to show the "Add Mechanic" button */
  showAddButton?: boolean;
  /** Custom label for the add button */
  addButtonLabel?: string;
  /** Whether to show search filtering */
  showSearch?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Callback when a mechanic row is clicked */
  onMechanicClick?: (mechanic: MechanicListItem) => void;
  /** Optional action buttons rendered per row (e.g. edit, remove) */
  renderActions?: (mechanic: MechanicListItem) => React.ReactNode;
  /** Additional class on the card */
  className?: string;
  /** Empty state configuration */
  emptyState?: {
    title?: string;
    description?: string;
    icon?: React.ReactNode;
  };
  /** Callback invoked after a new mechanic is successfully added */
  onMechanicAdded?: () => void;
  /** Visual variant of the list */
  variant?: "card" | "compact";
}

// ─── Skeleton ──────────────────────────────────────────────────

function MechanicListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={`skeleton-${i}`}
          className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
        >
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1 h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────

export function MechanicList({
  mechanics,
  loading = false,
  error = null,
  title = "Mechanics",
  description = "Manage your mechanics and their assignments",
  showAddButton = true,
  addButtonLabel = "Add Mechanic",
  showSearch = true,
  searchPlaceholder = "Search mechanics...",
  onMechanicClick,
  renderActions,
  className,
  emptyState,
  onMechanicAdded,
  variant = "card",
}: MechanicListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");

  const q = search.toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!q) return mechanics;
    return mechanics.filter(
      (m) =>
        (m.full_name?.toLowerCase().includes(q) ?? false) ||
        (m.email?.toLowerCase().includes(q) ?? false),
    );
  }, [mechanics, q]);

  const showHeader = title || showAddButton;

  return (
    <>
      <Card className={cn("border-border/60 shadow-sm", className)}>
        {showHeader && (
          <CardHeader className="gap-3 pb-4">
            <div className="flex items-center justify-between gap-3">
              {title && (
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="size-4 text-muted-foreground" />
                    {title}
                    {!loading && (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({mechanics.length})
                      </span>
                    )}
                  </CardTitle>
                  {description && (
                    <CardDescription className="text-sm">
                      {description}
                    </CardDescription>
                  )}
                </div>
              )}
              {showAddButton && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAddOpen(true)}
                  className="shrink-0 gap-1.5"
                >
                  <Plus className="size-3.5" />
                  <span className="hidden sm:inline">{addButtonLabel}</span>
                </Button>
              )}
            </div>
          </CardHeader>
        )}

        <CardContent>
          {showSearch && mechanics.length > 0 && (
            <div className="relative mb-3">
              <Users className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 pl-8 pr-3 text-sm"
              />
            </div>
          )}

          {loading ? (
            <MechanicListSkeleton count={3} />
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-6 text-center">
              <Typography.Text className="text-sm text-destructive">
                {error}
              </Typography.Text>
            </div>
          ) : filtered.length === 0 ? (
            <Empty>
              <EmptyMedia>
                <div className="flex size-12 items-center justify-center rounded-full bg-muted/50">
                  <Wrench className="size-6 text-muted-foreground/40" />
                </div>
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle className="text-sm">
                  {q
                    ? "No mechanics match your search"
                    : (emptyState?.title ?? "No mechanics yet")}
                </EmptyTitle>
                <EmptyDescription className="text-xs">
                  {q
                    ? "Try a different name or email"
                    : (emptyState?.description ??
                      "Add your first mechanic to get started with work order assignments.")}
                </EmptyDescription>
              </EmptyHeader>
              {showAddButton && !q && (
                <EmptyContent>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setAddOpen(true)}
                    className="gap-1.5"
                  >
                    <UserPlus className="size-3.5" />
                    {addButtonLabel}
                  </Button>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <div
              className={cn(
                variant === "compact"
                  ? "flex flex-col gap-1"
                  : "flex flex-col gap-2",
              )}
            >
              {filtered.map((mechanic) => (
                <MechanicListItemRow
                  key={mechanic.id}
                  mechanic={mechanic}
                  variant={variant}
                  onClick={
                    onMechanicClick
                      ? () => onMechanicClick(mechanic)
                      : undefined
                  }
                  actions={renderActions?.(mechanic)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add mechanic sheet */}
      {showAddButton && (
        <NewMechanicSheet
          open={addOpen}
          onOpenChange={(open) => {
            setAddOpen(open);
            if (!open && onMechanicAdded) {
              onMechanicAdded();
            }
          }}
        />
      )}
    </>
  );
}

// ─── Row ───────────────────────────────────────────────────────

interface MechanicListItemRowProps {
  mechanic: MechanicListItem;
  variant?: "card" | "compact";
  onClick?: () => void;
  actions?: React.ReactNode;
}

function MechanicListItemRow({
  mechanic,
  variant = "card",
  onClick,
  actions,
}: MechanicListItemRowProps) {
  if (variant === "compact") {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: interactive list item with role="button"
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg px-2.5 py-2",
          onClick && "cursor-pointer hover:bg-accent/50 transition-colors",
        )}
        onClick={onClick}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <MechanicAvatar mechanic={mechanic} className="size-7 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium">
            {mechanic.full_name ?? "Unknown"}
          </div>
          {mechanic.email && (
            <div className="truncate text-[10px] text-muted-foreground">
              {mechanic.email}
            </div>
          )}
        </div>
        {mechanic.current_jobs !== undefined && mechanic.current_jobs > 0 && (
          <span className="inline-flex shrink-0 items-center rounded-md bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
            {mechanic.current_jobs} job{mechanic.current_jobs !== 1 ? "s" : ""}
          </span>
        )}
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: interactive list item with role="button"
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/50 p-3 transition-colors",
        onClick && "cursor-pointer hover:bg-accent/30",
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <MechanicAvatar mechanic={mechanic} className="size-9 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {mechanic.full_name ?? "Unknown"}
        </div>
        {mechanic.current_jobs !== undefined && (
          <div className="text-xs text-muted-foreground">
            {mechanic.current_jobs > 0
              ? `${mechanic.current_jobs} active job${mechanic.current_jobs !== 1 ? "s" : ""}`
              : "Available"}
          </div>
        )}
        {mechanic.email && !mechanic.current_jobs && (
          <div className="truncate text-xs text-muted-foreground">
            {mechanic.email}
          </div>
        )}
      </div>
      {mechanic.current_jobs !== undefined && mechanic.current_jobs > 0 && (
        <span className="inline-flex shrink-0 items-center rounded-md bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
          {mechanic.current_jobs}
        </span>
      )}
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
