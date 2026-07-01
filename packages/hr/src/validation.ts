import { MIN_WAGE } from "./constants";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateEmployee(data: {
  fullName: string;
  baseSalary: number;
  hireDate: string;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.fullName?.trim()) {
    errors.push({ field: "fullName", message: "Нэр шаардлагатай" });
  }

  if (!data.baseSalary || data.baseSalary < MIN_WAGE) {
    errors.push({
      field: "baseSalary",
      message: `Цалин хөдөлмөрийн хөлсний доод хэмжээнээс (₮${MIN_WAGE.toLocaleString()}) бага байж болохгүй`,
    });
  }

  if (!data.hireDate) {
    errors.push({
      field: "hireDate",
      message: "Ажилд орсон огноо шаардлагатай",
    });
  }

  return errors;
}

export function validateAttendance(data: {
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.date) {
    errors.push({ field: "date", message: "Огноо шаардлагатай" });
  }

  if (data.clockIn && data.clockOut && data.clockIn >= data.clockOut) {
    errors.push({
      field: "clockOut",
      message: "Гарсан цаг орсон цагаас хойш байх ёстой",
    });
  }

  return errors;
}

export function validatePayrollRun(
  employees: {
    baseSalary: number;
    attendanceDays: number;
    workingDays: number;
  }[],
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]!;
    if (emp.attendanceDays > emp.workingDays) {
      errors.push({
        field: `employees[${i}].attendanceDays`,
        message: "Ирсэн өдөр нь ажиллах өдрөөс илүү байж болохгүй",
      });
    }
    if (emp.attendanceDays < 0) {
      errors.push({
        field: `employees[${i}].attendanceDays`,
        message: "Ирсэн өдөр сөрөг утгатай байж болохгүй",
      });
    }
  }

  return errors;
}
