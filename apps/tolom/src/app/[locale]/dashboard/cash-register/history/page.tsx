import { CashRegisterHistoryClient } from "./_cash-register-history-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function CashRegisterHistoryPage() {
  return <CashRegisterHistoryClient />;
}
