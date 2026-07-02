import { redirect } from "next/navigation";

export default function NewSalePage() {
  redirect("/sales?create=true");
}
