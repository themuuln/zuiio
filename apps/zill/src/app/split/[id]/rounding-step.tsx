"use client";

import { useMemo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { applyRounding, type ParticipantResult } from "@/lib/calc";

interface RoundingStepProps {
	participantResults: ParticipantResult[];
	payer: string;
	onSettle: (rounded: ParticipantResult[]) => void;
}

export function RoundingStep({
	participantResults,
	payer,
	onSettle,
}: RoundingStepProps) {
	const [unit, setUnit] = useState(500);

	const { results, diff } = useMemo(
		() => applyRounding(participantResults, payer, unit),
		[participantResults, payer, unit],
	);

	const handleSettle = useCallback(() => {
		onSettle(results);
	}, [results, onSettle]);

	return (
		<div className="flex flex-col gap-6">
			<div>
				<div className="flex items-center gap-2">
					<span className="text-xl">🔄</span>
					<h1 className="font-heading text-lg font-semibold">
						Хуйлрах — дугуйлах
					</h1>
				</div>
				<p className="mt-1 text-sm text-muted-foreground">
					Дүнг дугуйлах нэгжээ сонго
				</p>
			</div>

			<Separator />

			{/* Unit selector */}
			<div className="flex gap-2">
				{[0, 500, 1000].map((u) => (
					<button
						key={u}
						type="button"
						onClick={() => setUnit(u)}
						className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
							unit === u
								? "border-primary bg-primary/5 text-primary font-medium"
								: "border-border bg-card text-muted-foreground"
						}`}
					>
						{u === 0 ? "Яг" : `${u.toLocaleString()}₮`}
					</button>
				))}
			</div>

			{/* Results table */}
			<Card>
				<CardContent className="flex flex-col gap-3">
					{results.map((r) => {
						const isP = r.name === payer;
						const original = participantResults.find(
							(cr) => cr.name === r.name,
						);

						return (
							<div key={r.name} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<span>{isP ? "💰" : "👤"}</span>
									<span className="text-sm">{r.name}</span>
								</div>
								<div className="flex items-center gap-2 tabular-nums">
									{original && original.subtotal !== r.rounded && (
										<span className="text-xs text-muted-foreground line-through">
											{original.subtotal.toLocaleString()}₮
										</span>
									)}
									<span className="text-sm font-medium">
										{r.rounded.toLocaleString()}₮
									</span>
								</div>
							</div>
						);
					})}
				</CardContent>
			</Card>

			{/* Difference */}
			<div
				className={`flex items-center justify-between rounded-xl border p-3 ${
					diff === 0
						? "border-green-200 bg-green-50"
						: "border-amber-200 bg-amber-50"
				}`}
			>
				<span className="text-sm font-medium">
					{diff === 0
						? "🎉 Зөрүү: 0₮ (тэнцсэн!)"
						: diff > 0
							? `📈 Илүү: +${diff.toLocaleString()}₮ — ${payer} нөхнө`
							: `📉 Дутуу: ${diff.toLocaleString()}₮ — ${payer} авна`}
				</span>
			</div>

			<Separator />

			<Button className="w-full" size="lg" onClick={handleSettle}>
				✅ Хуйлрах
			</Button>
			<div className="text-center text-xs text-muted-foreground">
				Дугуйлсны дараа 2 минутын дотор буцаах боломжтой
			</div>
		</div>
	);
}
