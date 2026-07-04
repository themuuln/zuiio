import { CashRegisterClient } from "./_cash-register-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function CashRegisterPage() {
  return <CashRegisterClient />;
}
