import { Link } from "@/lib/i18n/navigation";

export interface LegalSection {
	id: string;
	title: string;
	paragraphs: string[];
	bullets?: string[];
}

export interface LegalDocument {
	eyebrow: string;
	title: string;
	description: string;
	lastUpdated: string;
	sections: LegalSection[];
}

export function resolveLocale(locale: string): "en" | "mn" {
	return locale === "en" ? "en" : "mn";
}

interface LegalPageProps extends LegalDocument {
	locale: string;
}

export function LegalPage({
	locale,
	eyebrow,
	title,
	description,
	lastUpdated,
	sections,
}: LegalPageProps) {
	const currentLocale = resolveLocale(locale);
	const quickLinksLabel = currentLocale === "en" ? "On this page" : "Энэ хуудсанд";
	const lastUpdatedLabel = currentLocale === "en" ? "Last updated" : "Сүүлд шинэчилсэн";
	const contactTitle = currentLocale === "en" ? "Questions about these terms?" : "Эдгээр нөхцөлийн талаар асуух зүйл байна уу?";
	const contactBody =
		currentLocale === "en"
			? "Email us and include the product, workspace, or chatbot conversation you are asking about."
			: "Бидэнд имэйл илгээхдээ асууж буй бүтээгдэхүүн, workspace эсвэл чатботын харилцан яриаг дурдана уу.";
	const contactLabel = currentLocale === "en" ? "Contact Zuiio" : "Zuiio-той холбогдох";

	return (
		<section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_18rem] md:py-24">
			<article className="min-w-0">
				<p className="mb-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					{eyebrow}
				</p>
				<h1
					className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{title}
				</h1>
				<p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
					{description}
				</p>
				<p className="mt-6 text-sm font-medium text-muted-foreground">
					{lastUpdatedLabel}: <time dateTime="2026-07-07">{lastUpdated}</time>
				</p>

				<div className="mt-12 space-y-10 rounded-2xl border border-border bg-card p-6 md:p-10">
					{sections.map((section) => (
						<section key={section.id} id={section.id} className="scroll-mt-24">
							<h2
								className="text-2xl font-semibold tracking-tight"
								style={{ fontFamily: "var(--font-display)" }}
							>
								{section.title}
							</h2>
							<div className="mt-4 space-y-4 text-base leading-7 text-muted-foreground">
								{section.paragraphs.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
								{section.bullets && (
									<ul className="ml-5 list-disc space-y-2 marker:text-primary">
										{section.bullets.map((bullet) => (
											<li key={bullet}>{bullet}</li>
										))}
									</ul>
								)}
							</div>
						</section>
					))}
				</div>
			</article>

			<aside className="md:sticky md:top-24 md:self-start">
				<nav
					aria-label={quickLinksLabel}
					className="rounded-2xl border border-border bg-card p-5 shadow-sm"
				>
					<h2 className="text-sm font-semibold text-foreground">{quickLinksLabel}</h2>
					<ul className="mt-4 space-y-2">
						{sections.map((section) => (
							<li key={section.id}>
								<a
									href={`#${section.id}`}
									className="block rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:bg-muted"
								>
									{section.title}
								</a>
							</li>
						))}
					</ul>
				</nav>

				<div className="mt-5 rounded-2xl border border-border bg-background p-5">
					<h2 className="text-sm font-semibold text-foreground">{contactTitle}</h2>
					<p className="mt-2 text-sm leading-6 text-muted-foreground">{contactBody}</p>
					<a href="mailto:sales@zuiio.com" className="btn-secondary mt-4 w-full justify-center">
						{contactLabel}
					</a>
				</div>

				<div className="mt-5 grid gap-2 text-sm">
					<Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
						{currentLocale === "en" ? "Privacy Policy" : "Нууцлалын бодлого"}
					</Link>
					<Link href="/terms" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
						{currentLocale === "en" ? "Terms of Service" : "Үйлчилгээний нөхцөл"}
					</Link>
					<Link href="/data-deletion" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
						{currentLocale === "en" ? "Data Deletion" : "Өгөгдөл устгах"}
					</Link>
				</div>
			</aside>
		</section>
	);
}
