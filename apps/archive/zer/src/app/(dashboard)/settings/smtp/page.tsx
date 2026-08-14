import { requireSuperadmin } from "@/lib/superadmin";
import { SmtpContent } from "./smtp-content";

export default async function SmtpSettingsPage() {
  // Only the superadmin (developer) can access this page
  await requireSuperadmin();

  return <SmtpContent />;
}
