"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  EnvelopeSimple,
  Eye,
  EyeSlash,
  LockKey,
  User,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
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
import { register as registerAction } from "./actions";

const registerSchema = z
  .object({
    full_name: z.string().min(1, "Нэр шаардлагатай."),
    email: z.string().email("Зөв и-мэйл хаяг оруулна уу"),
    password: z.string().min(8, "Нууц үг хамгийн багадаа 8 тэмдэгттэй байна."),
    confirm_password: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Нууц үг таарахгүй байна.",
    path: ["confirm_password"],
  });

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterValues) => {
    setPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("full_name", data.full_name);
    formData.append("email", data.email);
    formData.append("password", data.password);

    const result = await registerAction(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Бүртгүүлэх</CardTitle>
          <CardDescription>
            Шинэ хэрэглэгч бүртгүүлэх мэдээллээ оруулна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="full_name">Нэр</FieldLabel>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Таны нэр"
                    autoComplete="name"
                    className="pl-9"
                    {...register("full_name")}
                  />
                </div>
                {errors.full_name && (
                  <p className="text-xs text-destructive">
                    {errors.full_name.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="email">И-мэйл</FieldLabel>
                <div className="relative">
                  <EnvelopeSimple className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Нууц үг</FieldLabel>
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

            {serverError && (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "Бүртгүүлж байна..." : "Бүртгүүлэх"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Бүртгэлтэй юу?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Нэвтрэх
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
