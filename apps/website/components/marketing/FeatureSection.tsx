import { cn } from "@/lib/utils";

interface FeatureSectionProps {
	title: string;
	description: string;
	features: { title: string; description: string }[];
	className?: string;
}

const icons = [
	<svg
		key="0"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
		<path d="M12 6v12" />
		<path d="M8 12h8" />
		<circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3" />
	</svg>,
	<svg
		key="1"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
		<line x1="2" y1="2" x2="22" y2="22" />
	</svg>,
	<svg
		key="2"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M19.4 10.4a3.5 3.5 0 0 0-3.4-5.4A5 5 0 0 0 6 7c0 .9.2 1.7.6 2.4A3.5 3.5 0 0 0 7 14h12a3 3 0 0 0 0-6h-1.5" />
		<path d="M15 22v-4" />
		<path d="M9 22v-4" />
		<path d="M9 14v-2" />
		<path d="M12 14v-2" />
		<path d="M15 14v-2" />
	</svg>,
	<svg
		key="3"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
		<path d="M7 7h.01" />
	</svg>,
	<svg
		key="4"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<circle cx="12" cy="12" r="10" />
		<path d="M2 12h20" />
		<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
	</svg>,
	<svg
		key="5"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		aria-hidden="true"
	>
		<path d="M22 12h-4l-3 9L9 3l-3 9H2" />
	</svg>,
];

export function FeatureSection({
	title,
	description,
	features,
	className,
}: FeatureSectionProps) {
	return (
		<section className={cn("mx-auto max-w-6xl px-6 py-20 md:py-28", className)}>
			<div className="mx-auto max-w-2xl text-center">
				<h2
					className="text-3xl font-semibold tracking-tight md:text-4xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{title}
				</h2>
				<p className="mt-4 text-lg text-muted-foreground">{description}</p>
			</div>

			<div className="mt-16 grid gap-5 md:grid-cols-3 md:grid-rows-3">
				{/* Feature 0 — hero cell spans 2 cols */}
				<div className="bento-cell col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center p-8">
					<div
						className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
						style={{
							backgroundColor: "var(--brand-violet-glow)",
							color: "var(--color-primary)",
						}}
					>
						{icons[0]}
					</div>
					<h3 className="text-xl font-semibold md:text-2xl">
						{features[0]?.title}
					</h3>
					<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
						{features[0]?.description}
					</p>
				</div>
				{/* Feature 1 */}
				<div className="bento-cell flex flex-col justify-center p-6">
					<div
						className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
						style={{
							backgroundColor: "var(--brand-teal-glow)",
							color: "var(--brand-teal)",
						}}
					>
						{icons[1]}
					</div>
					<h3 className="text-base font-semibold">{features[1]?.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{features[1]?.description}
					</p>
				</div>
				{/* Feature 2 */}
				<div className="bento-cell flex flex-col justify-center p-6">
					<div
						className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
						style={{
							backgroundColor: "var(--brand-violet-glow)",
							color: "var(--color-primary)",
						}}
					>
						{icons[2]}
					</div>
					<h3 className="text-base font-semibold">{features[2]?.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{features[2]?.description}
					</p>
				</div>
				{/* Feature 3 */}
				<div className="bento-cell flex flex-col justify-center p-6">
					<div
						className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
						style={{
							backgroundColor: "var(--brand-teal-glow)",
							color: "var(--brand-teal)",
						}}
					>
						{icons[3]}
					</div>
					<h3 className="text-base font-semibold">{features[3]?.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{features[3]?.description}
					</p>
				</div>
				{/* Feature 4 */}
				<div className="bento-cell flex flex-col justify-center p-6">
					<div
						className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
						style={{
							backgroundColor: "var(--brand-violet-glow)",
							color: "var(--color-primary)",
						}}
					>
						{icons[4]}
					</div>
					<h3 className="text-base font-semibold">{features[4]?.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{features[4]?.description}
					</p>
				</div>
				{/* Feature 5 */}
				<div className="bento-cell flex flex-col justify-center p-6">
					<div
						className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
						style={{
							backgroundColor: "var(--brand-teal-glow)",
							color: "var(--brand-teal)",
						}}
					>
						{icons[5]}
					</div>
					<h3 className="text-base font-semibold">{features[5]?.title}</h3>
					<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
						{features[5]?.description}
					</p>
				</div>
			</div>
		</section>
	);
}
