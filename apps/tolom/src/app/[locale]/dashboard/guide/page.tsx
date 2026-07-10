import { redirect } from "next/navigation";

// Route renders user-specific content — legitimate cache opt-out.
export const instant = false;

export default function GuideRedirect() {
  redirect("/guide");
}
