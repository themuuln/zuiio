// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
