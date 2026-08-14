// Route renders user-specific content — legitimate cache opt-out.
export const instant = true;

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
