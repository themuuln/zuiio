import { PIT_RATES } from "./constants";
import type { IncomeTaxResult } from "./types";
import { calculateSocialInsurance } from "./social-insurance";
import type { SocialInsuranceResult } from "./types";

function findMonthlyAllowance(taxableSalary: number): number {
  for (const bracket of PIT_RATES.allowanceBrackets) {
    if (taxableSalary <= bracket.maxSalary) {
      return bracket.allowance;
    }
  }
  return 0;
}

function calculateHighIncomeTax(annualTaxable: number): number {
  for (const bracket of PIT_RATES.highIncomeBrackets) {
    if (annualTaxable > bracket.threshold) {
      return (
        bracket.baseTax + (annualTaxable - bracket.threshold) * bracket.rate
      );
    }
  }
  return annualTaxable * PIT_RATES.baseRate;
}

export function calculateIncomeTax(
  gross: number,
  si: SocialInsuranceResult,
  minWage: number,
): IncomeTaxResult {
  const taxableIncome = gross - si.employeeShare;

  const annualTaxable = taxableIncome * 12;

  let netTax: number;
  let allowance = 0;

  if (annualTaxable > PIT_RATES.highIncomeThreshold) {
    const annualTax = calculateHighIncomeTax(annualTaxable);
    netTax = annualTax / 12;
  } else {
    allowance = findMonthlyAllowance(taxableIncome);
    const grossTax = taxableIncome * PIT_RATES.baseRate;
    netTax = Math.max(0, grossTax - allowance);
  }

  return {
    taxableIncome,
    grossTax: taxableIncome * PIT_RATES.baseRate,
    allowance,
    netTax,
  };
}
