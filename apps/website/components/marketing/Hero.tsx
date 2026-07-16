import Link from "next/link";
import { cn } from "@/lib/utils";

interface HeroProps {
	title: string;
	subtitle: string;
	eyebrow?: string;
	cta?: { label: string; href: string };
	secondaryCta?: { label: string; href: string };
	className?: string;
	gutters?: boolean;
}

export function Hero({
	title,
	subtitle,
	eyebrow,
	cta,
	secondaryCta,
	className,
	gutters = true,
}: HeroProps) {
	return (
		<section
			className={cn(
				"relative isolate overflow-hidden",
				gutters && "px-6",
				className,
			)}
			aria-labelledby={eyebrow ? undefined : "hero-heading"}
		>
			<div
				className="pointer-events-none absolute -inset-32 -z-10 opacity-40 dark:opacity-20"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% -20%, oklch(0.5 0.26 275 / 0.15), transparent), radial-gradient(ellipse 60% 50% at 80% 80%, oklch(0.7 0.16 195 / 0.1), transparent)",
				}}
				aria-hidden="true"
			/>
			<div className="mx-auto flex max-w-4xl flex-col items-center py-24 text-center md:py-40">
				<div className="animate-fade-in mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
					<span
						className="inline-block h-2 w-2 rounded-full"
						style={{ backgroundColor: "var(--brand-teal)" }}
						aria-hidden="true"
					/>
					{eyebrow}
				</div>
				<div className="animate-fade-in mt-3 text-xs font-medium tracking-wide text-muted-foreground/70">
					Монголд бүтээсэн · Ulaanbaatar
				</div>
				<h1
					id="hero-heading"
					className="animate-fade-up text-4xl font-semibold leading-tight tracking-tight md:text-6xl lg:text-7xl text-balance"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{title}
				</h1>
				<p
					className="animate-fade-up mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
					style={{ animationDelay: "100ms" }}
				>
					{subtitle}
				</p>
				{(cta || secondaryCta) && (
					<div
						className="animate-fade-up mt-10 flex flex-wrap items-center gap-4"
						style={{ animationDelay: "200ms" }}
					>
						{cta && (
							<Link href={cta.href} className="btn-primary">
								{cta.label}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									aria-hidden="true"
								>
									<path d="M5 12h14" />
									<path d="m12 5 7 7-7 7" />
								</svg>
							</Link>
						)}
						{secondaryCta && (
							<Link href={secondaryCta.href} className="btn-secondary">
								{secondaryCta.label}
							</Link>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
