export interface Employee {
  id: string;
  organizationId: string;
  profileId: string | null;
  fullName: string;
  position: string | null;
  department: string | null;
  hireDate: string;
  contractType: "permanent" | "temporary" | "contract";
  baseSalary: number;
  salaryType: "monthly" | "daily" | "hourly";
  bankAccount: string | null;
  isActive: boolean;
  branchId: string | null;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  status: "present" | "absent" | "late" | "half-day" | "holiday";
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: "annual" | "sick" | "unpaid" | "maternity" | "special";
  startDate: string;
  endDate: string;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  approvedBy: string | null;
}

export interface PayrollRun {
  id: string;
  organizationId: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "calculated" | "approved" | "paid";
  totalGross: number;
  totalSiEmployee: number;
  totalSiEmployer: number;
  totalIncomeTax: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: string;
}

export interface PayrollItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deduction: number;
  grossPay: number;
  siEmployee: number;
  siEmployer: number;
  incomeTax: number;
  netPay: number;
}

export interface OvertimeEntry {
  date: string;
  hours: number;
  type: "weekday" | "weekend" | "holiday" | "night";
}

export interface SocialInsuranceResult {
  employeeShare: number;
  employerShare: number;
  breakdown: {
    pension: number;
    benefits: number;
    occupationalInjury: number;
    unemployment: number;
    healthInsurance: number;
  };
}

export interface IncomeTaxResult {
  taxableIncome: number;
  grossTax: number;
  allowance: number;
  netTax: number;
}

export interface PayrollCalculationInput {
  baseSalary: number;
  attendanceDays: number;
  workingDays: number;
  overtimeEntries: OvertimeEntry[];
  bonuses: number;
  deductions: number;
  siCap: number;
  minWage: number;
}
