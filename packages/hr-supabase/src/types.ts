import type { SupabaseClient } from "@supabase/supabase-js";

export interface HrTableConfig {
  employees: string;
  attendanceRecords: string;
  leaveRequests: string;
  payrollRuns: string;
  payrollItems: string;
}

export const DEFAULT_TABLES: HrTableConfig = {
  employees: "employees",
  attendanceRecords: "attendance_records",
  leaveRequests: "leave_requests",
  payrollRuns: "payroll_runs",
  payrollItems: "payroll_items",
};

export interface HrDatabaseConfig {
  tables?: Partial<HrTableConfig>;
  schema?: string;
}

export interface HrDatabase {
  employees: EmployeeRepository;
  attendance: AttendanceRepository;
  leave: LeaveRepository;
  payroll: PayrollRepository;
}

export function createHrDatabase(
  supabase: SupabaseClient,
  config?: HrDatabaseConfig,
): HrDatabase {
  const tables = { ...DEFAULT_TABLES, ...config?.tables };
  const schema = config?.schema;

  const s = schema
    ? {
        from: (t: string) =>
          supabase.schema(schema).from(t) as ReturnType<SupabaseClient["from"]>,
      }
    : { from: (t: string) => supabase.from(t) };

  const db = (table: string) => s.from(table);

  return {
    employees: createEmployeeRepo(db(tables.employees)),
    attendance: createAttendanceRepo(db(tables.attendanceRecords)),
    leave: createLeaveRepo(db(tables.leaveRequests)),
    payroll: createPayrollRepo(db(tables.payrollRuns), db(tables.payrollItems)),
  };
}

type Db = ReturnType<SupabaseClient["from"]>;

// ─── Repository interfaces ──────────────────────────────────────────────────

export interface EmployeeRepository {
  findAll(organizationId: string): Promise<EmployeeRow[]>;
  findById(id: string): Promise<EmployeeRow | null>;
  create(data: EmployeeInsert): Promise<EmployeeRow>;
  update(id: string, data: EmployeeUpdate): Promise<EmployeeRow>;
  remove(id: string): Promise<void>;
}

export interface AttendanceRepository {
  findByDateRange(
    employeeId: string,
    from: string,
    to: string,
  ): Promise<AttendanceRow[]>;
  findByDate(organizationId: string, date: string): Promise<AttendanceRow[]>;
  upsert(data: AttendanceUpsert): Promise<AttendanceRow>;
}

export interface LeaveRepository {
  findByEmployee(employeeId: string): Promise<LeaveRow[]>;
  findByOrganization(organizationId: string): Promise<LeaveRow[]>;
  create(data: LeaveInsert): Promise<LeaveRow>;
  updateStatus(
    id: string,
    status: string,
    approvedBy: string,
  ): Promise<LeaveRow>;
}

export interface PayrollRepository {
  findByOrganization(organizationId: string): Promise<PayrollRunRow[]>;
  create(data: PayrollRunInsert): Promise<PayrollRunRow>;
  updateStatus(id: string, status: string): Promise<PayrollRunRow>;
  getItems(payrollRunId: string): Promise<PayrollItemRow[]>;
  createItems(items: PayrollItemInsert[]): Promise<PayrollItemRow[]>;
}

// ─── Row types (Supabase → @zer/hr-core mapping) ────────────────────────────

export interface EmployeeRow {
  id: string;
  organization_id: string;
  profile_id: string | null;
  full_name: string;
  position: string | null;
  department: string | null;
  hire_date: string;
  contract_type: string;
  base_salary: number;
  salary_type: string;
  bank_account: string | null;
  is_active: boolean;
  branch_id: string | null;
  created_at: string;
}

export type EmployeeInsert = Omit<EmployeeRow, "id" | "created_at">;
export type EmployeeUpdate = Partial<
  Omit<EmployeeRow, "id" | "organization_id" | "created_at">
>;

export interface AttendanceRow {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  break_minutes: number;
  status: string;
}

export type AttendanceUpsert = Omit<AttendanceRow, "id">;

export interface LeaveRow {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  organization_id: string;
}

export type LeaveInsert = Omit<LeaveRow, "id">;

export interface PayrollRunRow {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_gross: number;
  total_si_employee: number;
  total_si_employer: number;
  total_income_tax: number;
  total_deductions: number;
  total_net: number;
  created_at: string;
}

export type PayrollRunInsert = Omit<PayrollRunRow, "id" | "created_at">;

export interface PayrollItemRow {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  deduction: number;
  gross_pay: number;
  si_employee: number;
  si_employer: number;
  income_tax: number;
  net_pay: number;
}

export type PayrollItemInsert = Omit<PayrollItemRow, "id">;

// ─── Factory implementations ─────────────────────────────────────────────────

function createEmployeeRepo(db: Db): EmployeeRepository {
  return {
    async findAll(organizationId) {
      const { data, error } = await db
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async findById(id) {
      const { data, error } = await db.select("*").eq("id", id).single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }
      return data;
    },

    async create(record) {
      const { data, error } = await db
        .insert(record as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, record) {
      const { data, error } = await db
        .update(record as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async remove(id) {
      const { error } = await db.delete().eq("id", id);
      if (error) throw error;
    },
  };
}

function createAttendanceRepo(db: Db): AttendanceRepository {
  return {
    async findByDateRange(employeeId, from, to) {
      const { data, error } = await db
        .select("*")
        .eq("employee_id", employeeId)
        .gte("date", from)
        .lte("date", to)
        .order("date");
      if (error) throw error;
      return data ?? [];
    },

    async findByDate(organizationId, date) {
      const { data, error } = await db
        .select("*, employees!inner(organization_id)")
        .eq("employees.organization_id", organizationId)
        .eq("date", date)
        .order("clock_in");
      if (error) throw error;
      return data ?? [];
    },

    async upsert(record) {
      const { data, error } = await db
        .upsert(record as never, {
          onConflict: "employee_id,date",
          ignoreDuplicates: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };
}

function createLeaveRepo(db: Db): LeaveRepository {
  return {
    async findByEmployee(employeeId) {
      const { data, error } = await db
        .select("*")
        .eq("employee_id", employeeId)
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async findByOrganization(organizationId) {
      const { data, error } = await db
        .select("*, employees!inner(organization_id)")
        .eq("employees.organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async create(record) {
      const { data, error } = await db
        .insert(record as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateStatus(id, status, approvedBy) {
      const { data, error } = await db
        .update({ status, approved_by: approvedBy } as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  };
}

function createPayrollRepo(runsDb: Db, itemsDb: Db): PayrollRepository {
  return {
    async findByOrganization(organizationId) {
      const { data, error } = await runsDb
        .select("*")
        .eq("organization_id", organizationId)
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async create(record) {
      const { data, error } = await runsDb
        .insert(record as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateStatus(id, status) {
      const { data, error } = await runsDb
        .update({ status } as never)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async getItems(payrollRunId) {
      const { data, error } = await itemsDb
        .select("*")
        .eq("payroll_run_id", payrollRunId);
      if (error) throw error;
      return data ?? [];
    },

    async createItems(items) {
      const { data, error } = await itemsDb.insert(items as never).select();
      if (error) throw error;
      return data ?? [];
    },
  };
}
