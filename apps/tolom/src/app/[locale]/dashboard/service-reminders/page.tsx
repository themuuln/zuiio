import ServiceRemindersPageClient from "./_service-reminders-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ServiceRemindersPage() {
  return <ServiceRemindersPageClient />;
}
