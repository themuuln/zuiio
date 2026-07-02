"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

function ArrowRightIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
		>
			<path d="M5 12h14" />
			<path d="m12 5 7 7-7 7" />
		</svg>
	);
}

function ZerIcon() {
	return (
		<svg
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden="true"
			className="h-10 w-10"
		>
			<rect
				x="8"
				y="6"
				width="32"
				height="36"
				rx="4"
				stroke="currentColor"
				strokeWidth="1.5"
				fill="none"
			/>
			<line
				x1="14"
				y1="16"
				x2="34"
				y2="16"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<line
				x1="14"
				y1="22"
				x2="28"
				y2="22"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<line
				x1="14"
				y1="28"
				x2="26"
				y2="28"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<circle cx="33" cy="28" r="6" fill="currentColor" opacity="0.15" />
			<text
				x="33"
				y="31"
				textAnchor="middle"
				fontSize="9"
				fontWeight="700"
				fill="currentColor"
			>
				₮
			</text>
		</svg>
	);
}

function TolomIcon() {
	return (
		<svg
			viewBox="0 0 48 48"
			fill="none"
			aria-hidden="true"
			className="h-10 w-10"
		>
			<circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="1.5" />
			<path
				d="M24 8v8M24 32v8M8 24h8M32 24h8"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
			<circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.15" />
			<circle cx="24" cy="24" r="5" stroke="currentColor" strokeWidth="1.5" />
		</svg>
	);
}

interface ProductCardProps {
	name: string;
	tagline: string;
	description: string;
	href: string;
	accent?: string;
	className?: string;
	variant?: "zer" | "tolom";
}

export function ProductCard({
	name,
	tagline,
	description,
	href,
	className,
	variant,
}: ProductCardProps) {
	const iconColor =
		variant === "zer" ? "var(--color-primary)" : "var(--brand-teal)";
	const badgeBg =
		variant === "zer" ? "var(--brand-violet-glow)" : "var(--brand-teal-glow)";

	return (
		<Link
			href={href}
			className={cn(
				"group relative flex flex-col rounded-2xl border border-border bg-card p-8 transition-all duration-250 ease-out hover:-translate-y-1 hover:shadow-card-hover",
				className,
			)}
		>
			<div
				className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
				style={{ backgroundColor: iconColor }}
				aria-hidden="true"
			/>
			<div className="mb-5 flex items-center gap-3">
				<div
					className="flex h-12 w-12 items-center justify-center rounded-xl"
					style={{ backgroundColor: badgeBg, color: iconColor }}
				>
					{variant === "zer" ? <ZerIcon /> : <TolomIcon />}
				</div>
				<span
					className="rounded-md px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
					style={{ backgroundColor: badgeBg, color: iconColor }}
				>
					{tagline}
				</span>
			</div>
			<h3
				className="text-2xl font-semibold tracking-tight"
				style={{ fontFamily: "var(--font-display)" }}
			>
				{name}
			</h3>
			<p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
			<div
				className="mt-6 flex items-center gap-1.5 text-sm font-medium transition-all duration-250 ease-out group-hover:gap-3"
				style={{ color: iconColor }}
			>
				Learn more{" "}
				<ArrowRightIcon className="transition-transform duration-250 ease-out group-hover:translate-x-0.5" />
			</div>
		</Link>
	);
}
