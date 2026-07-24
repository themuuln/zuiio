"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { ItemTag, ItemEntry } from "@/app/actions";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const TAG_OPTIONS: { value: ItemTag; label: string }[] = [
	{ value: "shared", label: "✅ Хуваалцах" },
	{ value: "individual", label: "👤 Хувийн" },
	{ value: "alcohol", label: "🍺 Архи" },
	{ value: "service", label: "🧑‍🍳 Үйлчилгээ" },
];

export function SplitForm({ currentUserName }: { currentUserName: string }) {
	const [title, setTitle] = useState("");
	const [items, setItems] = useState<ItemEntry[]>([
		{ name: "", amount: 0, tag: "shared" },
	]);
	const [participants, setParticipants] = useState<string[]>([
		currentUserName,
		"",
	]);
	const [payer, setPayer] = useState(currentUserName);
	const [equalSplitOpen, setEqualSplitOpen] = useState(false);
	const [equalSplitAmount, setEqualSplitAmount] = useState("");

	// ── Item handlers ─────────────────────────────────────────────

	const updateItem = (
		i: number,
		field: keyof ItemEntry,
		value: string | number | ItemTag,
	) => {
		setItems((prev) => {
			const next = [...prev];
			next[i] = { ...next[i], [field]: value };
			return next;
		});
	};

	const addItem = () => {
		setItems((prev) => [...prev, { name: "", amount: 0, tag: "shared" }]);
	};

	const removeItem = (i: number) => {
		setItems((prev) => prev.filter((_, idx) => idx !== i));
	};

	// ── Participant handlers ───────────────────────────────────────

	const updateParticipant = (i: number, value: string) => {
		setParticipants((prev) => {
			const next = [...prev];
			next[i] = value;
			return next;
		});
	};

	const addParticipant = () => {
		setParticipants((prev) => [...prev, ""]);
	};

	const removeParticipant = (i: number) => {
		setParticipants((prev) => prev.filter((_, idx) => idx !== i));
	};

	const total = items.reduce(
		(sum, item) => sum + (Number(item.amount) || 0),
		0,
	);

	// ── Submit ────────────────────────────────────────────────────

	// We build a hidden form that holds the structured data as JSON
	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate
		const validItems = items.filter(
			(i) => i.name.trim() && Number(i.amount) > 0,
		);
		const validParticipants = participants.filter((p) => p.trim());
		if (validItems.length === 0) return;
		if (validParticipants.length === 0) return;

		const form = e.currentTarget;
		const hiddenItems = form.querySelector<HTMLInputElement>("#items-json");
		const hiddenParticipants =
			form.querySelector<HTMLInputElement>("#participants-json");
		const hiddenPayer = form.querySelector<HTMLInputElement>("#payer-hidden");

		if (hiddenItems) hiddenItems.value = JSON.stringify(validItems);
		if (hiddenParticipants)
			hiddenParticipants.value = JSON.stringify(validParticipants);
		if (hiddenPayer) hiddenPayer.value = payer;

		(form as HTMLFormElement).requestSubmit();
	};

	return (
		<form
			action="/api/create-split"
			method="POST"
			className="flex flex-col gap-4"
			onSubmit={handleSubmit}
		>
			{/* Hidden fields for structured data */}
			<input id="items-json" name="items" type="hidden" value="" />
			<input
				id="participants-json"
				name="participants"
				type="hidden"
				value=""
			/>
			<input id="payer-hidden" name="payer" type="hidden" value="" />

			{/* Restaurant name */}
			<Card size="sm">
				<CardContent className="flex flex-col gap-2">
					<label className="text-xs font-medium text-muted-foreground">
						Газар / Ресторан
					</label>
					<Input
						name="title"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						placeholder="Жишээ: Хангай Ресторан"
						required
					/>
					<Input
						name="date"
						type="date"
						defaultValue={new Date().toISOString().split("T")[0]}
						className="mt-1"
					/>
				</CardContent>
			</Card>

			{/* Items */}
			<div>
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs font-medium text-muted-foreground">Зүйлс</p>
					<Button type="button" variant="ghost" size="xs" onClick={addItem}>
						<PlusIcon data-icon="inline-start" />
						Нэмэх
					</Button>
				</div>

				<div className="flex flex-col gap-2">
					{items.map((item, i) => (
						<Card key={i} size="sm" className="relative">
							<CardContent className="flex flex-col gap-2">
								<div className="flex items-center gap-2">
									<Input
										value={item.name}
										onChange={(e) => updateItem(i, "name", e.target.value)}
										placeholder="Зүйлийн нэр"
										className="flex-1"
										required
									/>
									<Input
										type="number"
										min={0}
										value={item.amount || ""}
										onChange={(e) =>
											updateItem(i, "amount", Number(e.target.value))
										}
										placeholder="0₮"
										className="w-24 text-right"
										required
									/>
									{items.length > 1 && (
										<button
											type="button"
											onClick={() => removeItem(i)}
											className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
										>
											<Trash2Icon className="size-3.5" />
										</button>
									)}
								</div>

								{/* Tag selector */}
								<div className="flex flex-wrap gap-1.5">
									{TAG_OPTIONS.map((opt) => (
										<button
											key={opt.value}
											type="button"
											onClick={() => updateItem(i, "tag", opt.value)}
											className={`rounded-full px-2.5 py-0.5 text-xs transition-colors ${
												item.tag === opt.value
													? "bg-primary text-primary-foreground"
													: "bg-muted text-muted-foreground hover:bg-muted/80"
											}`}
										>
											{opt.label}
										</button>
									))}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</div>

			{/* Participants */}
			<div>
				<div className="mb-2 flex items-center justify-between">
					<p className="text-xs font-medium text-muted-foreground">Хүмүүс</p>
					<Button
						type="button"
						variant="ghost"
						size="xs"
						onClick={addParticipant}
					>
						<PlusIcon data-icon="inline-start" />
						Нэмэх
					</Button>
				</div>

				<Card size="sm">
					<CardContent className="flex flex-col gap-2">
						{participants.map((p, i) => (
							<div key={i} className="flex items-center gap-2">
								<Input
									value={p}
									onChange={(e) => updateParticipant(i, e.target.value)}
									placeholder={`Хүн ${i + 1}`}
									className="flex-1"
									required
								/>
								{p === payer && (
									<Badge variant="secondary" className="shrink-0">
										Төлөгч
									</Badge>
								)}
								{p !== payer && participants.length > 1 && (
									<button
										type="button"
										onClick={() => {
											setPayer(p);
										}}
										className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
									>
										Төлөгч болгох
									</button>
								)}
								{participants.length > 1 && (
									<button
										type="button"
										onClick={() => removeParticipant(i)}
										className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2Icon className="size-3.5" />
									</button>
								)}
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<Separator />

			{/* Total row */}
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">НИЙТ</span>
				<span className="font-heading text-xl font-bold">
					{total.toLocaleString()}₮
				</span>
			</div>

			<Separator />

			{/* Submit */}
			<div className="flex gap-3">
				<Button type="submit" className="flex-1" size="lg">
					📨 Хуваалцах
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="flex-1"
					onClick={() => {
						const valid = participants.filter((p) => p.trim());
						if (valid.length < 2) return;
						setEqualSplitOpen(true);
					}}
				>
					⚡ Тэнцүү хуваах
				</Button>

				<Dialog
					open={equalSplitOpen}
					onOpenChange={(open) => {
						setEqualSplitOpen(open);
						if (!open) setEqualSplitAmount("");
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Тэнцүү хуваах</DialogTitle>
						</DialogHeader>
						<div className="flex flex-col gap-3">
							<p className="text-sm text-muted-foreground">
								Нийт дүнгээ оруулаад &ldquo;Хуваах&rdquo; дарна уу.
								{participants.filter((p) => p.trim()).length} хүнд тэнцүү
								хуваагдана.
							</p>
							<input
								type="number"
								className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
								placeholder="Нийт дүн"
								value={equalSplitAmount}
								onChange={(e) => setEqualSplitAmount(e.target.value)}
								autoFocus
							/>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setEqualSplitOpen(false);
										setEqualSplitAmount("");
									}}
								>
									Буцах
								</Button>
								<Button
									size="sm"
									onClick={() => {
										const valid = participants.filter((p) => p.trim());
										const total = Number(equalSplitAmount);
										if (!total || total <= 0) return;
										const per = Math.floor(total / valid.length);
										const rem = total - per * valid.length;
										setItems(
											valid.map((name, i) => ({
												name: `${name} — тэнцүү хувь`,
												amount: i === 0 ? per + rem : per,
												tag: "individual" as ItemTag,
											})),
										);
										setEqualSplitOpen(false);
										setEqualSplitAmount("");
									}}
								>
									Хуваах
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</form>
	);
}
