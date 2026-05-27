"use client";

import {
  Car,
  Command,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  SearchIcon,
  UserPlus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { NavUser } from "@/components/app-sidebar/_nav-user";
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
  CommandShortcut,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNavigation } from "@/hooks/use-navigation";
import { usePageHeader } from "@/hooks/use-page-header";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { Link, useRouter } from "@/lib/i18n/navigation";

export interface PageTab {
  value: string;
  label: string;
}

interface PageHeaderProps {
  tabs?: PageTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  actions?: React.ReactNode;
}

export function PageHeader({
  tabs,
  activeTab,
  onTabChange,
  actions,
}: PageHeaderProps) {
  const t = useTranslations();
  const { push } = useRouter();
  const { searchItems } = useNavigation();
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  const handleSelect = useCallback(
    (href: string) => {
      setSearchOpen(false);
      push(href);
    },
    [push],
  );

  const commandItems = useMemo(
    () =>
      searchItems.map((item, index) => ({
        ...item,
        shortcut: `G ${index + 1}`,
      })),
    [searchItems],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setSearchOpen((open) => !open);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex min-h-14 items-center gap-3 px-4">
          <div className="flex min-w-0 items-center gap-3 self-stretch">
            <SidebarTrigger className="-ml-1 rounded-xl" />
            <Separator
              orientation="vertical"
              className="hidden self-stretch sm:block"
            />
            <HeaderBreadcrumbs />
          </div>

          <div className="hidden min-w-0 flex-1 lg:flex">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-full max-w-xl justify-start gap-2 rounded-xl border-border/70 bg-muted/35 px-3 text-muted-foreground shadow-none"
              onClick={openSearch}
            >
              <SearchIcon className="size-4" />
              <span className="text-sm">{t("common.search")}</span>
              <kbd className="ml-auto inline-flex h-5 items-center gap-0.5 rounded-md border border-border/60 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70">
                <Command className="size-2.5" />K
              </kbd>
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-xl lg:hidden"
              onClick={openSearch}
              aria-label={t("common.search")}
            >
              <SearchIcon className="size-4" />
            </Button>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
            <QuickCreateActions />
            <NavUser />
            <RightSidebarToggle />
          </div>
        </div>

        {tabs && tabs.length > 0 && (
          <div className="border-t border-border/60 px-4 pt-1.5">
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
            {commandItems.map((item) => {
              const Icon = item.icon;

              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                >
                  <Icon className="size-4" />
                  <span>{t(item.labelKey)}</span>
                  <CommandShortcut>{item.shortcut}</CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function HeaderBreadcrumbs() {
  const t = useTranslations();
  const { breadcrumbs } = useNavigation();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <Fragment key={`${crumb.labelKey}-${index}`}>
              <BreadcrumbItem className={index === 0 ? "" : "hidden sm:block"}>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{t(crumb.labelKey)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {t(crumb.labelKey)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator className="hidden sm:block" />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function QuickCreateActions() {
  const t = useTranslations();
  const { push } = useRouter();
  const { setNewCustomerDialogOpen, setNewVehicleDialogOpen } =
    usePageHeader();

  const items = [
    {
      href: "/dashboard/work-orders/new",
      label: t("dashboard.newWorkOrder"),
      icon: Plus,
    },
    {
      label: t("dashboard.newCustomer"),
      icon: UserPlus,
      onClick: () => setNewCustomerDialogOpen(true),
    },
    {
      label: t("dashboard.newVehicle"),
      icon: Car,
      onClick: () => setNewVehicleDialogOpen(true),
    },
  ];

  return (
    <div className="hidden items-center gap-2 xl:flex">
      {items.map((item, index) => {
        const Icon = item.icon;
        const key =
          "href" in item && item.href ? item.href : `action-${index}`;
        return (
          <Tooltip key={key}>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant={index === 0 ? "default" : "outline"}
                  className="size-9 rounded-xl p-0"
                  onClick={() => {
                    if ("onClick" in item && item.onClick) {
                      item.onClick();
                    } else if ("href" in item && item.href) {
                      push(item.href);
                    }
                  }}
                  aria-label={item.label}
                >
                  <Icon className="size-4" />
                </Button>
              }
            />
            <TooltipContent>{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function RightSidebarToggle() {
  const { state, toggle } = useRightSidebar();

  if (state.tabs.length === 0) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={state.isOpen ? "Collapse sidebar" : "Expand sidebar"}
      className="size-9 rounded-xl text-muted-foreground/70 hover:text-foreground"
    >
      {state.isOpen ? (
        <PanelRightClose className="size-4" />
      ) : (
        <PanelRightOpen className="size-4" />
      )}
    </Button>
  );
}
