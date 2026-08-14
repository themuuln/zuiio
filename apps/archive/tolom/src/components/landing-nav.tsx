"use client";

import {
  BookOpen,
  Building2,
  Cable,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Newspaper,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Typography } from "@/components/ui/typography";
import { usePathname } from "@/lib/i18n/navigation";
import { onLinkHover } from "@/lib/prefetch";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const t = useTranslations("home");
  const appT = useTranslations("app");
  const authT = useTranslations("auth");
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (href: string) => {
    // Normalize: "/#features" and "/" both map to the home route
    const route = href.split("#")[0] || "/";
    return pathname === route;
  };

  const mobileLinks = [
    { href: "/#features", label: t("navProduct") },
    { href: "/services", label: t("navServices") },
    { href: "/integrations", label: t("navIntegrations") },
    { href: "/faq", label: t("navFAQ") },
    { href: "/blog", label: t("navBlog") },
    { href: "/guide", label: t("navDocs") },
    { href: "/pricing", label: t("navPricing") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary shadow-xs">
            <Wrench className="size-4 text-primary-foreground" />
          </div>
          <span>{appT("name")}</span>
        </Link>

        <div className="hidden md:flex md:items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {t("navFeatures")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[500px] gap-2 p-2 md:grid-cols-2">
                    <li className="md:col-span-2">
                      <NavigationMenuLink
                        render={<Link href="/#features" />}
                        onMouseEnter={onLinkHover("/")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navProduct")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navProductDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/services" />}
                        onMouseEnter={onLinkHover("/services")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navServices")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navServicesDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/integrations" />}
                        onMouseEnter={onLinkHover("/integrations")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Cable className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navIntegrations")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navIntegrationsDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>
                  {t("navResources")}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-2 p-2">
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/faq" />}
                        onMouseEnter={onLinkHover("/faq")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navFAQ")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navFAQDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/blog" />}
                        onMouseEnter={onLinkHover("/blog")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navBlog")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navBlogDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/guide" />}
                        onMouseEnter={onLinkHover("/guide")}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Newspaper className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {t("navDocs")}
                          </div>
                          <Typography.Muted className="text-xs">
                            {t("navDocsDesc")}
                          </Typography.Muted>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/pricing" />}
                  active={isActive("/pricing")}
                  onMouseEnter={onLinkHover("/pricing")}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    isActive("/pricing") &&
                      "data-active:bg-muted/70 data-active:text-foreground",
                  )}
                >
                  {t("navPricing")}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Drawer open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <DrawerTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="min-h-11 min-w-11 md:hidden"
                />
              }
            >
              <Menu />
              <span className="sr-only">{t("navOpenMenu")}</span>
            </DrawerTrigger>
            <DrawerContent className="w-[88vw] max-w-sm gap-0 p-0">
              <DrawerHeader className="border-b">
                <DrawerTitle>{appT("name")}</DrawerTitle>
                <DrawerDescription>{appT("tagline")}</DrawerDescription>
              </DrawerHeader>
              <div className="flex flex-col gap-1 p-4">
                {mobileLinks.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "min-h-11 justify-start px-3 text-sm",
                      isActive(item.href) && "bg-muted",
                    )}
                    render={
                      <Link
                        href={item.href}
                        onMouseEnter={onLinkHover(
                          item.href.split("#")[0] || "/",
                        )}
                        onClick={() => setMobileNavOpen(false)}
                      />
                    }
                    nativeButton={false}
                  >
                    {item.label}
                  </Button>
                ))}
                <div className="mt-3 grid gap-2">
                  <Button
                    variant="outline"
                    render={
                      <Link
                        href="/auth/login"
                        onClick={() => setMobileNavOpen(false)}
                      />
                    }
                    nativeButton={false}
                  >
                    {authT("signIn")}
                  </Button>
                  <Button
                    render={
                      <Link
                        href="/auth/signup"
                        onClick={() => setMobileNavOpen(false)}
                      />
                    }
                    nativeButton={false}
                  >
                    {t("navGetStarted")}
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
          <Button
            variant="ghost"
            size="sm"
            render={
              <Link
                href="/auth/login"
                onMouseEnter={onLinkHover("/auth/login")}
              />
            }
            nativeButton={false}
            className="hidden min-h-10 md:inline-flex"
          >
            {authT("signIn")}
          </Button>
          <Button
            size="sm"
            render={
              <Link
                href="/auth/signup"
                onMouseEnter={onLinkHover("/auth/signup")}
              />
            }
            nativeButton={false}
            className="min-h-10"
          >
            {t("navGetStarted")}
          </Button>
        </div>
      </div>
    </header>
  );
}
