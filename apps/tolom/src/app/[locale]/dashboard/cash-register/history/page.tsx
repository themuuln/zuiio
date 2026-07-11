import { CashRegisterHistoryClient } from "./_cash-register-history-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function CashRegisterHistoryPage() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <CashRegisterHistoryClient />
    </div>
  );
}
