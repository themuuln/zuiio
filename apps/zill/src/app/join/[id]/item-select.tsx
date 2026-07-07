"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SplitItem {
	id: string;
	name: string;
	amount: number;
	tag: "shared" | "individual" | "alcohol" | "service";
}

interface ItemSelectProps {
	splitId: string;
	title: string;
	date: string;
	payer: string;
	participantName: string;
	items: SplitItem[];
	savedSelection: string[];
	isConfirmed: boolean;
	isSaved: boolean;
	privacyMode: "private" | "open";
	confirmedCount: number;
	participantCount: number;
}

export function ItemSelect({
	splitId,
	title,
	date,
	payer,
	participantName,
	items,
	savedSelection,
	isConfirmed,
	isSaved,
	privacyMode,
	confirmedCount,
	participantCount,
}: ItemSelectProps) {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(
		new Set(savedSelection.length > 0 ? savedSelection : getDefaults(items)),
	);
	const [saving, setSaving] = useState(false);

	const toggleItem = (id: string, tag: string) => {
		if (isConfirmed || tag === "service") return;
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	// Live calculation: for shared items, divide by total participants
	// For individual items, full amount. Service always split.
	const { myTotal, serviceAmount, sharedCount } = useMemo(() => {
		let total = 0;
		let svc = 0;
		let sc = 0;
		for (const item of items) {
			if (!selectedIds.has(item.id)) continue;
			if (item.tag === "service") {
				total += item.amount / participantCount;
				svc += item.amount / participantCount;
			} else if (item.tag === "shared") {
				total += item.amount / participantCount;
				sc++;
			} else {
				total += item.amount;
			}
		}
		return { myTotal: total, serviceAmount: svc, sharedCount: sc };
	}, [items, selectedIds, participantCount]);

	const handleSave = async () => {
		setSaving(true);
		const form = new FormData();
		form.append("splitId", splitId);
		form.append("name", participantName);
		form.append("items", JSON.stringify(Array.from(selectedIds)));
		await fetch("/api/save-selection", { method: "POST", body: form });

		// Follow redirect
		window.location.href = `/join/${splitId}?as=${encodeURIComponent(participantName)}`;
	};

	const handleConfirm = async () => {
		setSaving(true);
		// First save, then confirm
		const saveForm = new FormData();
		saveForm.append("splitId", splitId);
		saveForm.append("name", participantName);
		saveForm.append("items", JSON.stringify(Array.from(selectedIds)));
		await fetch("/api/save-selection", { method: "POST", body: saveForm });

		const confirmForm = new FormData();
		confirmForm.append("splitId", splitId);
		confirmForm.append("name", participantName);
		await fetch("/api/confirm-selection", {
			method: "POST",
			body: confirmForm,
		});

		window.location.href = `/join/${splitId}?as=${encodeURIComponent(participantName)}`;
	};

	// ── Confirmed state ─────────────────────────────────────────────

	if (isConfirmed) {
		return (
			<div className="flex flex-col gap-6">
				<ConfirmedView
					title={title}
					date={date}
					payer={payer}
					participantName={participantName}
					items={items}
					selectedIds={selectedIds}
					myTotal={myTotal}
					privacyMode={privacyMode}
					confirmedCount={confirmedCount}
					participantCount={participantCount}
				/>
			</div>
		);
	}

	// ── Saved state (not yet confirmed) ──────────────────────────────

	if (isSaved) {
		return (
			<div className="flex flex-col gap-6">
				<SavedView
					title={title}
					participantName={participantName}
					items={items}
					selectedIds={selectedIds}
					myTotal={myTotal}
					confirmedCount={confirmedCount}
					participantCount={participantCount}
					onConfirm={handleConfirm}
					saving={saving}
				/>
			</div>
		);
	}

	// ── Selection state ────────────────────────────────────────────

	return (
		<div className="flex flex-col gap-6">
			{/* Header */}
			<div>
				<div className="flex items-center gap-2">
					<h1 className="font-heading text-lg font-semibold">{title}</h1>
					<Badge variant="outline" className="text-[10px]">
						Та төлөгч биш
					</Badge>
				</div>
				<p className="text-sm text-muted-foreground">
					Сайн уу, {participantName} 👋 · {date}
				</p>
			</div>

			<Separator />

			<p className="text-sm font-medium">Чи юу идсэнээ сонго:</p>

			{/* Items */}
			<div className="flex flex-col gap-1.5">
				{items.map((item) => {
					const isSelected = selectedIds.has(item.id);
					const isLocked = item.tag === "service";
					const isGrayed = item.tag === "alcohol";

					return (
						<button
							key={item.id}
							type="button"
							disabled={isConfirmed}
							onClick={() => toggleItem(item.id, item.tag)}
							className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
								isSelected
									? "border-primary/30 bg-primary/5"
									: "border-border bg-card"
							} ${isGrayed && !isSelected ? "opacity-50" : ""}`}
						>
							{/* Checkbox */}
							<span
								className={`flex size-5 shrink-0 items-center justify-center rounded-md border text-xs ${
									isLocked
										? "border-muted-foreground/30 bg-muted text-muted-foreground"
										: isSelected
											? "border-primary bg-primary text-primary-foreground"
											: "border-border"
								}`}
							>
								{isLocked ? "🔒" : isSelected ? "✓" : ""}
							</span>

							{/* Info */}
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-1.5">
									<span className="text-sm font-medium">{item.name}</span>
									<ItemTagBadge tag={item.tag} />
								</div>
								<p className="text-xs text-muted-foreground">
									{item.tag === "shared"
										? `${(item.amount / participantCount).toLocaleString()}₮/хүн`
										: item.tag === "service"
											? `${(item.amount / participantCount).toLocaleString()}₮/хүн (заавал)`
											: `${item.amount.toLocaleString()}₮`}
								</p>
							</div>

							<span className="shrink-0 text-sm font-medium tabular-nums">
								{item.amount.toLocaleString()}₮
							</span>
						</button>
					);
				})}
			</div>

			<Separator />

			{/* Live total */}
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Таны дүн (ойролцоо)</span>
				<span className="font-heading text-xl font-bold">
					{Math.round(myTotal).toLocaleString()}₮
				</span>
			</div>

			{/* Breakdown */}
			<div className="flex flex-col gap-1 text-xs text-muted-foreground">
				{sharedCount > 0 && <p>Хуваалцах зүйлс: {sharedCount} төрөл</p>}
				{serviceAmount > 0 && (
					<p>Үйлчилгээ: +{Math.round(serviceAmount).toLocaleString()}₮</p>
				)}
				{sharedCount > 0 && (
					<p className="text-[10px] text-muted-foreground/60">
						* Хуваалцах зүйлсийн дүн хэдэн хүн сонгосноор өөрчлөгдөнө
					</p>
				)}
			</div>

			<Separator />

			{/* Actions */}
			<div className="flex flex-col gap-2">
				<Button
					className="w-full"
					size="lg"
					onClick={handleConfirm}
					disabled={saving}
				>
					{saving ? "Хадгалж байна..." : "✅ Баталгаажуулах"}
				</Button>
				<Button
					variant="outline"
					className="w-full"
					size="lg"
					onClick={handleSave}
					disabled={saving}
				>
					🧂 Хадгалах (дараа үргэлжлүүлэх)
				</Button>
			</div>

			{/* Privacy notice */}
			<Card size="sm">
				<CardContent>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span className="text-base">
							{privacyMode === "private" ? "🔒" : "👁"}
						</span>
						<span>
							{privacyMode === "private"
								? "Сонголтууд нууц. Бүгд баталгаажуулсны дараа дүн гарна."
								: "Сонголтууд нээлттэй. Бусад хүмүүс харж байгаа."}
						</span>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ── Saved view (needs confirm) ─────────────────────────────────────

function SavedView({
	title,
	participantName,
	items,
	selectedIds,
	myTotal,
	confirmedCount,
	participantCount,
	onConfirm,
	saving,
}: {
	title: string;
	participantName: string;
	items: SplitItem[];
	selectedIds: Set<string>;
	myTotal: number;
	confirmedCount: number;
	participantCount: number;
	onConfirm: () => void;
	saving: boolean;
}) {
	const selectedItems = items.filter((i) => selectedIds.has(i.id));

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-heading text-lg font-semibold">{title}</h1>
				<p className="text-sm text-muted-foreground">
					{participantName} — хадгалсан ✅
				</p>
			</div>

			<Separator />

			<div className="flex items-center gap-2">
				<span className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
					🧂
				</span>
				<div>
					<p className="text-sm font-medium">Танд хадгалагдсан</p>
					<p className="text-xs text-muted-foreground">
						Баталгаажуулаагүй байна. Дараа үргэлжлүүлэх боломжтой.
					</p>
				</div>
			</div>

			<Card size="sm">
				<CardContent className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground">
						Миний сонголт
					</p>
					{selectedItems.map((item) => (
						<div key={item.id} className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs">☑️</span>
								<span className="text-sm">{item.name}</span>
								<ItemTagBadge tag={item.tag} />
							</div>
							<span className="text-sm tabular-nums">
								{item.amount.toLocaleString()}₮
							</span>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Таны дүн</span>
				<span className="font-heading text-xl font-bold">
					{Math.round(myTotal).toLocaleString()}₮
				</span>
			</div>

			<div className="flex flex-col gap-2">
				<Button
					className="w-full"
					size="lg"
					onClick={onConfirm}
					disabled={saving}
				>
					{saving ? "Түр хүлээнэ үү..." : "✅ Баталгаажуулах"}
				</Button>
			</div>

			{/* Progress */}
			<Card size="sm">
				<CardContent>
					<div className="text-xs text-muted-foreground">
						{confirmedCount}/{participantCount} хүн баталгаажуулсан
					</div>
					<div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
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

// ── Confirmed view ────────────────────────────────────────────────

function ConfirmedView({
	title,
	date,
	payer,
	participantName,
	items,
	selectedIds,
	myTotal,
	privacyMode,
	confirmedCount,
	participantCount,
}: {
	title: string;
	date: string;
	payer: string;
	participantName: string;
	items: SplitItem[];
	selectedIds: Set<string>;
	myTotal: number;
	privacyMode: "private" | "open";
	confirmedCount: number;
	participantCount: number;
}) {
	const selectedItems = items.filter((i) => selectedIds.has(i.id));
	const allConfirmed = confirmedCount >= participantCount;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="font-heading text-lg font-semibold">{title}</h1>
				<p className="text-sm text-muted-foreground">
					{date} · Төлсөн: {payer}
				</p>
			</div>

			<Separator />

			<div className="flex items-center gap-2">
				<span className="flex size-8 items-center justify-center rounded-full bg-green-100 text-green-600">
					✅
				</span>
				<div>
					<p className="text-sm font-medium">
						Баталгаажуулсан, {participantName}
					</p>
					<p className="text-xs text-muted-foreground">
						{allConfirmed
							? "Бүгд баталгаажуулсан!"
							: `${confirmedCount}/${participantCount} хүн баталгаажуулсан`}
					</p>
				</div>
			</div>

			{/* Selected items summary */}
			<Card size="sm">
				<CardContent className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground">
						Миний сонголт
					</p>
					{selectedItems.map((item) => (
						<div key={item.id} className="flex items-center justify-between">
							<div className="flex items-center gap-1.5">
								<span className="text-xs">☑️</span>
								<span className="text-sm">{item.name}</span>
								<ItemTagBadge tag={item.tag} />
							</div>
							<span className="text-sm tabular-nums">
								{item.amount.toLocaleString()}₮
							</span>
						</div>
					))}
				</CardContent>
			</Card>

			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">Таны дүн</span>
				<span className="font-heading text-xl font-bold">
					{Math.round(myTotal).toLocaleString()}₮
				</span>
			</div>

			{/* Progress */}
			<Card size="sm">
				<CardContent>
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<span>
							{privacyMode === "private" ? "🔒" : "👁"}{" "}
							{privacyMode === "private"
								? "Бүгд баталгаажуулсны дараа дүн гарна"
								: "Сонголтууд нээлттэй"}
						</span>
					</div>
					<div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{
								width: `${(confirmedCount / participantCount) * 100}%`,
							}}
						/>
					</div>
					{allConfirmed ? (
						<p className="mt-2 text-center text-sm font-medium text-green-600">
							🎉 Бүгд бэлэн! Төлөгчийг хүлээж байна
						</p>
					) : (
						<p className="mt-2 text-center text-xs text-muted-foreground">
							{confirmedCount}/{participantCount} хүн баталгаажуулсан
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ── Helpers ───────────────────────────────────────────────────────

function getDefaults(items: SplitItem[]): string[] {
	return items
		.filter((i) => i.tag === "shared" || i.tag === "service")
		.map((i) => i.id);
}

function ItemTagBadge({ tag }: { tag: string }) {
	const labels: Record<string, string> = {
		shared: "хос",
		individual: "хувийн",
		alcohol: "архи",
		service: "үйлчилгээ",
	};
	return (
		<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
			{labels[tag] || tag}
		</span>
	);
}
