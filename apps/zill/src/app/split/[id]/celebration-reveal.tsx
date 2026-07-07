"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Split } from "@/lib/store";
import type { CalculationResults } from "@/lib/calc";

interface CelebrationRevealProps {
	split: Split;
	calculations: CalculationResults;
	isPayer: boolean;
	onRound: () => void;
}

export function CelebrationReveal({
	split,
	calculations,
	isPayer,
	onRound,
}: CelebrationRevealProps) {
	return (
		<div className="flex flex-col gap-6">
			{/* Celebration banner */}
			<div className="rounded-xl bg-gradient-to-b from-amber-50 to-white p-8 text-center">
				<div className="text-6xl animate-bounce">🎉</div>
				<h1 className="font-heading mt-4 text-2xl font-bold text-amber-900">
					БҮГД БЭЛЭН!
				</h1>
				<p className="mt-2 text-sm text-amber-700">
					{split.title} — сарлага хуваагдлаа
				</p>
			</div>

			<Separator />

			{/* Per-person results */}
			<p className="text-xs font-medium text-muted-foreground">Үр дүн</p>
			{calculations.participantResults.map((r) => {
				const isP = r.name === split.payer;
				return (
					<Card key={r.name} size="sm">
						<CardContent className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Avatar className="size-7">
										<AvatarFallback className="text-xs">
											{r.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="text-sm font-medium">{r.name}</p>
										{isP && (
											<p className="text-[10px] text-muted-foreground">
												Төлөгч
											</p>
										)}
									</div>
								</div>
								<span className="font-heading text-lg font-bold">
									{r.subtotal.toLocaleString()}₮
								</span>
							</div>

							{/* Item breakdown */}
							<div className="mt-2 flex flex-col gap-1">
								{r.items.map((item, i) => (
									<div
										key={i}
										className="flex items-center justify-between pl-9"
									>
										<span className="text-xs text-muted-foreground">
											{item.name}
											{item.tag === "shared" && " (хос)"}
											{item.tag === "service" && " (үйлчилгээ)"}
											{item.tag === "unselected" &&
												" (сонгоогүй — төлөгч дээр түр оноосон)"}
											{item.tag === "alcohol" && " (архи)"}
											{item.tag === "individual" && " (хувийн)"}
										</span>
										<span className="text-xs tabular-nums text-muted-foreground">
											{item.amount.toLocaleString()}₮
										</span>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				);
			})}

			{isPayer && (
				<>
					<Separator />
					<Button className="w-full" size="lg" onClick={onRound}>
						Хуйлрах — дугуйлах →
					</Button>
				</>
			)}

			{!isPayer && (
				<div className="text-center text-sm text-muted-foreground">
					Төлөгчийг хүлээж байна...
				</div>
			)}
		</div>
	);
}
