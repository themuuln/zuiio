import type {
  AttendanceRecord,
  Employee,
  LeaveRequest,
  PayrollItem,
  PayrollRun,
} from "@zer/hr-core";
import type {
  AttendanceRow,
  EmployeeRow,
  LeaveRow,
  PayrollItemRow,
  PayrollRunRow,
} from "./types";

export function toEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    organizationId: row.organization_id,
    profileId: row.profile_id,
    fullName: row.full_name,
    position: row.position,
    department: row.department,
    hireDate: row.hire_date,
    contractType: row.contract_type as Employee["contractType"],
    baseSalary: row.base_salary,
    salaryType: row.salary_type as Employee["salaryType"],
    bankAccount: row.bank_account,
    isActive: row.is_active,
    branchId: row.branch_id,
    createdAt: row.created_at,
  };
}

export function toAttendance(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.date,
    clockIn: row.clock_in,
    clockOut: row.clock_out,
    breakMinutes: row.break_minutes,
    status: row.status as AttendanceRecord["status"],
  };
}

export function toLeaveRequest(row: LeaveRow): LeaveRequest {
  return {
    id: row.id,
    employeeId: row.employee_id,
    leaveType: row.leave_type as LeaveRequest["leaveType"],
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    status: row.status as LeaveRequest["status"],
    approvedBy: row.approved_by,
  };
}

export function toPayrollRun(row: PayrollRunRow): PayrollRun {
  return {
    id: row.id,
    organizationId: row.organization_id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    status: row.status as PayrollRun["status"],
    totalGross: row.total_gross,
    totalSiEmployee: row.total_si_employee,
    totalSiEmployer: row.total_si_employer,
    totalIncomeTax: row.total_income_tax,
    totalDeductions: row.total_deductions,
    totalNet: row.total_net,
    createdAt: row.created_at,
  };
}

export function toPayrollItem(row: PayrollItemRow): PayrollItem {
  return {
    id: row.id,
    payrollRunId: row.payroll_run_id,
    employeeId: row.employee_id,
    baseSalary: row.base_salary,
    overtimePay: row.overtime_pay,
    bonus: row.bonus,
    deduction: row.deduction,
    grossPay: row.gross_pay,
    siEmployee: row.si_employee,
    siEmployer: row.si_employer,
    incomeTax: row.income_tax,
    netPay: row.net_pay,
  };
}
