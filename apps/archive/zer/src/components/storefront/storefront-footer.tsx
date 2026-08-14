import {
  Clock,
  Envelope,
  FacebookLogo,
  Globe,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  TiktokLogo,
  XLogo,
  YoutubeLogo,
} from "@phosphor-icons/react/dist/ssr";

const SOCIAL_ICONS = {
  facebook: FacebookLogo,
  instagram: InstagramLogo,
  twitter: XLogo,
  youtube: YoutubeLogo,
  tiktok: TiktokLogo,
  linkedin: LinkedinLogo,
} as const;

const DAY_LABELS: Record<string, string> = {
  Monday: "Даваа",
  Tuesday: "Мягмар",
  Wednesday: "Лхагва",
  Thursday: "Пүрэв",
  Friday: "Баасан",
  Saturday: "Бямба",
  Sunday: "Ням",
};

export type StorefrontFooterData = {
  name: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  websiteUrl: string | null;
  socialLinks: Record<string, string> | null;
  businessHours: Record<string, string> | null;
};

/**
 * Storefront footer — org info, contact, hours, social links and the
 * platform credit line. Rendered by the `[slug]` layout on every storefront
 * page (benchmarked against shop.mn / kom.mn storefront footers, 2026-08-13 —
 * docs/competitive-analysis.md §14). Server component: no client state.
 */
export function StorefrontFooter({ data }: { data: StorefrontFooterData }) {
  const {
    name,
    description,
    contactEmail,
    contactPhone,
    address,
    websiteUrl,
    socialLinks,
    businessHours,
  } = data;

  const socialEntries = Object.entries(socialLinks ?? {}).filter(
    ([, url]) => !!url,
  );
  const hoursEntries = Object.entries(businessHours ?? {});

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Org info */}
          <div className="space-y-3">
            <p className="text-base font-semibold tracking-tight">
              {name ?? ""}
            </p>
            {description && (
              <p className="line-clamp-4 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          {/* Contact */}
          {(contactEmail || contactPhone || address || websiteUrl) && (
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Холбоо барих
              </p>
              <ul className="space-y-2.5 text-sm">
                {contactPhone && (
                  <li className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${contactPhone.replace(/\s/g, "")}`}
                      className="hover:text-primary"
                    >
                      {contactPhone}
                    </a>
                  </li>
                )}
                {contactEmail && (
                  <li className="flex items-start gap-2.5">
                    <Envelope className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${contactEmail}`}
                      className="break-all hover:text-primary"
                    >
                      {contactEmail}
                    </a>
                  </li>
                )}
                {address && (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <span>{address}</span>
                  </li>
                )}
                {websiteUrl && (
                  <li className="flex items-start gap-2.5">
                    <Globe className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all hover:text-primary"
                    >
                      {websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Business hours */}
          {hoursEntries.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Ажлын цаг
              </p>
              <ul className="space-y-1.5 text-sm">
                {hoursEntries.map(([day, hours]) => (
                  <li key={day} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-3.5" />
                      {DAY_LABELS[day] ?? day}
                    </span>
                    <span className="tabular-nums">{hours}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Socials + platform credit */}
          <div className="space-y-3">
            {socialEntries.length > 0 && (
              <>
                <p className="text-sm font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  Сошиал
                </p>
                <div className="flex flex-wrap gap-2">
                  {socialEntries.map(([platform, url]) => {
                    const Icon =
                      SOCIAL_ICONS[platform as keyof typeof SOCIAL_ICONS];
                    if (!Icon) return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={platform}
                        className="inline-flex size-9 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <Icon className="size-4" />
                      </a>
                    );
                  })}
                </div>
              </>
            )}
            <p className="pt-1 text-xs text-muted-foreground">
              Zer ERP дэмждэг
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-5 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {name ?? "Zer"}
          </p>
          <p>Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
