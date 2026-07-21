import { cn } from "@/lib/utils/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface dark:bg-dark-surface rounded-[16px] p-5",
        "shadow-[0_4px_24px_rgba(212,163,115,0.15)] dark:shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: CardProps) {
  return <div className={cn("mb-3", className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: CardProps) {
  return <h3 className={cn("text-lg font-semibold text-text dark:text-dark-text", className)} {...props}>{children}</h3>;
}

export function CardDescription({ className, children, ...props }: CardProps) {
  return <p className={cn("text-sm text-text-secondary", className)} {...props}>{children}</p>;
}

export function CardContent({ className, children, ...props }: CardProps) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

export function CardFooter({ className, children, ...props }: CardProps) {
  return <div className={cn("mt-4 flex items-center gap-2", className)} {...props}>{children}</div>;
}
