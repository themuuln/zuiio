import { redirect } from "next/navigation";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = true;

export default function GuideRedirect() {
  redirect("/guide");
}
