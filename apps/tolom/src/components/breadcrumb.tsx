import { ChevronDown, ChevronRight } from "lucide-react";
import type { MouseEventHandler } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "@/lib/i18n/navigation";

export interface BreadcrumbDropdownItem {
  label: string;
  onClick: () => void;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  dropdownItems?: BreadcrumbDropdownItem[];
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
          const hasDropdown =
            !isLast && item.dropdownItems && item.dropdownItems.length > 0;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="size-3 shrink-0 text-muted-foreground/50"
                  aria-hidden="true"
                />
              )}
              {hasDropdown ? (
                <Popover>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        className="cursor-pointer hover:text-foreground transition-colors"
                      />
                    }
                  >
                    {item.label}
                    <ChevronDown className="ml-0.5 size-3 inline" />
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="w-48 p-1"
                  >
                    {item.dropdownItems?.map((di) => (
                      <button
                        key={di.label}
                        type="button"
                        onClick={di.onClick}
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                      >
                        {di.label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              ) : isLast || (!item.href && !item.onClick) ? (
                <span
                  className={isLast ? "font-medium text-foreground" : ""}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="cursor-pointer hover:text-foreground transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  href={item.href ?? "#"}
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
