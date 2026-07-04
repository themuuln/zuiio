/**
 * Minimal layout for the QR clock-in/out scanner page.
 * No sidebar, no nav — just centered content for mobile use.
 */

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function ClockLayout(
  {
    children,
  }: {
    children: React.ReactNode;
  }
) {
  return <>{children}</>;
}
