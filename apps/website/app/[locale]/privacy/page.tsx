import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage, resolveLocale, type LegalDocument } from "../legal-page";

interface Props {
	params: Promise<{ locale: string }>;
}

const documents: Record<"en" | "mn", LegalDocument> = {
	en: {
		eyebrow: "Privacy Policy",
		title: "How Zuiio protects customer and chatbot data",
		description:
			"This policy explains what Zuiio collects, why we collect it, and how customers can access, correct, or delete data from Zuiio products and messaging integrations.",
		lastUpdated: "July 7, 2026",
		sections: [
			{
				id: "scope",
				title: "1. Scope",
				paragraphs: [
					"This Privacy Policy applies to Zuiio websites, Zer, Tolom, Zuiio-operated chatbots, customer support channels, and related services operated by Zuiio.",
					"When a customer connects a third-party platform such as Meta, Facebook, Instagram, Apple, or another messaging or app platform, that platform also processes information under its own privacy policy.",
				],
			},
			{
				id: "data-we-collect",
				title: "2. Information we collect",
				paragraphs: [
					"We collect only the information needed to provide Zuiio software and apps, customer support, security, billing, and messaging features.",
				],
				bullets: [
					"Account details such as name, email address, phone number, organization name, role, and language preference.",
					"Business data entered into Zuiio products, including inventory, sales, expenses, repair orders, vehicle records, customer records, supplier records, reports, and settings.",
					"Chatbot and support messages, including message content, sender identifiers provided by the messaging platform, timestamps, attachments, and conversation context needed to answer the request.",
					"Usage, device, and security data such as IP address, browser, operating system, approximate location, log events, and crash or diagnostic information.",
					"Payment and subscription information processed by our payment providers. We do not intentionally store full card numbers on our own servers.",
				],
			},
			{
				id: "how-we-use-data",
				title: "3. How we use information",
				paragraphs: [
					"We use information to operate Zuiio products, keep accounts secure, respond to support requests, improve reliability, and comply with legal and platform requirements.",
				],
				bullets: [
					"Provide, personalize, maintain, and improve Zer, Tolom, Zuiio websites, and chatbot services.",
					"Authenticate users, protect accounts, prevent fraud or abuse, and investigate security incidents.",
					"Respond to inquiries sent through email, website forms, or messaging channels.",
					"Send service notices, product updates, billing notices, and administrative messages.",
					"Analyze aggregated usage so we can improve performance, localization, and product quality.",
				],
			},
			{
				id: "sharing",
				title: "4. Sharing and processors",
				paragraphs: [
					"We do not sell customer business data or chatbot messages. We share information only when needed to provide the service, comply with law, protect rights and security, or complete a business transaction such as a merger or acquisition.",
					"Service providers may process data for hosting, storage, analytics, payments, email delivery, customer support, error monitoring, or messaging delivery. They may use the information only to perform services for Zuiio.",
				],
			},
			{
				id: "retention",
				title: "5. Retention",
				paragraphs: [
					"We keep information for as long as needed to provide the service, meet legal obligations, resolve disputes, enforce agreements, and maintain security. Customers may request deletion as described in our Data Deletion page.",
					"Backups and logs may take additional time to expire from secure systems, but we restrict access and do not use deleted information for new product activity.",
				],
			},
			{
				id: "rights",
				title: "6. Access, correction, and deletion",
				paragraphs: [
					"You may ask to access, correct, export, or delete personal information associated with your Zuiio account or chatbot interaction. We may need to verify your identity or authority before fulfilling a request.",
					"Workspace owners are responsible for responding to requests from their own employees, customers, suppliers, and repair-shop clients when that data is controlled by the workspace.",
				],
			},
			{
				id: "security",
				title: "7. Security",
				paragraphs: [
					"We use administrative, technical, and organizational safeguards designed to protect information against unauthorized access, loss, misuse, alteration, or disclosure. No system is perfectly secure, so customers should also protect passwords, devices, and workspace permissions.",
				],
			},
			{
				id: "children",
				title: "8. Children",
				paragraphs: [
					"Zuiio services are for businesses and are not directed to children. If you believe a child provided personal information to us, contact sales@zuiio.com so we can review and delete it where appropriate.",
				],
			},
			{
				id: "contact",
				title: "9. Contact",
				paragraphs: [
					"For privacy questions, data requests, or platform review inquiries, email sales@zuiio.com with the subject line “Privacy request.”",
				],
			},
		],
	},
	mn: {
		eyebrow: "Нууцлалын бодлого",
		title: "Zuiio хэрэглэгчийн болон чатботын өгөгдлийг хэрхэн хамгаалдаг вэ",
		description:
			"Энэхүү бодлого нь Zuiio ямар мэдээлэл цуглуулдаг, яагаад ашигладаг, мөн хэрэглэгч өөрийн өгөгдөлд хэрхэн хандах, засах, устгуулах боломжтойг тайлбарлана.",
		lastUpdated: "2026 оны 7 сарын 7",
		sections: [
			{
				id: "scope",
				title: "1. Хамрах хүрээ",
				paragraphs: [
					"Энэхүү Нууцлалын бодлого нь Zuiio вэбсайт, Zer, Tolom, Zuiio-ийн ажиллуулдаг чатбот, хэрэглэгчийн дэмжлэгийн суваг болон холбогдох үйлчилгээнд хамаарна.",
					"Хэрэглэгч Meta, Facebook, Instagram, Apple эсвэл бусад мессеж, апп платформ холбосон тохиолдолд тухайн платформ өөрийн нууцлалын бодлогын дагуу мэдээлэл боловсруулна.",
				],
			},
			{
				id: "data-we-collect",
				title: "2. Бидний цуглуулах мэдээлэл",
				paragraphs: ["Бид бизнесийн программ, хэрэглэгчийн дэмжлэг, аюулгүй байдал, төлбөр тооцоо болон мессежийн боломжуудыг үзүүлэхэд шаардлагатай мэдээллийг цуглуулна."],
				bullets: [
					"Нэр, имэйл, утас, байгууллагын нэр, эрх үүрэг, хэлний тохиргоо зэрэг аккаунтын мэдээлэл.",
					"Бараа материал, борлуулалт, зарлага, засварын захиалга, тээврийн хэрэгсэл, харилцагч, нийлүүлэгч, тайлан болон тохиргоо зэрэг Zuiio бүтээгдэхүүнд оруулсан бизнесийн өгөгдөл.",
					"Чатбот болон дэмжлэгийн мессеж: мессежийн агуулга, платформоос өгсөн илгээгчийн танигч, хугацаа, хавсралт, хүсэлтийг шийдвэрлэхэд хэрэгтэй харилцан ярианы нөхцөл.",
					"IP хаяг, хөтөч, үйлдлийн систем, ойролцоо байршил, лог, алдаа оношлогооны мэдээлэл зэрэг хэрэглээ, төхөөрөмж, аюулгүй байдлын өгөгдөл.",
					"Төлбөрийн үйлчилгээ үзүүлэгчээр боловсруулагдах төлбөр, subscription-ийн мэдээлэл. Бид бүрэн картын дугаарыг өөрийн серверт зориуд хадгалдаггүй.",
				],
			},
			{
				id: "how-we-use-data",
				title: "3. Мэдээллийг хэрхэн ашиглах вэ",
				paragraphs: ["Бид мэдээллийг Zuiio бүтээгдэхүүнийг ажиллуулах, аккаунтын аюулгүй байдлыг хангах, дэмжлэг үзүүлэх, найдвартай байдлыг сайжруулах, хууль болон платформын шаардлагыг биелүүлэхэд ашиглана."],
				bullets: [
					"Zer, Tolom, Zuiio вэбсайт болон чатбот үйлчилгээг үзүүлэх, хувийн тохиргоо хийх, сайжруулах.",
					"Хэрэглэгчийг баталгаажуулах, аккаунтыг хамгаалах, залилан эсвэл буруу ашиглалтаас сэргийлэх.",
					"Имэйл, вэб маягт, мессежийн сувгаар ирсэн хүсэлтэд хариулах.",
					"Үйлчилгээний мэдэгдэл, бүтээгдэхүүний шинэчлэл, төлбөрийн болон захиргааны мэдээлэл илгээх.",
					"Гүйцэтгэл, нутагшуулалт, бүтээгдэхүүний чанарыг сайжруулахын тулд нэгтгэсэн хэрэглээний мэдээлэл шинжлэх.",
				],
			},
			{
				id: "sharing",
				title: "4. Хуваалцах ба боловсруулагчид",
				paragraphs: [
					"Бид хэрэглэгчийн бизнесийн өгөгдөл эсвэл чатботын мессежийг зардаггүй. Үйлчилгээг үзүүлэх, хууль биелүүлэх, эрх ба аюулгүй байдлыг хамгаалах, эсвэл нэгдэх/худалдан авах зэрэг бизнесийн хэлцэлд шаардлагатай үед л мэдээлэл хуваалцана.",
					"Хостинг, хадгалалт, аналитик, төлбөр, имэйл, дэмжлэг, алдаа хяналт, мессеж хүргэлтийн үйлчилгээ үзүүлэгчид Zuiio-ийн өмнөөс мэдээлэл боловсруулж болно.",
				],
			},
			{
				id: "retention",
				title: "5. Хадгалалт",
				paragraphs: [
					"Бид мэдээллийг үйлчилгээ үзүүлэх, хууль эрх зүйн үүргээ биелүүлэх, маргаан шийдвэрлэх, гэрээ хэрэгжүүлэх, аюулгүй байдлыг хангахад шаардлагатай хугацаанд хадгална. Устгуулах хүсэлтийг Өгөгдөл устгах хуудсанд заасны дагуу гаргаж болно.",
					"Нөөц хуулбар болон лог аюулгүй системээс бүрэн устахад нэмэлт хугацаа шаардагдаж болно. Гэхдээ бид хандалтыг хязгаарлаж, устгасан мэдээллийг шинэ бүтээгдэхүүний үйл ажиллагаанд ашиглахгүй.",
				],
			},
			{
				id: "rights",
				title: "6. Хандах, засах, устгах",
				paragraphs: [
					"Та Zuiio аккаунт эсвэл чатботын харилцан яриатай холбоотой хувийн мэдээлэлд хандах, засах, экспортлох, устгуулах хүсэлт гаргаж болно. Хүсэлтийг биелүүлэхийн өмнө бид таны эрхийг баталгаажуулах шаардлагатай байж болно.",
					"Workspace-ийн эзэмшигч нь өөрийн ажилтан, харилцагч, нийлүүлэгч болон засварын газрын үйлчлүүлэгчийн өгөгдөлтэй холбоотой хүсэлтэд хариуцах үүрэгтэй.",
				],
			},
			{
				id: "security",
				title: "7. Аюулгүй байдал",
				paragraphs: ["Бид зөвшөөрөлгүй хандалт, алдагдал, буруу ашиглалт, өөрчлөлт, ил болгохоос хамгаалах захиргааны, техникийн, зохион байгуулалтын арга хэмжээг ашигладаг. Гэвч ямар ч систем төгс аюулгүй биш тул хэрэглэгч нууц үг, төхөөрөмж, workspace эрхээ мөн хамгаалах ёстой."],
			},
			{
				id: "children",
				title: "8. Хүүхэд",
				paragraphs: ["Zuiio үйлчилгээ нь бизнесүүдэд зориулагдсан бөгөөд хүүхдэд чиглээгүй. Хүүхэд бидэнд хувийн мэдээлэл өгсөн гэж үзвэл sales@zuiio.com руу хандаарай; бид шаардлагатай тохиолдолд шалгаж устгана."],
			},
			{
				id: "contact",
				title: "9. Холбоо барих",
				paragraphs: ["Нууцлал, өгөгдлийн хүсэлт эсвэл платформын шалгалтын талаар sales@zuiio.com хаяг руу “Privacy request” гарчигтай имэйл илгээнэ үү."],
			},
		],
	},
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { locale } = await params;
	const document = documents[resolveLocale(locale)];
	return {
		title: document.eyebrow,
		description: document.description,
		alternates: { canonical: "/privacy" },
	};
}

export default async function PrivacyPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const document = documents[resolveLocale(locale)];

	return <LegalPage locale={locale} {...document} />;
}
