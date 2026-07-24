export interface RoundingConfig {
  mode: "ceil_to";
  /** e.g. 500 → prices end on ₮500 steps */
  step: number;
}

export interface PricingInput {
  costUsd: number;
  /** USD → MNT */
  fxRate: number;
  /** From the resolved pricing rule */
  markupPercent: number;
  /** Floor from app_settings */
  minMarginPercent: number;
  rounding: RoundingConfig;
}

export interface PricingResult {
  /** Integer ₮ — what the customer pays */
  retailMnt: number;
  /** Integer ₮ — cost_usd × fx, rounded */
  costMnt: number;
  marginMnt: number;
  marginPercent: number;
  minMarginApplied: boolean;
}
