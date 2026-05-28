import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";

function H1({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-3xl font-semibold tracking-tight lg:text-4xl",
        className,
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

function H2({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "scroll-m-18 text-2xl font-semibold tracking-tight first:mt-0",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

function H3({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "scroll-m-16 text-xl font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

function H4({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn(
        "scroll-m-12 text-lg font-semibold tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

function P({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"p">) {
  return (
    <p
      className={cn("leading-7 [&:not(:first-child)]:mt-4", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function Lead({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"p">) {
  return (
    <p className={cn("text-xl text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

function Large({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"div">) {
  return (
    <div className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </div>
  );
}

function Small({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"small">) {
  return (
    <small
      className={cn("text-sm font-medium leading-none", className)}
      {...props}
    >
      {children}
    </small>
  );
}

function Muted({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

function InlineCode({
  children,
  className,
  ...props
}: { children: ReactNode; className?: string } & React.ComponentProps<"code">) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
        className,
      )}
      {...props}
    >
      {children}
    </code>
  );
}

function List({
  children,
  className,
  variant = "ul",
}: {
  children: ReactNode;
  className?: string;
  variant?: "ul" | "ol";
}) {
  const Comp = variant;
  return (
    <Comp
      className={cn(
        "my-4 ml-6 [&>li]:mt-1.5",
        variant === "ul" ? "list-disc" : "list-decimal",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

function Text({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"p">) {
  return (
    <p className={cn(className)} {...props}>
      {children}
    </p>
  );
}

function Blockquote({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<"blockquote">) {
  return (
    <blockquote
      className={cn(
        "mt-4 border-l-2 border-primary pl-6 italic text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </blockquote>
  );
}

export const Typography = {
  H1,
  H2,
  H3,
  H4,
  P,
  Lead,
  Large,
  Small,
  Muted,
  InlineCode,
  List,
  Text,
  Blockquote,
};

export type { HeadingLevel };
