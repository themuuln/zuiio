"use client";

import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type CsvImportResult, csvApi } from "@/app/admin/_lib/api-academy-ext";
import { AdminPageLayout } from "@/components/admin/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AcademyStudentsCsvPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<CsvImportResult | null>(
    null,
  );
  const [file, setFile] = useState<File | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await csvApi.exportStudents();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "academy_students.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV файл татагдлаа");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Экспорт амжилтгүй боллоо",
      );
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!file) {
      toast.error("Файл сонгоно уу");
      return;
    }
    setImporting(true);
    setImportResult(null);
    try {
      const result = await csvApi.importStudents(file);
      setImportResult(result);
      if (result.success_count > 0) {
        toast.success(`${result.success_count} сурагч амжилттай импортлогдлоо`);
      }
      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} алдаа гарлаа`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Импорт амжилтгүй боллоо",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <AdminPageLayout title="Сурагч CSV" loading={false}>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle>CSV экспорт</CardTitle>
            <CardDescription>
              Сурагчдын мэдээллийг CSV файл хэлбэрээр татах
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={exporting}>
              <Download className="mr-2 h-4 w-4" />
              {exporting ? "Татаж байна..." : "CSV татах"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle>CSV импорт</CardTitle>
            <CardDescription>
              CSV файлаас сурагчдын мэдээлэл импортлох. Багана: canonical_name
              (заавал), name_latin, date_of_birth, school_name, grade_level,
              medical_notes, allergies, emergency_contact_name,
              emergency_contact_phone, notes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Button onClick={handleImport} disabled={importing || !file}>
              <Upload className="mr-2 h-4 w-4" />
              {importing ? "Импортлож байна..." : "CSV импортлох"}
            </Button>

            {/* Import Results */}
            {importResult && (
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    Амжилттай: {importResult.success_count}
                  </Badge>
                  {importResult.errors.length > 0 && (
                    <Badge variant="destructive">
                      Алдаа: {importResult.errors.length}
                    </Badge>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded border p-2 text-sm">
                    {importResult.errors.map((err, idx) => (
                      <div key={idx} className="text-destructive">
                        Мөр {err.row}: {err.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
}
