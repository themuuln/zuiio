import { CashRegisterClient } from "./_cash-register-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = true;

export default function CashRegisterPage() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <CashRegisterClient />
    </div>
  );
}
