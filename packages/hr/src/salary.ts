export function hourlyRate(
  baseSalary: number,
  workingHoursPerMonth: number = 176,
): number {
  return baseSalary / workingHoursPerMonth;
}

export function dailyRate(
  baseSalary: number,
  workingDaysPerMonth: number = 22,
): number {
  return baseSalary / workingDaysPerMonth;
}

export function prorateSalary(
  baseSalary: number,
  attendanceDays: number,
  workingDays: number,
): number {
  if (workingDays <= 0) return 0;
  return (baseSalary / workingDays) * Math.min(attendanceDays, workingDays);
}
