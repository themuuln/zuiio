import { ChevronRight } from "lucide-react";
import { Link } from "@/lib/i18n/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({
  items,
  ariaLabel = "Breadcrumb",
}: {
  items: BreadcrumbItem[];
  ariaLabel?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel} className="mb-1">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="size-3 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className={isLast ? "font-medium text-foreground" : ""}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Breadcrumb as Breadcrumbs, type BreadcrumbItem as BreadcrumbsItem };
