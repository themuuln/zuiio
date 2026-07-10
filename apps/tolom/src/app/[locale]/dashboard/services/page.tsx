import ServicesPageClient from "./_services-client";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ServicesPage() {
  return <ServicesPageClient />;
}
