import type { ReactNode } from "react";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

export function SettingsBlock({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <div className={cn("flex flex-col gap-3", className)}>{children}</div>;
}

export function SettingsGroup({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col divide-y divide-border rounded-lg border border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: string;
  readonly label: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <Typography.Text className="text-sm font-medium">
          {label}
        </Typography.Text>
        {description ? (
          <Typography.Muted className="text-xs text-muted-foreground">
            {description}
          </Typography.Muted>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsFieldset({
  title,
  description,
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly description?: string;
  readonly title?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-3", className)}>
      {title || description ? (
        <div className="flex flex-col gap-0.5">
          {title ? (
            <legend className="text-sm font-semibold">{title}</legend>
          ) : null}
          {description ? (
            <Typography.Muted className="text-xs text-muted-foreground">
              {description}
            </Typography.Muted>
          ) : null}
        </div>
      ) : null}
      {children}
    </fieldset>
  );
}

export function SettingsTableFrame({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsListItem({
  children,
  className,
  inactive,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly inactive?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border px-3 py-2.5",
        inactive && "opacity-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsSectionDivider({
  className,
}: {
  readonly className?: string;
}) {
  return <Separator className={cn("my-1", className)} />;
}

export function SettingsError({ message }: { readonly message: string }) {
  return (
    <Typography.Text className="py-2 text-sm text-destructive">
      {message}
    </Typography.Text>
  );
}
