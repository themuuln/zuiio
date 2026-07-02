import { redirect } from "next/navigation";

export default function NewJournalEntryPage() {
  redirect("/accounting?create=true");
}
