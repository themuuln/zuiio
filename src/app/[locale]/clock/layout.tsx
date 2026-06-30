/**
 * Minimal layout for the QR clock-in/out scanner page.
 * No sidebar, no nav — just centered content for mobile use.
 */

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
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
