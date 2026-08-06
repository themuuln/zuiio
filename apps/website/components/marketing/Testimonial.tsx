import { cn } from "@/lib/utils";

function QuoteMarks({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 32"
      fill="currentColor"
      className={cn("text-accent/20", className)}
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12v8c0 6.6 5.4 12 12 12h2c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-2c-3.3 0-6-2.7-6-6v-2c0-2.2 1.8-4 4-4h2c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2h-2zm24 0c-6.6 0-12 5.4-12 12v8c0 6.6 5.4 12 12 12h2c1.1 0 2-.9 2-2v-6c0-1.1-.9-2-2-2h-2c-3.3 0-6-2.7-6-6v-2c0-2.2 1.8-4 4-4h2c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2h-2z" />
    </svg>
  );
}

function AvatarPlaceholder({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold",
        className,
      )}
      style={{
        backgroundColor: "var(--brand-violet-glow)",
        color: "var(--color-primary)",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  className?: string;
}

export function Testimonial({
  quote,
  author,
  role,
  className,
}: TestimonialProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl bg-card p-8 shadow-card-hover transition-shadow duration-250 ease-out",
        className,
      )}
    >
      <QuoteMarks className="absolute right-6 top-6 h-10 w-12" />
      <blockquote className="relative flex-1 text-base leading-relaxed text-foreground">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
        <AvatarPlaceholder name={author} />
        <div className="flex-1">
          <div className="text-sm font-semibold">{author}</div>
          <div className="text-xs text-muted-foreground">{role}</div>
        </div>
      </div>
    </div>
  );
}
