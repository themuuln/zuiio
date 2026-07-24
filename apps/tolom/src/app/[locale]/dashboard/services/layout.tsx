// Route renders user-specific content — legitimate cache opt-out.
export const instant = true;

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
