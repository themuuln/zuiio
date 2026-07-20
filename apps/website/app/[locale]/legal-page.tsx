import { getTranslations } from "next-intl/server";
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

export async function LegalPage(document: LegalDocument) {
  const t = await getTranslations("LegalPage");
  const quickLinksLabel = t("quick-links");
  const lastUpdatedLabel = t("last-updated");
  const contactTitle = t("contact-title");
  const contactBody = t("contact-body");
  const contactLabel = t("contact-label");

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[minmax(0,1fr)_18rem] md:py-24">
      <article className="min-w-0">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {document.eyebrow}
        </div>
        <h1
          className="mb-2 text-3xl font-semibold tracking-tight md:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {document.title}
        </h1>
        <p className="mb-12 max-w-2xl text-lg text-muted-foreground">
          {document.description}
        </p>
        <div className="mb-12 text-xs text-muted-foreground">
          {lastUpdatedLabel}:{" "}
          <time dateTime={document.lastUpdated}>{document.lastUpdated}</time>
        </div>
        {document.sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="mb-12 scroll-mt-24"
          >
            <h2 className="mb-4 text-xl font-semibold tracking-tight">
              {section.title}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="mb-4 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="mb-4 list-disc space-y-2 pl-6 text-muted-foreground">
                {section.bullets.map((b, i) => (
                  <li key={i} className="leading-relaxed">
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </article>

      <aside className="md:sticky md:top-24 md:self-start">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold">{quickLinksLabel}</h3>
          <nav aria-label={quickLinksLabel}>
            <ul className="space-y-2">
              {document.sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`#${section.id}`}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {section.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-1 text-sm font-semibold">{contactTitle}</p>
            <p className="mb-3 text-sm text-muted-foreground">{contactBody}</p>
            <Link
              href="mailto:legal@zuiio.com"
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {contactLabel}
            </Link>
          </div>
        </div>
      </aside>
    </section>
  );
}
