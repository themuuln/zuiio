"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface IdentitySelectProps {
	splitId: string;
	title: string;
	date: string;
	payer: string;
	participants: { name: string }[];
	confirmedCount: number;
	participantCount: number;
}

export function IdentitySelect({
	splitId,
	title,
	date,
	payer,
	participants,
	confirmedCount,
	participantCount,
}: IdentitySelectProps) {
	const [selected, setSelected] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);

	const handleConfirm = () => {
		if (!selected) return;
		// Navigate to join page with identity param
		window.location.href = `/join/${splitId}?as=${encodeURIComponent(selected)}`;
	};

	const handleCancel = () => {
		setSelected(null);
		setConfirming(false);
	};

	// Confirmation dialog step
	if (selected && confirming) {
		return (
			<div className="flex flex-col gap-6">
				<Card>
					<CardContent className="flex flex-col items-center gap-4 py-8 text-center">
						<span className="text-4xl">📱</span>
						<p className="text-base font-medium">
							Чи <span className="font-bold">{selected}</span> мөн үү?
						</p>
						<p className="text-sm text-muted-foreground">
							Баталгаажуулсны дараа идсэн зүйлээ сонгох боломжтой
						</p>
						<Separator />
						<div className="flex w-full flex-col gap-2">
							<Button className="w-full" size="lg" onClick={handleConfirm}>
								✅ Тийм, би байнаа
							</Button>
							<Button
								variant="outline"
								className="w-full"
								size="lg"
								onClick={handleCancel}
							>
								🔙 Буруу хүн
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Identity selection
	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div>
				<h1 className="font-heading text-lg font-semibold">{title}</h1>
				<p className="text-sm text-muted-foreground">
					{date} · Төлсөн: {payer}
				</p>
			</div>

			<Separator />

			{/* Identity selection */}
			<div>
				<div className="mb-4 flex items-center gap-2">
					<span className="text-lg">🔵</span>
					<h2 className="text-base font-medium">Чи хэн бэ?</h2>
				</div>

				<div className="flex flex-col gap-2">
					{participants.map((p) => (
						<button
							key={p.name}
							type="button"
							onClick={() => {
								setSelected(p.name);
								setConfirming(true);
							}}
							className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted active:scale-[0.99]"
						>
							<span className="flex size-10 items-center justify-center rounded-lg bg-muted text-lg">
								📱
							</span>
							<span className="text-base font-medium">{p.name}</span>
							<span className="ml-auto text-muted-foreground">→</span>
						</button>
					))}
				</div>
			</div>

			{/* Progress bar */}
			<Card size="sm">
				<CardContent>
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<span>
							{confirmedCount}/{participantCount} хүн сонголтоо хийсэн
						</span>
					</div>
					<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{
								width: `${(confirmedCount / participantCount) * 100}%`,
							}}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
