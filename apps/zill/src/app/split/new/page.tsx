import Link from "next/link";
import { getName } from "@/app/actions";
import { redirect } from "next/navigation";
import { SplitForm } from "./split-form";

export default async function NewSplitPage() {
	const name = await getName();
	if (!name) redirect("/");

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
			<div className="mb-6 flex items-center gap-3">
				<Link
					href="/"
					className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
				>
					←
				</Link>
				<div>
					<h1 className="font-heading text-lg font-semibold">Шинэ сарлага</h1>
					<p className="text-xs text-muted-foreground">Баримтаа оруулна уу</p>
				</div>
			</div>

			<SplitForm currentUserName={name} />
		</main>
	);
}
