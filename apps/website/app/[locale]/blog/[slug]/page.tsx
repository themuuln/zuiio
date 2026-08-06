import { getTranslations, setRequestLocale } from "next-intl/server";
import ReactMarkdown from "react-markdown";
import { Link } from "@/lib/i18n/navigation";
import { SIGNUP_URL } from "@/lib/site";

const postSlugs = [
  "welcome-to-zuiio",
  "getting-started-with-zer",
  "why-mongolian-businesses-need-local-software",
];

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const postIndex = postSlugs.indexOf(slug);
  if (postIndex === -1) return { title: "Not Found" };
  const t = await getTranslations({ locale, namespace: "BlogPage" });
  return { title: t(`post-${postIndex + 1}-title`) };
}

function formatDate(date: string, locale: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return new Intl.DateTimeFormat(locale === "mn" ? "mn-MN" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsed);
}

const mdComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="pt-4 text-2xl font-semibold tracking-tight">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="pt-3 text-xl font-semibold tracking-tight">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-base leading-relaxed text-foreground/90">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc space-y-2 pl-6 text-foreground/90">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal space-y-2 pl-6 text-foreground/90">
      {children}
    </ol>
  ),
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a
      href={href}
      className="font-medium text-primary underline underline-offset-4"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
};

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BlogPage");

  const postIndex = postSlugs.indexOf(slug);

  if (postIndex === -1) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("post-not-found")}
        </h1>
        <Link href="/blog" className="btn-secondary mt-6 inline-flex">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          {t("back-to-blog")}
        </Link>
      </div>
    );
  }

  const i = postIndex + 1;
  const title = t(`post-${i}-title`);
  const content = t(`post-${i}-content`);
  const date = t(`post-${i}-date`);
  const author = t("author");

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/blog" className="btn-secondary inline-flex text-sm">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        {t("back-to-blog")}
      </Link>
      <h1
        className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h1>
      <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
        <time dateTime={date}>{formatDate(date, locale)}</time>
        <span aria-hidden="true">&middot;</span>
        <span>{author}</span>
      </div>
      <div className="mt-10 space-y-4">
        <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
      </div>
      <div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center">
        <h2
          className="text-2xl font-semibold tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("post-cta-title")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {t("post-cta-subtitle")}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <a href={SIGNUP_URL} className="btn-primary">
            {t("post-cta-button")}
          </a>
          <Link href="/pricing" className="btn-secondary">
            {t("post-cta-secondary")}
          </Link>
        </div>
      </div>
    </article>
  );
}
