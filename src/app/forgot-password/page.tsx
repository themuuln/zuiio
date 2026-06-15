"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, EnvelopeSimple } from "@phosphor-icons/react";
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
import { forgotPassword } from "./actions";

const schema = z.object({
  email: z.string().email("Зөв и-мэйл хаяг оруулна уу"),
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Values) => {
    setPending(true);
    setServerError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("email", data.email);

    const result = await forgotPassword(undefined, formData);
    if (result?.error) {
      setServerError(result.error);
      setPending(false);
    } else if (result?.success) {
      setSuccess(true);
      setPending(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">И-мэйл илгээгдлээ</CardTitle>
            <CardDescription>
              Нууц үг сэргээх холбоосыг таны и-мэйл хаяг руу илгээлээ. И-мэйлээ
              шалгана уу.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 size-4" />
                Нэвтрэх хуудас руу буцах
              </Link>
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
          <CardTitle className="text-2xl">Нууц үг сэргээх</CardTitle>
          <CardDescription>
            Бүртгэлтэй и-мэйл хаягаа оруулаад нууц үг сэргээх холбоосыг хүлээн
            авна уу
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <FieldGroup>
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
            </FieldGroup>

            {serverError && (
              <div className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {serverError}
              </div>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? "Илгээж байна..." : "Сэргээх холбоос илгээх"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/login"
                className="font-medium text-foreground hover:underline"
              >
                Нэвтрэх хуудас руу буцах
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
