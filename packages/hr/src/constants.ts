export const SI_RATES = {
  employee: {
    pension: 0.085,
    benefits: 0.008,
    occupationalInjury: 0,
    unemployment: 0.002,
    healthInsurance: 0.02,
  },
  employer: {
    pension: 0.085,
    benefits: 0.01,
    occupationalInjuryHigh: 0.025,
    occupationalInjuryMid: 0.015,
    occupationalInjuryLow: 0.005,
    unemployment: 0.005,
    healthInsurance: 0.02,
  },
} as const;

export const PIT_RATES = {
  baseRate: 0.1,
  allowanceBrackets: [
    { maxSalary: 500_000, allowance: 20_000 },
    { maxSalary: 1_000_000, allowance: 18_000 },
    { maxSalary: 1_500_000, allowance: 16_000 },
    { maxSalary: 2_000_000, allowance: 14_000 },
    { maxSalary: 2_500_000, allowance: 12_000 },
    { maxSalary: 3_000_000, allowance: 10_000 },
  ] as const,
  highIncomeThreshold: 120_000_000,
  highIncomeBrackets: [
    { threshold: 120_000_000, baseTax: 12_000_000, rate: 0.15 },
    { threshold: 180_000_000, baseTax: 21_000_000, rate: 0.2 },
  ] as const,
} as const;

export const OT_RATES = {
  weekday: 1.5,
  weekend: 2.0,
  holiday: 2.0,
  night: 0.4,
} as const;

export const DEFAULT_SI_CAP_MULTIPLIER = 10;
export const MIN_WAGE = 792_000;
