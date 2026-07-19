import ServiceRemindersPageClient from "./_service-reminders-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ServiceRemindersPage() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ServiceRemindersPageClient />
    </div>
  );
}
