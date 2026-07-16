import { cn } from "@/lib/utils/cn";

const badgeVariants = {
  primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light",
  success: "bg-success/10 text-success dark:bg-success/20",
  warning: "bg-warning/10 text-warning dark:bg-warning/20",
  error: "bg-error/10 text-error dark:bg-error/20",
  info: "bg-info/10 text-info dark:bg-info/20",
} as const;

type BadgeProps = {
  variant?: keyof typeof badgeVariants;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = "primary", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-0.5 text-xs font-medium rounded-full",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
