"use client";

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { submitRegistration } from "../../lib/data-client";

interface FormData {
  studentName: string;
  dateOfBirth: string;
  guardianName: string;
  guardianPhone: string;
  notes: string;
}

const PHONE_REGEX = /^\d{8}$/;

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; intentId: string; message: string }
  | { status: "error"; message: string };

export const metadata = {
  title: "Бүртгүүлэх — Академи — Оноо",
};

export default function AcademyEnrollPage() {
  const searchParams = useSearchParams();
  const preselectedProgram = searchParams.get("program") ?? "";
  const programName = searchParams.get("name") ?? "";

  const [form, setForm] = useState<FormData>({
    studentName: "",
    dateOfBirth: "",
    guardianName: "",
    guardianPhone: "",
    notes: "",
  });
  const [programId] = useState(preselectedProgram);
  const [state, setState] = useState<SubmitState>({ status: "idle" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormData | "program", string>>
  >({});

  const updateField = useCallback(
    (field: keyof FormData) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    [],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!form.studentName.trim() || form.studentName.trim().length < 2) {
      newErrors.studentName = "Сурагчийн нэр хэт богино байна";
    }
    if (!programId) {
      newErrors.program = "Хөтөлбөрөө сонгоно уу";
    }
    if (form.guardianPhone && !PHONE_REGEX.test(form.guardianPhone)) {
      newErrors.guardianPhone = "Утасны дугаар 8 оронтой байх ёстой";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setState({ status: "submitting" });

    try {
      const result = await submitRegistration({
        programId,
        studentName: form.studentName.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        guardianName: form.guardianName.trim() || undefined,
        guardianPhone: form.guardianPhone.trim() || undefined,
        notes: form.notes.trim() || undefined,
      });
      setState({
        status: "success",
        intentId: result.intent_id,
        message: result.message,
      });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Холболтын алдаа",
      });
    }
  }

  if (state.status === "success") {
    return (
      <main className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-20 text-center">
        <div className="rounded-full bg-success/10 p-4">
          <CheckCircle2 className="h-12 w-12 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold">Бүртгэл амжилттай</h1>
        <p className="text-muted-foreground">{state.message}</p>
        <p className="rounded-lg border bg-secondary/30 px-4 py-2 text-xs text-muted-foreground font-mono">
          ID: {state.intentId}
        </p>
        <div className="flex gap-4">
          <Link href="/academy">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Буцах
            </Button>
          </Link>
          <Link href="/">
            <Button>Нүүр хуудас</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12">
      <div>
        <Link
          href="/academy"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>
        <h1 className="font-display text-2xl font-bold">Бүртгүүлэх</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Доорх маягтыг бөглөөд бүртгүүлнэ үү.
        </p>
      </div>
      {programName && (
        <div className="rounded-lg border bg-secondary/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">Сонгосон хөтөлбөр</p>
          <p className="font-medium">{programName}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Холбогдох мэдээлэл</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="hidden" name="programId" value={programId} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="studentName" className="text-sm font-medium">
                Сурагчийн нэр <span className="text-destructive">*</span>
              </label>
              <Input
                id="studentName"
                value={form.studentName}
                onChange={updateField("studentName")}
                placeholder="Овог нэр"
              />
              {errors.studentName && (
                <p className="text-xs text-destructive">{errors.studentName}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dateOfBirth" className="text-sm font-medium">
                Төрсөн огноо
              </label>
              <Input
                id="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={updateField("dateOfBirth")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="guardianName" className="text-sm font-medium">
                Эцэг/эхийн нэр
              </label>
              <Input
                id="guardianName"
                value={form.guardianName}
                onChange={updateField("guardianName")}
                placeholder="Овог нэр"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="notes" className="text-sm font-medium">
                Тэмдэглэл
              </label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes")(e)}
                placeholder="Нэмэлт мэдээлэл байвал бичнэ үү"
                className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                maxLength={500}
              />
            </div>

            {errors.program && (
              <p className="text-xs text-destructive">{errors.program}</p>
            )}

            {state.status === "error" && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {state.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={state.status === "submitting"}
              className="w-full"
            >
              {state.status === "submitting" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Илгээж байна...
                </>
              ) : (
                "Бүртгүүлэх"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
