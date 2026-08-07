"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type AcademyProgramRow, academyRefApi } from "@/app/admin/_lib/api";
import {
  type AttendanceRow,
  attendanceApi,
  enrollmentsApi,
} from "@/app/admin/_lib/api-academy-ext";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_OPTIONS: Record<string, string> = {
  present: "Ирсэн",
  absent: "Тасалсан",
  late: "Хоцорсон",
  excused: "Хүндэтгэлтэй",
};

const STATUS_COLORS: Record<
  string,
  "secondary" | "destructive" | "outline" | "default"
> = {
  present: "secondary",
  absent: "destructive",
  late: "outline",
  excused: "default",
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

export default function AcademyAttendancePage() {
  const queryClient = useQueryClient();
  const today = formatDate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedProgram, setSelectedProgram] = useState<string>("");

  const { data: ref } = useQuery({
    queryKey: ["admin", "academy", "reference"],
    queryFn: () => academyRefApi.get(),
    staleTime: 3 * 60 * 1000,
  });
  const programs = (ref?.programs ?? []) as AcademyProgramRow[];

  const { data: enrollments = [] } = useQuery({
    queryKey: ["admin", "academy", "enrollments"],
    queryFn: () => enrollmentsApi.list(),
  });

  const { data: attendance = [], isPending } = useQuery({
    queryKey: ["admin", "academy", "attendance", selectedDate, selectedProgram],
    queryFn: () =>
      attendanceApi.list({
        session_date: selectedDate,
        ...(selectedProgram ? { program_id: selectedProgram } : {}),
      }),
  });

  const recordMutation = useMutation({
    mutationFn: (params: {
      student_id: string;
      program_id: string;
      session_date: string;
      status: string;
    }) => attendanceApi.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "academy", "attendance"],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  function handleStatusChange(
    studentId: string,
    programId: string,
    status: string,
  ) {
    recordMutation.mutate({
      student_id: studentId,
      program_id: programId,
      session_date: selectedDate,
      status,
    });
  }

  function prevDay() {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
  }

  function nextDay() {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
  }

  const activeEnrollments = selectedProgram
    ? enrollments.filter((e) => e.program_id === selectedProgram)
    : enrollments.filter((e) => e.status === "active");

  const attendanceByStudent: Record<string, AttendanceRow> = {};
  for (const a of attendance) {
    attendanceByStudent[a.student_id] = a;
  }

  return (
    <AdminPageLayout
      title="Ирц"
      loading={isPending}
      headerExtras={
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setSelectedDate(today)}>
              Өнөөдөр
            </Button>
            <Button variant="outline" size="icon" onClick={nextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          />
          <div className="w-48">
            <Select
              value={selectedProgram}
              onValueChange={(v) => setSelectedProgram(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Бүх хөтөлбөр">
                  {programs?.find((p) => p.id === selectedProgram)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("mn-MN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      }
    >
      {activeEnrollments.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Энэ хөтөлбөрт идэвхтэй элсэлт байхгүй байна.
          {!selectedProgram &&
            " Элсэлтүүдийг харахын тулд хөтөлбөр сонгоно уу."}
        </div>
      )}
      {activeEnrollments.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Сурагч</TableHead>
              <TableHead>Хөтөлбөр</TableHead>
              <TableHead>Төлөв</TableHead>
              <TableHead>Тэмдэглэл</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeEnrollments.map((enrollment) => {
              const att = attendanceByStudent[enrollment.student_id];
              const currentStatus = att?.status ?? "";
              const programName =
                programs.find((p) => p.id === enrollment.program_id)?.name ??
                "—";
              return (
                <TableRow
                  key={`${enrollment.student_id}-${enrollment.program_id}`}
                >
                  <TableCell className="font-medium">
                    {enrollment.academy_students?.canonical_name ?? "—"}
                  </TableCell>
                  <TableCell>{programName}</TableCell>
                  <TableCell>
                    <Select
                      value={currentStatus}
                      onValueChange={(v) =>
                        handleStatusChange(
                          enrollment.student_id,
                          enrollment.program_id,
                          v,
                        )
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        {currentStatus ? (
                          <Badge
                            variant={STATUS_COLORS[currentStatus] ?? "outline"}
                          >
                            {STATUS_OPTIONS[currentStatus] ?? currentStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Тэмдэглэх
                          </span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_OPTIONS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {att?.note ?? "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </AdminPageLayout>
  );
}
