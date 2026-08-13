"use client";

import {
  Envelope,
  MapPin,
  Phone,
  Receipt,
  SignOut,
  User,
} from "@phosphor-icons/react";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { requireEmail, requirePassword } from "@/lib/validation";
import { PointsBalanceCard } from "./points-balance-card";
import { useStoreSession } from "./use-store-session";

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 12;
}

export function AccountClient({ slug }: { slug: string }) {
  const { t } = useI18n();
  const { state, reload } = useStoreSession();

  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginPending, setLoginPending] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerPending, setRegisterPending] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoginError(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!requireEmail(email)) {
      setLoginError(t("storeAccount.error.email"));
      return;
    }
    if (!requirePassword(password)) {
      setLoginError(t("storeAccount.error.password"));
      return;
    }

    setLoginPending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoginError(t("storeAccount.error.invalidCredentials"));
        return;
      }
      await reload();
    } catch (err) {
      capture(err, { context: "store account: login" });
      setLoginError(t("storeAccount.error.generic"));
    } finally {
      setLoginPending(false);
    }
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const displayName = String(formData.get("display_name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();

    if (displayName.length < 2) {
      setRegisterError(t("storeAccount.error.name"));
      return;
    }
    if (!requireEmail(email)) {
      setRegisterError(t("storeAccount.error.email"));
      return;
    }
    if (phone && !isValidPhone(phone)) {
      setRegisterError(t("storeAccount.error.phone"));
      return;
    }
    if (!requirePassword(password)) {
      setRegisterError(t("storeAccount.error.password"));
      return;
    }

    setRegisterPending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { store_account: true, display_name: displayName, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/${slug}/account`,
        },
      });
      if (error) {
        setRegisterError(error.message);
        return;
      }
      if (data.session) {
        // Email confirmation disabled — session is live, account page loads.
        setRegisterSuccess(t("storeAccount.success.registeredShort"));
        toast.success(t("storeAccount.success.registeredShort"));
        setActiveTab("login");
        await reload();
      } else {
        setRegisterSuccess(t("storeAccount.success.registered"));
      }
    } catch (err) {
      capture(err, { context: "store account: register" });
      setRegisterError(t("storeAccount.error.generic"));
    } finally {
      setRegisterPending(false);
    }
  };

  const handleLogout = async () => {
    try {
      await createClient().auth.signOut();
    } catch (err) {
      capture(err, { context: "store account: logout" });
    }
    await reload();
  };

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (state.status === "account") {
    const { account } = state;
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("storeAccount.welcome", {
              name: account.display_name || account.email.split("@")[0] || "…",
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("storeAccount.login.description")}
          </p>
        </div>

        <Card className="divide-y divide-border">
          <div className="flex items-center gap-3 p-4">
            <Envelope className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {t("storeAccount.emailLabel")}
              </p>
              <p className="truncate text-sm font-medium">{account.email}</p>
            </div>
          </div>
          {account.phone && (
            <div className="flex items-center gap-3 p-4">
              <Phone className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("storeAccount.phoneLabel")}
                </p>
                <p className="truncate text-sm font-medium">{account.phone}</p>
              </div>
            </div>
          )}
        </Card>

        <PointsBalanceCard slug={slug} />

        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <Link href={`/${slug}/account/orders`}>
              <Receipt className="size-4" />
              {t("storeAccount.ordersLink")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/${slug}/account/addresses`}>
              <MapPin className="size-4" />
              Хаягийн дэвтэр
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleLogout}
          >
            <SignOut className="size-4" />
            {t("storeAccount.logout")}
          </Button>
        </div>
      </div>
    );
  }

  // signedOut (staff redirects happen inside useStoreSession)
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <User className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {t("storeAccount.account")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("storeAccount.login.description")}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            {t("storeAccount.login.title")}
          </TabsTrigger>
          <TabsTrigger value="register" className="flex-1">
            {t("storeAccount.register.title")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <Card className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {t("storeAccount.login.description")}
            </p>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="login-email">{t("auth.email")}</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password">{t("auth.password")}</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && (
                <p
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {loginError}
                </p>
              )}
              <Button type="submit" size="lg" disabled={loginPending}>
                {loginPending ? <Spinner /> : null}
                {t("storeAccount.login.submit")}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="register">
          <Card className="p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              {t("storeAccount.register.description")}
            </p>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="space-y-1">
                <Label htmlFor="register-name">
                  {t("storeAccount.displayName")}
                </Label>
                <Input
                  id="register-name"
                  name="display_name"
                  autoComplete="name"
                  placeholder={t("storeAccount.displayName")}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="register-email">{t("auth.email")}</Label>
                <Input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="register-phone">
                  {t("storeAccount.phone")}
                </Label>
                <Input
                  id="register-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="99112233"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="register-password">{t("auth.password")}</Label>
                <Input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </div>
              {registerError && (
                <p
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {registerError}
                </p>
              )}
              {registerSuccess && (
                <p
                  className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  role="status"
                >
                  {registerSuccess}
                </p>
              )}
              <Button type="submit" size="lg" disabled={registerPending}>
                {registerPending ? <Spinner /> : null}
                {t("storeAccount.register.submit")}
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      <Link
        href={`/${slug}`}
        className="text-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        {t("storeAccount.backToStore")}
      </Link>
    </div>
  );
}
