"use client";

import { useState } from "react";
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
import type { Split } from "@/lib/store";
import { getSplitTotal } from "@/lib/split-status";
import type { ParticipantResult } from "@/lib/calc";

interface SettlementStepProps {
	split: Split;
	results: ParticipantResult[];
	isPayer: boolean;
	showUndo: boolean;
	onUndo: () => void;
}

export function SettlementStep({
	split,
	results,
	isPayer,
	showUndo,
	onUndo,
}: SettlementStepProps) {
	const [paidMap, setPaidMap] = useState<Record<string, number>>({});
	const [partialOpen, setPartialOpen] = useState<string | null>(null);
	const [partialAmount, setPartialAmount] = useState("");
	const [closeResult, setCloseResult] = useState<"all-paid" | "not-all" | null>(
		null,
	);

	const nonPayerResults = results.filter(
		(r) => r.name !== split.payer && r.rounded > 0,
	);

	const allPaid = nonPayerResults.every(
		(r) => (paidMap[r.name] || 0) >= r.rounded,
	);

	const handlePartial = (name: string) => {
		const amount = Number(partialAmount);
		if (!amount || amount <= 0) return;
		setPaidMap((prev) => ({
			...prev,
			[name]: (prev[name] || 0) + amount,
		}));
		setPartialOpen(null);
		setPartialAmount("");
	};

	const handleClose = () => {
		setCloseResult(allPaid ? "all-paid" : "not-all");
	};

	return (
		<div className="flex flex-col gap-6">
			{/* Undo banner */}
			{showUndo && (
				<div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">⚠️ Хуйлралт хийгдлээ</span>
						<button
							type="button"
							className="text-sm font-medium text-amber-700 underline"
							onClick={onUndo}
						>
							↩️ Буцаах
						</button>
					</div>
					<p className="mt-1 text-xs text-amber-600">
						2 минут орчимд буцаах боломжтой
					</p>
				</div>
			)}

			{/* Header */}
			<div>
				<h1 className="font-heading text-lg font-semibold">{split.title}</h1>
				<p className="text-sm text-muted-foreground">Төлбөр тооцоо</p>
			</div>

			<Separator />

			{/* Payer info */}
			<div className="flex items-center gap-3">
				<Avatar className="size-10">
					<AvatarFallback>{split.payer.charAt(0).toUpperCase()}</AvatarFallback>
				</Avatar>
				<div>
					<p className="text-sm font-medium">💰 {split.payer} — төлсөн</p>
					<p className="text-xs text-muted-foreground">
						{getSplitTotal(split).toLocaleString()}₮
					</p>
				</div>
				<Badge className="ml-auto">💰 Төлсөн</Badge>
			</div>

			<Separator />

			{/* Debtors */}
			<p className="text-xs font-medium text-muted-foreground">Төлөх дүн</p>
			{nonPayerResults.map((r) => {
				const paidAmount = paidMap[r.name] || 0;
				const remaining = r.rounded - paidAmount;
				const fullyPaid = remaining <= 0;

				return (
					<Card key={r.name}>
						<CardContent className="flex flex-col gap-3">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<Avatar className="size-8">
										<AvatarFallback className="text-xs">
											{r.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<span className="text-sm font-medium">{r.name}</span>
								</div>
								<div className="text-right">
									<span className="font-heading text-lg font-bold">
										{r.rounded.toLocaleString()}₮
									</span>
									{paidAmount > 0 && !fullyPaid && (
										<p className="text-xs text-amber-600">
											🟡 Хэсэгчилсэн {paidAmount.toLocaleString()}₮
										</p>
									)}
								</div>
							</div>

							{!fullyPaid ? (
								<div className="flex gap-2">
									{/* Partial payment dialog */}
									<Dialog
										open={partialOpen === r.name}
										onOpenChange={(open) => {
											setPartialOpen(open ? r.name : null);
											if (!open) setPartialAmount("");
										}}
									>
										<DialogTrigger
											render={
												<Button variant="outline" size="sm" className="flex-1">
													💳 Шилжүүлэх
												</Button>
											}
										/>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>{r.name} — шилжүүлэх дүн</DialogTitle>
											</DialogHeader>
											<div className="flex flex-col gap-3">
												<p className="text-sm text-muted-foreground">
													Үлдэгдэл:{" "}
													<span className="font-bold">
														{remaining.toLocaleString()}₮
													</span>
												</p>
												<input
													type="number"
													className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
													placeholder="Дүнгээ оруулна уу"
													value={partialAmount}
													onChange={(e) => setPartialAmount(e.target.value)}
													autoFocus
												/>
												<Button size="sm" onClick={() => handlePartial(r.name)}>
													Баталгаажуулах
												</Button>
											</div>
										</DialogContent>
									</Dialog>

									<Button variant="ghost" size="sm" className="flex-1">
										🛎️ Сануулах
									</Button>
								</div>
							) : (
								<Badge variant="default" className="self-start">
									✅ Төлсөн
								</Badge>
							)}
						</CardContent>
					</Card>
				);
			})}

			{isPayer && (
				<>
					<Separator />
					<Button
						variant="outline"
						className="w-full"
						size="lg"
						onClick={handleClose}
					>
						Сарлага дуусгах
					</Button>

					<Dialog
						open={closeResult !== null}
						onOpenChange={(open) => {
							if (!open) setCloseResult(null);
						}}
					>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>
									{closeResult === "all-paid"
										? "🎉 Бүгд төлсөн!"
										: "⏳ Төлөгдөөгүй байна"}
								</DialogTitle>
							</DialogHeader>
							<p className="text-sm text-muted-foreground">
								{closeResult === "all-paid"
									? "Сарлага дууслаа. Бүгд төлбөрөө төлж дуусгасан."
									: "Зарим хүн төлөөгүй байна. Тэдэнд сануулга илгээгээрэй."}
							</p>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCloseResult(null)}
								>
									Буцах
								</Button>
								{closeResult === "all-paid" && (
									<Button size="sm" onClick={() => setCloseResult(null)}>
										✅ Сарлага дуусгах
									</Button>
								)}
							</div>
						</DialogContent>
					</Dialog>
				</>
			)}
		</div>
	);
}
