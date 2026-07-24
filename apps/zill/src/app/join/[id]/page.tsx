import Link from "next/link";
import { notFound } from "next/navigation";
import { getSplit, getConfirmedCount } from "@/lib/db";
import { getName } from "@/app/actions";
import { IdentitySelect } from "./identity-select";
import { ItemSelect } from "./item-select";

export default async function JoinPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ as?: string }>;
}) {
	const { id } = await params;
	const split = await getSplit(id);
	if (!split) notFound();

	const { as } = await searchParams;
	const currentName = as || (await getName());
	const isPayer = currentName === split.payer;

	// If we know who they are and they're not the payer → show item selection
	if (currentName && !isPayer) {
		const selection = split.selections[currentName];

		return (
			<main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
				<Link
					href="/"
					className="mb-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
				>
					←
				</Link>

				<ItemSelect
					splitId={split.id}
					title={split.title}
					date={split.date}
					payer={split.payer}
					participantName={currentName}
					items={split.items}
					savedSelection={selection?.selectedItemIds || []}
					isConfirmed={selection?.confirmed || false}
					isSaved={selection?.saved || false}
					privacyMode={split.privacyMode}
					confirmedCount={await getConfirmedCount(split.id)}
					participantCount={split.participants.length}
				/>
			</main>
		);
	}

	// No identity known → show identity selection
	const otherParticipants = split.participants.filter(
		(p) => p.name !== split.payer,
	);

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
			<Link
				href="/"
				className="mb-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				←
			</Link>

			<IdentitySelect
				splitId={split.id}
				title={split.title}
				date={split.date}
				payer={split.payer}
				participants={otherParticipants}
				confirmedCount={await getConfirmedCount(split.id)}
				participantCount={split.participants.length}
			/>
		</main>
	);
}
