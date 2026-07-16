import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/lib/i18n/routing";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

type Props = {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}
	setRequestLocale(locale);

	const messages = await getMessages();
	return (

		<ThemeProvider>
			<NextIntlClientProvider locale={locale} messages={messages}>
				<a href="#main-content" className="skip-to-content">
					Skip to content
				</a>
				<Header />
				<main id="main-content" className="flex-1">
					{children}
				</main>
				<Footer />
			</NextIntlClientProvider>
		</ThemeProvider>
	);
}
