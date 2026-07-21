"use client";

import { useState } from "react";
import type { Split } from "@/lib/store";
import { calculateSplit, type ParticipantResult } from "@/lib/calc";
import { ReviewSummary } from "./review-summary";
import { CelebrationReveal } from "./celebration-reveal";
import { RoundingStep } from "./rounding-step";
import { SettlementStep } from "./settlement-step";

type Phase = "review" | "reveal" | "rounding" | "settlement";

interface ReviewGateProps {
	split: Split;
	isPayer: boolean;
}

export function ReviewGate({ split, isPayer }: ReviewGateProps) {
	const [phase, setPhase] = useState<Phase>("review");
	const [rounded, setRounded] = useState<ParticipantResult[] | null>(null);

	const calculations = calculateSplit(split);

	// Fallback: calculations not ready
	if (!calculations) {
		return (
			<div className="py-12 text-center">
				<span className="text-4xl">⏳</span>
				<p className="mt-2 text-sm text-muted-foreground">
					Тооцоолол бэлэн болоогүй байна...
				</p>
			</div>
		);
	}

	const handleSettle = (results: ParticipantResult[]) => {
		setRounded(results);
		setPhase("settlement");
	};

	switch (phase) {
		case "review":
			if (isPayer) {
				return (
					<ReviewSummary
						split={split}
						calculations={calculations}
						onProceed={() => setPhase("reveal")}
					/>
				);
			}
			// Non-payer sees simplified waiting view
			return (
				<div className="flex flex-col gap-6">
					<div className="text-center">
						<span className="text-4xl">🎉</span>
						<h1 className="font-heading mt-2 text-lg font-semibold">
							Бүгд баталгаажуулсан!
						</h1>
						<p className="text-sm text-muted-foreground">
							Төлөгч дүнг шалгаж байна...
						</p>
						<button
							type="button"
							className="mt-4 text-sm text-primary underline underline-offset-2"
							onClick={() => setPhase("reveal")}
						>
							Үр дүнг харах
						</button>
					</div>
				</div>
			);

		case "reveal":
			return (
				<CelebrationReveal
					split={split}
					calculations={calculations}
					isPayer={isPayer}
					onRound={() => setPhase("rounding")}
				/>
			);

		case "rounding":
			return (
				<RoundingStep
					participantResults={calculations.participantResults}
					payer={split.payer}
					onSettle={handleSettle}
				/>
			);

		case "settlement":
			return (
				<SettlementStep
					split={split}
					results={rounded ?? calculations.participantResults}
					isPayer={isPayer}
					showUndo={true}
					onUndo={() => setPhase("rounding")}
				/>
			);
	}
}
