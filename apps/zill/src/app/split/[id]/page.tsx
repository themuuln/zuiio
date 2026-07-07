import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSplit } from "@/lib/db";
import { getName } from "@/app/actions";
import { isSplitReadyForReview } from "@/lib/split-status";
import { ShareScreen } from "./share-screen";
import { ReviewGate } from "./review-gate";

export default async function SplitPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const split = await getSplit(id);
	if (!split) notFound();

	const name = await getName();
	const isPayer = name === split.payer;
	const host = (await headers()).get("host") || "zill.mn";
	const protocol =
		host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
	const shareUrl = `${protocol}://${host}/join/${id}`;

	const allConfirmed = isSplitReadyForReview(split);

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
			<Link
				href="/"
				className="mb-3 flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				←
			</Link>

			{allConfirmed ? (
				<ReviewGate split={split} isPayer={isPayer} />
			) : (
				<ShareScreen split={split} isPayer={isPayer} shareUrl={shareUrl} />
			)}
		</main>
	);
}
