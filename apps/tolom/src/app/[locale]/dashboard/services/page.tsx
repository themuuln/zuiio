import ServicesPageClient from "./_services-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ServicesPage() {
  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ServicesPageClient />
    </div>
  );
}
