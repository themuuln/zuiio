"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Split } from "@/lib/store";
import {
	getSplitTotal,
	getConfirmedCount,
	getParticipantCount,
} from "@/lib/split-status";
import type { CalculationResults } from "@/lib/calc";

interface ReviewSummaryProps {
	split: Split;
	calculations: CalculationResults;
	onProceed: () => void;
}

export function ReviewSummary({
	split,
	calculations,
	onProceed,
}: ReviewSummaryProps) {
	const total = getSplitTotal(split);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center gap-2">
				<span className="text-xl">👀</span>
				<div>
					<h1 className="font-heading text-lg font-semibold">
						{split.title} — шалгах
					</h1>
					<p className="text-sm text-muted-foreground">
						Бүгд баталгаажуулсан, дүнгээ харна уу
					</p>
				</div>
			</div>

			<Separator />

			{/* Status summary */}
			<Card>
				<CardContent className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">📊 Нийт</span>
						<span className="font-heading text-lg font-bold">
							{total.toLocaleString()}₮
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">📊 Сонгогдсон</span>
						<span className="text-sm font-medium">
							{calculations.grandTotal.toLocaleString()}₮
						</span>
					</div>
					<div className="flex items-center justify-between">
						<span className="text-sm text-muted-foreground">
							✅ Баталгаажуулсан
						</span>
						<span className="text-sm font-medium text-green-600">
							{getConfirmedCount(split)}/{getParticipantCount(split)}
						</span>
					</div>
				</CardContent>
			</Card>

			{/* Participant breakdown */}
			<Card size="sm">
				<CardContent className="flex flex-col gap-3">
					<p className="text-xs font-medium text-muted-foreground">
						Хүмүүсийн дүн
					</p>
					{calculations.participantResults.map((r) => {
						const isP = r.name === split.payer;
						return (
							<div key={r.name} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{isP ? <span>💰</span> : <span>👤</span>}
									<span className="text-sm font-medium">{r.name}</span>
									{isP ? (
										<Badge variant="secondary" className="text-[10px]">
											Төлөгч
										</Badge>
									) : (
										<span
											className={`size-2 rounded-full ${
												split.selections[r.name]?.confirmed
													? "bg-green-500"
													: "bg-amber-400"
											}`}
										/>
									)}
								</div>
								<span className="text-sm tabular-nums font-medium">
									{r.subtotal.toLocaleString()}₮
								</span>
							</div>
						);
					})}
				</CardContent>
			</Card>

			<Separator />

			<Button className="w-full" size="lg" onClick={onProceed}>
				🎉 Үр дүнг харах
			</Button>
		</div>
	);
}
