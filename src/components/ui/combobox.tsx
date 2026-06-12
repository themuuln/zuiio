"use client";

import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { Check, ChevronDownIcon, Loader2, Plus, XIcon } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

function ComboboxValue({ ...props }: ComboboxPrimitive.Value.Props) {
  return <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />;
}

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn("[&_svg:not([class*='size-'])]:size-4", className)}
      {...props}
    >
      {children}
      <ChevronDownIcon className="pointer-events-none size-4 text-muted-foreground" />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({ className, ...props }: ComboboxPrimitive.Clear.Props) {
  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={<InputGroupButton variant="ghost" size="icon-xs" />}
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  showTrigger = true,
  showClear = false,
  ...props
}: ComboboxPrimitive.Input.Props & {
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  // Stop pointerdown in the native capture phase — BEFORE Base UI's
  // document-level capture handler runs. This prevents useDismiss from
  // closing the parent Dialog/Drawer when clicking the combobox input.
  const ref = React.useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    const handler = (e: PointerEvent) => e.stopPropagation();
    node.addEventListener("pointerdown", handler, { capture: true });
    return () =>
      node.removeEventListener("pointerdown", handler, { capture: true });
  }, []);

  return (
    <InputGroup className={cn("w-auto", className)}>
      <ComboboxPrimitive.Input
        ref={ref}
        render={<InputGroupInput disabled={disabled} />}
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {showTrigger && (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            render={<ComboboxTrigger />}
            nativeButton
            data-slot="input-group-button"
            className="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  onPointerDown,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  // Stop pointerdown in the native capture phase — BEFORE Base UI's
  // document-level capture handler runs. This prevents useDismiss from
  // registering its bubble-phase handler on this element, which would
  // call closeOnPressOutside and close the parent Dialog/Drawer.
  //
  // We must use a native listener because React synthetic handlers fire
  // AFTER all native capture handlers have already executed.
  const ref = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const handler = (e: PointerEvent) => e.stopPropagation();
    node.addEventListener("pointerdown", handler, { capture: true });
    return () =>
      node.removeEventListener("pointerdown", handler, { capture: true });
  }, []);

  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          ref={ref}
          data-slot="combobox-content"
          data-chips={!!anchor}
          onPointerDown={(e) => {
            // Bubble-phase safety net (native capture above handles the real fix)
            e.stopPropagation();
            onPointerDown?.(e);
          }}
          className={cn(
            "group/combobox-content max-h-(--available-height) w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+--spacing(7))] origin-(--transform-origin) overflow-hidden rounded-lg text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 animate-none! relative bg-popover/70 before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-[inherit] before:backdrop-blur-2xl before:backdrop-saturate-150 **:data-[slot$=-item]:focus:bg-foreground/10 **:data-[slot$=-item]:data-highlighted:bg-foreground/10 **:data-[slot$=-separator]:bg-foreground/5 **:data-[slot$=-trigger]:focus:bg-foreground/10 **:data-[slot$=-trigger]:aria-expanded:bg-foreground/10! **:data-[variant=destructive]:focus:bg-foreground/10! **:data-[variant=destructive]:text-accent-foreground! **:data-[variant=destructive]:**:text-accent-foreground!",
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground not-data-[variant=destructive]:data-highlighted:**:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
        }
      >
        <Check className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

function ComboboxGroup({ className, ...props }: ComboboxPrimitive.Group.Props) {
  return (
    <ComboboxPrimitive.Group
      data-slot="combobox-group"
      className={cn(className)}
      {...props}
    />
  );
}

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function ComboboxCollection({ ...props }: ComboboxPrimitive.Collection.Props) {
  return (
    <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
  );
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center text-sm text-muted-foreground group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips> &
  ComboboxPrimitive.Chips.Props) {
  return (
    <ComboboxPrimitive.Chips
      data-slot="combobox-chips"
      className={cn(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        className,
      )}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={<Button variant="ghost" size="icon-xs" />}
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

function ComboboxChipsInput({
  className,
  onPointerDown,
  ...props
}: ComboboxPrimitive.Input.Props) {
  const ref = React.useCallback((node: HTMLInputElement | null) => {
    if (!node) return;
    // Stop pointerdown in the native capture phase — BEFORE Base UI's
    // document-level capture handler runs. This prevents useDismiss from
    // registering its bubble-phase handler on this element, which would
    // call closeOnPressOutside and close the parent Dialog/Drawer.
    //
    // We must use a native listener because React synthetic handlers fire
    // AFTER all native capture handlers have already executed.
    const handler = (e: PointerEvent) => e.stopPropagation();
    node.addEventListener("pointerdown", handler, { capture: true });
    return () =>
      node.removeEventListener("pointerdown", handler, { capture: true });
  }, []);

  return (
    <ComboboxPrimitive.Input
      ref={ref}
      data-slot="combobox-chip-input"
      className={cn("min-w-16 flex-1 outline-none", className)}
      onPointerDown={(e) => {
        // Bubble-phase safety net (native capture above handles the real fix)
        e.stopPropagation();
        onPointerDown?.(e);
      }}
      {...props}
    />
  );
}

function useComboboxAnchor() {
  return React.useRef<HTMLDivElement | null>(null);
}

// ── Creatable Combobox ─────────────────────────────────────────
// Adds a "Create \"...\"" item to the list when the input doesn't
// match any existing item. Follows the Base UI official creatable pattern.

function CreatableCombobox<T extends { id: string; name: string }>({
  items,
  value,
  onValueChange,
  onCreateItem,
  isCreating = false,
  createLabel = (name: string) => `Create "${name}"`,
  className,
  placeholder,
  disabled,
  showTrigger = true,
  showClear,
  itemToStringLabel,
  isItemEqualToValue,
  ...rootProps
}: {
  items: T[];
  value: T | null;
  onValueChange: (item: T | null) => void;
  onCreateItem: (name: string) => void | Promise<void>;
  isCreating?: boolean;
  createLabel?: (name: string) => string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  showTrigger?: boolean;
  showClear?: boolean;
  itemToStringLabel?: (item: T) => string;
  isItemEqualToValue?: (a: T, b: T) => boolean;
} & Omit<
  React.ComponentProps<typeof Combobox>,
  "items" | "value" | "onValueChange" | "children"
>) {
  const inputValueRef = React.useRef("");
  const trimmed = inputValueRef.current.trim();
  const lowered = trimmed.toLocaleLowerCase();
  const exactExists = items.some(
    (item) => item.name.trim().toLocaleLowerCase() === lowered,
  );

  // Append a creatable item when input doesn't match any existing item
  type CreateItem = { id: string; name: string; __create: true };
  const createItem: CreateItem | null =
    trimmed !== "" && !exactExists
      ? { id: `create:${lowered}`, name: trimmed, __create: true }
      : null;
  const itemsWithCreate = createItem ? [...items, createItem] : items;

  return (
    <Combobox
      items={itemsWithCreate}
      value={value}
      onValueChange={(item) => {
        if (item && "__create" in (item as object)) {
          onCreateItem(inputValueRef.current.trim());
          return;
        }
        onValueChange(item as T | null);
      }}
      onInputValueChange={(val) => {
        inputValueRef.current = val;
      }}
      itemToStringLabel={
        (itemToStringLabel ?? ((item: T) => item?.name ?? "")) as (
          item: unknown,
        ) => string
      }
      isItemEqualToValue={isItemEqualToValue}
      {...rootProps}
    >
      <ComboboxInput
        placeholder={placeholder}
        showTrigger={showTrigger}
        showClear={showClear ?? !!value}
        disabled={disabled || isCreating}
        className={className}
      />
      <ComboboxContent>
        <ComboboxList>
          {(item: T | CreateItem) => {
            if ("__create" in (item as object)) {
              return (
                <ComboboxItem key={item.id} value={item}>
                  {isCreating ? (
                    <Loader2 className="size-4 shrink-0 animate-spin" />
                  ) : (
                    <Plus className="size-4 shrink-0" />
                  )}
                  {createLabel(item.name)}
                </ComboboxItem>
              );
            }
            return (
              <ComboboxItem key={item.id} value={item as T}>
                <Check className="size-4 shrink-0" />
                {item.name}
              </ComboboxItem>
            );
          }}
        </ComboboxList>
        <ComboboxEmpty />
      </ComboboxContent>
    </Combobox>
  );
}

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  CreatableCombobox,
  useComboboxAnchor,
};
