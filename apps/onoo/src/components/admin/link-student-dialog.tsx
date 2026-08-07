"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface LinkStudentDialogProps {
  playerId: string;
  userId: string;
  onLinked: () => void;
}

export function LinkStudentDialog({
  playerId,
  userId,
  onLinked,
}: LinkStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<
    { id: string; canonical_name: string; academy_name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  const searchStudents = async (q: string) => {
    if (!q) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("academy_students")
      .select("id, canonical_name, academy_profiles!inner(name)")
      .ilike("canonical_name", `%${q}%`)
      .limit(10);
    type StudentRow = {
      id: string;
      canonical_name: string;
      academy_profiles: { name: string } | null;
    };
    setStudents(
      ((data ?? []) as unknown as StudentRow[]).map((s) => ({
        id: s.id,
        canonical_name: s.canonical_name,
        academy_name: s.academy_profiles?.name ?? "",
      })),
    );
    setLoading(false);
  };

  const linkStudent = async (studentId: string) => {
    setLinking(true);
    await fetch("/admin/api/link-student-to-player", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student_id: studentId, user_id: userId }),
    });
    setLinking(false);
    setOpen(false);
    onLinked();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" disabled={!userId}>
          Холбох
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Академийн сурагч холбох</DialogTitle>
        </DialogHeader>
        <Input
          placeholder="Сурагчийн нэр..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            searchStudents(e.target.value);
          }}
        />
        <div className="mt-2 space-y-1">
          {loading && (
            <p className="text-sm text-muted-foreground">Хайж байна...</p>
          )}
          {students.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between rounded border p-2"
            >
              <div>
                <p className="text-sm font-medium">{s.canonical_name}</p>
                <p className="text-xs text-muted-foreground">
                  {s.academy_name}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => linkStudent(s.id)}
                disabled={linking}
              >
                {linking ? "Холбож байна..." : "Холбох"}
              </Button>
            </div>
          ))}
          {!loading && students.length === 0 && search && (
            <p className="text-sm text-muted-foreground">Сурагч олдсонгүй</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
