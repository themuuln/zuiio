"use client";

import { Command, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useCallback, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import type { BreadcrumbItem as BreadcrumbItemType } from "@/hooks/use-breadcrumbs";

export interface PageTab {
  value: string;
  label: string;
}

interface PageHeaderProps {
  breadcrumbs?: BreadcrumbItemType[];
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  breadcrumbs: explicitBreadcrumbs,
  tabs,
  activeTab,
  onTabChange,
  actions,
}: PageHeaderProps) {
  const t = useTranslations();
  const autoBreadcrumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);

  const breadcrumbs = explicitBreadcrumbs ?? autoBreadcrumbs;

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  return (
    <>
      <header className="flex shrink-0 flex-col border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex h-14 items-center gap-2 px-4 lg:h-16">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <Fragment key={item.label + index}>
                    <BreadcrumbItem>
                      {!isLast ? (
                        <BreadcrumbLink href={item.href ?? "#"}>
                          {t(item.label)}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{t(item.label)}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground max-md:hidden"
              onClick={openSearch}
            >
              <SearchIcon className="size-3.5" />
              <span className="text-xs">{t("common.search")}</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground/60">
                <Command className="size-2.5" />
                K
              </kbd>
            </Button>
            {actions}
          </div>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="px-4 pb-0">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList variant="line">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </header>

      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title={t("common.search")}
      >
        <CommandInput placeholder={t("common.search")} />
        <CommandList>
          <CommandEmpty>{t("common.noResults")}</CommandEmpty>
          <CommandGroup heading={t("nav.dashboard")}>
            <CommandItem onSelect={closeSearch}>Work Orders</CommandItem>
            <CommandItem onSelect={closeSearch}>Customers</CommandItem>
            <CommandItem onSelect={closeSearch}>Inventory</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
