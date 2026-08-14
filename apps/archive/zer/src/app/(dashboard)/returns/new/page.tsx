import { redirect } from "next/navigation";

export default function NewReturnPage() {
  redirect("/returns?create=true");
}
