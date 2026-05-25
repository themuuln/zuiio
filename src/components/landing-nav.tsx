"use client";

import { useTranslations } from "next-intl";
import { Wrench, BookOpen, Building2, Cable, HelpCircle, Newspaper, LayoutDashboard } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function LandingNav() {
  const t = useTranslations("home");
  const appT = useTranslations("app");
  const authT = useTranslations("auth");

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
                <NavigationMenuTrigger>{t("navFeatures")}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[500px] gap-2 p-2 md:grid-cols-2">
                    <li className="md:col-span-2">
                      <NavigationMenuLink
                        render={<Link href="#features" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <LayoutDashboard className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navProduct")}</div>
                          <p className="text-xs text-muted-foreground">
                            {t("navProductDesc")}
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="#features" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navServices")}</div>
                          <p className="text-xs text-muted-foreground">
                            {t("navServicesDesc")}
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="#features" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Cable className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navIntegrations")}</div>
                          <p className="text-xs text-muted-foreground">
                            {t("navIntegrationsDesc")}
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>{t("navResources")}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-2 p-2">
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/auth/login" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <HelpCircle className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navFAQ")}</div>
                          <p className="text-xs text-muted-foreground">
                            {t("navFAQDesc")}
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/auth/login" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <BookOpen className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navBlog")}</div>
                          <p className="text-xs text-muted-foreground">
                            {t("navBlogDesc")}
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        render={<Link href="/auth/login" />}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted"
                      >
                        <Newspaper className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                          <div className="text-sm font-medium">{t("navDocs")}</div>
                          <p className="text-xs text-muted-foreground">
                            Documentation and guides
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link href="/pricing" />}
                  className={navigationMenuTriggerStyle()}
                >
                  {t("navPricing")}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" render={<Link href="/auth/login" />} className="hidden md:inline-flex">
            {authT("signIn")}
          </Button>
          <Button size="sm" render={<Link href="/auth/signup" />}>
            {t("navGetStarted")}
          </Button>
        </div>
      </div>
    </header>
  );
}
