"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { CopyIcon, Share2Icon, MoreHorizontalIcon } from "lucide-react";
import type { Split } from "@/lib/store";
import {
	getConfirmedCount,
	getPendingParticipants,
	getParticipantCount,
	getSplitTotal,
} from "@/lib/split-status";

interface ShareScreenProps {
	split: Split;
	isPayer: boolean;
	shareUrl: string;
}

export function ShareScreen({ split, isPayer, shareUrl }: ShareScreenProps) {
	const router = useRouter();
	const [copied, setCopied] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const copyLink = () => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const sharerUrl = `https://t.me/share/url?url=${encodeURIComponent(
		shareUrl,
	)}&text=${encodeURIComponent(
		`Зилл: ${split.title} — нийт ${split.items
			.reduce((s, i) => s + i.amount, 0)
			.toLocaleString()}₮`,
	)}`;

	const total = getSplitTotal(split);
	const confirmedCount = getConfirmedCount(split);
	const participantCount = getParticipantCount(split);
	const pendingParticipants = getPendingParticipants(split);
	const [forcing, setForcing] = useState(false);

	const handleForceUnlock = async () => {
		setForcing(true);
		try {
			const form = new FormData();
			form.append("splitId", split.id);
			form.append("name", split.payer);
			await fetch("/api/force-unlock", { method: "POST", body: form });
			window.location.reload();
		} finally {
			setForcing(false);
		}
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Session header */}
			<Card>
				<CardContent className="flex flex-col gap-3">
					<div className="flex items-start justify-between">
						<div>
							<h1 className="font-heading text-base font-semibold">
								{split.title}
							</h1>
							<p className="text-xs text-muted-foreground">{split.date}</p>
						</div>
						{isPayer && (
							<Dialog>
								<DialogTrigger
									render={
										<button
											type="button"
											className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
										>
											<MoreHorizontalIcon className="size-4" />
										</button>
									}
								/>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Сарлага тохиргоо</DialogTitle>
									</DialogHeader>
									<div className="flex flex-col gap-2">
										<Button
											variant="destructive"
											size="sm"
											className="w-full"
											disabled={deleting}
											onClick={async () => {
												setDeleting(true);
												const form = new FormData();
												form.append("splitId", split.id);
												await fetch("/api/delete-split", {
													method: "POST",
													body: form,
												});
												router.push("/");
											}}
										>
											{deleting ? "Устгаж байна..." : "Сарлага устгах"}
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						)}
					</div>

					<Separator />

					{/* Summary */}
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Нийт</span>
						<span className="font-heading text-xl font-bold">
							{total.toLocaleString()}₮
						</span>
					</div>

					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">Төлсөн</span>
						<div className="flex items-center gap-2">
							<Avatar className="size-6">
								<AvatarFallback className="text-xs">
									{split.payer.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<span className="text-sm font-medium">{split.payer}</span>
						</div>
					</div>

					{/* Participants mini-avatars */}
					<div>
						<div className="mb-2 flex items-center gap-2">
							<span className="text-xs text-muted-foreground">Хүмүүс</span>
							<Badge variant="secondary" className="text-[10px]">
								{confirmedCount}/{participantCount}
							</Badge>
						</div>
						<div className="flex flex-wrap gap-2">
							{split.participants.map((p) => (
								<Badge
									key={p.name}
									variant={p.name === split.payer ? "default" : "outline"}
									className="gap-1"
								>
									{p.name === split.payer ? "💰" : "👤"} {p.name}
								</Badge>
							))}
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Items list */}
			<Card size="sm">
				<CardContent className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground">
						Зүйлс ({split.items.length})
					</p>
					{split.items.map((item) => (
						<div
							key={item.id}
							className="flex items-center justify-between py-0.5"
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="truncate text-sm">{item.name}</span>
								<ItemTagBadge tag={item.tag} />
							</div>
							<span className="shrink-0 text-sm font-medium tabular-nums">
								{item.amount.toLocaleString()}₮
							</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Share link */}
			<div className="flex flex-col gap-2">
				<p className="text-xs font-medium text-muted-foreground">
					Холбоос — хуваалцах
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						className="flex-1 justify-start gap-2 font-mono text-xs"
						onClick={copyLink}
					>
						<CopyIcon className="size-3.5" />
						<span className="truncate">
							{copied ? "Хуулагдсан!" : shareUrl.replace(/^https?:\/\//, "")}
						</span>
					</Button>
					<a
						href={sharerUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground whitespace-nowrap transition-colors hover:bg-primary/80"
					>
						<Share2Icon className="size-4" />
						Хуваалцах
					</a>
				</div>
			</div>

			{/* Progress bar */}
			<Card size="sm">
				<CardContent>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span
								className={`size-2 rounded-full ${confirmedCount === participantCount ? "bg-green-500" : confirmedCount > 0 ? "bg-amber-400" : "bg-muted-foreground/30"}`}
							/>
							<span className="text-xs text-muted-foreground">
								{confirmedCount === participantCount
									? "🎉 Бүгд баталгаажуулсан!"
									: `${confirmedCount}/${participantCount} хүн баталгаажуулсан`}
							</span>
						</div>
						{isPayer && confirmedCount === participantCount && (
							<Badge variant="default" className="animate-pulse">
								Хянах
							</Badge>
						)}
					</div>

					<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all duration-500"
							style={{ width: `${(confirmedCount / participantCount) * 100}%` }}
						/>
					</div>

					{/* Pending participants */}
					{pendingParticipants.length > 0 && (
						<div className="mt-3 flex flex-wrap gap-1.5">
							{pendingParticipants.map((p) => (
								<Badge
									key={p.name}
									variant="outline"
									className="text-[10px] opacity-60"
								>
									⏳ {p.name}
								</Badge>
							))}
						</div>
					)}

					{/* Force-unlock for payer */}
					{isPayer && pendingParticipants.length > 0 && (
						<button
							type="button"
							onClick={handleForceUnlock}
							disabled={forcing}
							className="mt-3 w-full rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50"
						>
							{forcing
								? "Нээж байна..."
								: `🔄 Зарим хүн сонгоогүй — одоо нээх (${pendingParticipants.length})`}
						</button>
					)}

					<p className="mt-2 text-xs text-muted-foreground">
						Холбоосыг Messenger группт хуваалцахад хүмүүс өөрсдийн идсэн зүйлээ
						сонгоно.
					</p>
					<a
						href={shareUrl}
						className="mt-3 block text-center text-xs text-primary underline underline-offset-2"
					>
						Холбоосоор нэвтрэх →
					</a>
				</CardContent>
			</Card>
		</div>
	);
}

function ItemTagBadge({ tag }: { tag: string }) {
	const labels: Record<string, string> = {
		shared: "✅ хуваалцах",
		individual: "👤 хувийн",
		alcohol: "🍺 архи",
		service: "🧑‍🍳 үйлчилгээ",
	};
	return (
		<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
			{labels[tag] || tag}
		</span>
	);
}
