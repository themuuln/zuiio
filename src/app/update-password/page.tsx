"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeSlash, LockKey } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "./actions";
import { ErrorBanner } from "@/components/ui/error-banner";

const schema = z
  .object({
    password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна."),
    confirm_password: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Нууц үг таарахгүй байна.",
    path: ["confirm_password"],
  });

type Values = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCheckingSession(false);
      } else {
        // Check for hash-based recovery token — give it a moment to exchange
        const hash = window.location.hash;
        if (hash?.includes("type=recovery")) {
          // The Supabase client will exchange the hash tokens.
          // Wait a bit and retry.
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData.session) {
              setCheckingSession(false);
            } else {
              setSessionError(true);
              setCheckingSession(false);
            }
          }, 1500);
        } else {
          setSessionError(true);
          setCheckingSession(false);
        }
      }
    });
  }, []);

  const onSubmit = async (data: Values) => {
    setPending(true);
    setServerError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("password", data.password);

    const result = await updatePassword(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
      setPending(false);
    } else if (result?.success) {
      setSuccess(true);
      setPending(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Түр хүлээнэ үү...</CardTitle>
            <CardDescription>Холбоосыг шалгаж байна</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Хүчингүй холбоос</CardTitle>
            <CardDescription>
              Энэ холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Нууц үг
              сэргээх хүсэлтээ дахин илгээнэ үү.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/forgot-password">Нууц үг сэргээх</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Нууц үг солигдлоо</CardTitle>
            <CardDescription>
              Таны нууц үг амжилттай шинэчлэгдлээ. Шинэ нууц үгээр нэвтрэнэ үү.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/login">Нэвтрэх</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Шинэ нууц үг</CardTitle>
          <CardDescription>
            Шинэ нууц үгээ оруулаад баталгаажуулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">Шинэ нууц үг</FieldLabel>
                <div className="relative">
                  <LockKey className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Хамгийн багадаа 8 тэмдэгт"
                    autoComplete="new-password"
                    className="pl-9 pr-9"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Нууц үг нуух" : "Нууц үг харуулах"
                    }
                  >
                    {showPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Нууц үг баталгаажуулах
                </FieldLabel>
                <div className="relative">
                  <LockKey className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground z-10" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Нууц үгээ дахин оруулна уу"
                    autoComplete="new-password"
                    className="pl-9 pr-9"
                    {...register("confirm_password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={
                      showConfirmPassword ? "Нууц үг нуух" : "Нууц үг харуулах"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-xs text-destructive">
                    {errors.confirm_password.message}
                  </p>
                )}
              </Field>
            </FieldGroup>

            <ErrorBanner error={serverError} />

            <Button type="submit" disabled={pending}>
              {pending ? "Шинэчилж байна..." : "Нууц үг шинэчлэх"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
