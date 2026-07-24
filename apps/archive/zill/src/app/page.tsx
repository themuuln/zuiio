import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getName, setName, clearName } from "./actions";
import { getAllSplits } from "@/lib/db";

// ── Main page (server component) ──────────────────────────────────

export default async function Home() {
	const name = await getName();

	return (
		<div className="flex min-h-full flex-1 flex-col">
			{name ? <HomeScreen name={name} /> : <Onboarding />}
		</div>
	);
}

// ── Onboarding: no cookie ──────────────────────────────────────────

function Onboarding() {
	return (
		<main className="flex flex-1 items-center justify-center px-6">
			<div className="w-full max-w-sm space-y-8">
				{/* Logo */}
				<div className="space-y-1 text-center">
					<h1 className="font-heading text-5xl font-bold tracking-tight">
						zill
					</h1>
					<p className="text-muted-foreground">Сарлагаа хялбар хуваа</p>
				</div>

				<Card className="py-6">
					<CardContent>
						<form action={setName} className="flex flex-col gap-4">
							<label
								htmlFor="name"
								className="text-sm font-medium text-muted-foreground"
							>
								Таны нэр
							</label>
							<Input
								id="name"
								name="name"
								type="text"
								required
								autoFocus
								placeholder="Жишээ: Оюунаа"
							/>
							<Button type="submit" className="w-full">
								Эхлэх
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}

// ── Home screen: cookie present ────────────────────────────────────

async function HomeScreen({ name }: { name: string }) {
	const initial = name.charAt(0).toUpperCase();
	const splits = await getAllSplits();

	return (
		<main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Avatar>
						<AvatarFallback>{initial}</AvatarFallback>
					</Avatar>
					<div>
						<h1 className="font-heading text-xl font-semibold">zill</h1>
						<p className="text-sm text-muted-foreground">Сайн уу, {name} 👋</p>
					</div>
				</div>
				<form action={clearName}>
					<Button type="submit" variant="ghost" size="sm">
						Гарах
					</Button>
				</form>
			</div>

			<Separator className="my-6" />

			{/* Quick actions */}
			<div className="flex flex-col gap-3">
				<Link href="/split/new" className="block">
					<ActionItem
						emoji="🧾"
						title="Шинэ сарлага"
						description="Баримтаа зургаа авахуулж хуваа"
					/>
				</Link>
				<ActionItem
					emoji="⚡"
					title="Тэнцүү хуваах"
					description="Нийт дүнгээ оруулаад хурдан хуваа"
				/>
				<ActionItem
					emoji="💸"
					title="Өр тэмдэглэх"
					description="Нэг хүн, нэг дүн"
				/>
			</div>

			<Separator className="my-6" />

			{/* Active splits */}
			<div>
				<div className="mb-3 flex items-center gap-2">
					<h2 className="text-sm font-medium text-muted-foreground">
						Идэвхтэй сарлагууд
					</h2>
					<Badge variant="secondary">{splits.length}</Badge>
				</div>

				{splits.length === 0 ? (
					<Card size="sm">
						<CardContent>
							<p className="py-6 text-center text-sm text-muted-foreground">
								Одоогоор идэвхтэй сарлага байхгүй
							</p>
						</CardContent>
					</Card>
				) : (
					<div className="flex flex-col gap-2">
						{splits.map(
							(s: {
								id: string;
								title: string;
								items: { amount: number }[];
								participants: { name: string }[];
								date: string;
							}) => (
								<Link key={s.id} href={`/split/${s.id}`} className="block">
									<SplitCard
										title={s.title}
										total={s.items.reduce(
											(sum: number, i: { amount: number }) => sum + i.amount,
											0,
										)}
										participantCount={s.participants.length}
										date={s.date}
									/>
								</Link>
							),
						)}
					</div>
				)}
			</div>
		</main>
	);
}

// ── Action item card ──────────────────────────────────────────────

function ActionItem({
	emoji,
	title,
	description,
}: {
	emoji: string;
	title: string;
	description: string;
}) {
	return (
		<div className="flex w-full cursor-pointer items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted active:scale-[0.99]">
			<span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
				{emoji}
			</span>
			<div className="min-w-0">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-xs text-muted-foreground">{description}</p>
			</div>
		</div>
	);
}

function SplitCard({
	title,
	total,
	participantCount,
	date,
}: {
	title: string;
	total: number;
	participantCount: number;
	date: string;
}) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted">
			<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
				🧾
			</span>
			<div className="min-w-0 flex-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-xs text-muted-foreground">
					{date} · {participantCount} хүн
				</p>
			</div>
			<span className="shrink-0 font-heading text-base font-semibold tabular-nums">
				{total.toLocaleString()}₮
			</span>
		</div>
	);
}
