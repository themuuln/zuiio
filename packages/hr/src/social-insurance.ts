import { SI_RATES, DEFAULT_SI_CAP_MULTIPLIER, MIN_WAGE } from "./constants";
import type { SocialInsuranceResult } from "./types";

function cappedSalary(gross: number, minWage: number): number {
  const cap = minWage * DEFAULT_SI_CAP_MULTIPLIER;
  return Math.min(gross, cap);
}

export function calculateSocialInsurance(
  gross: number,
  riskClass: "low" | "mid" | "high" = "low",
  minWage: number = MIN_WAGE,
): SocialInsuranceResult {
  const base = cappedSalary(gross, minWage);

  const employeeBreakdown = {
    pension: base * SI_RATES.employee.pension,
    benefits: base * SI_RATES.employee.benefits,
    occupationalInjury: base * SI_RATES.employee.occupationalInjury,
    unemployment: base * SI_RATES.employee.unemployment,
    healthInsurance: base * SI_RATES.employee.healthInsurance,
  };

  const occupationalInjuryRate = {
    low: SI_RATES.employer.occupationalInjuryLow,
    mid: SI_RATES.employer.occupationalInjuryMid,
    high: SI_RATES.employer.occupationalInjuryHigh,
  }[riskClass];

  const employerBreakdown = {
    pension: base * SI_RATES.employer.pension,
    benefits: base * SI_RATES.employer.benefits,
    occupationalInjury: base * occupationalInjuryRate,
    unemployment: base * SI_RATES.employer.unemployment,
    healthInsurance: base * SI_RATES.employer.healthInsurance,
  };

  const employeeShare = Object.values(employeeBreakdown).reduce(
    (a, b) => a + b,
    0,
  );
  const employerShare = Object.values(employerBreakdown).reduce(
    (a, b) => a + b,
    0,
  );

  return { employeeShare, employerShare, breakdown: employeeBreakdown };
}
