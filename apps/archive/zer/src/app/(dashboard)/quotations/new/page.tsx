import { redirect } from "next/navigation";

export default async function NewQuotationPage() {
  redirect("/quotations?create=true");
}
