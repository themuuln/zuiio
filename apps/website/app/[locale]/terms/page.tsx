import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage, resolveLocale, type LegalDocument } from "../legal-page";

interface Props {
	params: Promise<{ locale: string }>;
}

const documents: Record<"en" | "mn", LegalDocument> = {
	en: {
		eyebrow: "Terms of Service",
		title: "Terms for using Zuiio products and messaging services",
		description:
			"These terms describe the rules for using Zuiio websites, Zer, Tolom, support channels, and Zuiio-operated chatbots.",
		lastUpdated: "July 7, 2026",
		sections: [
			{
				id: "acceptance",
				title: "1. Acceptance",
				paragraphs: [
					"By accessing or using Zuiio services, you agree to these Terms of Service and our Privacy Policy. If you use Zuiio for an organization, you confirm that you have authority to bind that organization.",
					"If you do not agree to these terms, do not use the services.",
				],
			},
			{
				id: "services",
				title: "2. Services",
				paragraphs: [
					"Zuiio provides software and apps for organizations and consumers, including Zer for business operations, Tolom for auto repair management, Tumurch for client workout and calorie tracking plus organization ERP/CRM/shop workflows, and other current or future products. We may also provide websites, chatbot experiences, support tools, and integrations with third-party platforms.",
					"We may update, add, suspend, or remove features to improve reliability, security, compliance, or product quality.",
				],
			},
			{
				id: "accounts",
				title: "3. Accounts and responsibilities",
				paragraphs: [
					"You are responsible for accurate account information, protecting credentials, managing workspace permissions, and all activity under your account or organization workspace.",
					"You must notify us promptly if you suspect unauthorized access or misuse.",
				],
			},
			{
				id: "acceptable-use",
				title: "4. Acceptable use",
				paragraphs: ["You agree not to misuse Zuiio services or connected third-party platforms."],
				bullets: [
					"Do not violate laws, privacy rights, intellectual property rights, or platform policies.",
					"Do not upload malware, attempt unauthorized access, probe systems, or disrupt service availability.",
					"Do not use Zuiio services to send spam, deceptive messages, harassment, or unlawful content.",
					"Do not reverse engineer, scrape, resell, or benchmark the services except where allowed by law or a written agreement.",
				],
			},
			{
				id: "customer-data",
				title: "5. Customer data",
				paragraphs: [
					"You retain ownership of business data, files, messages, and records you submit to Zuiio services. You grant Zuiio permission to process that data only as needed to provide, secure, support, and improve the services.",
					"You are responsible for having the rights and notices required to submit data about your employees, customers, suppliers, vehicles, or chatbot users.",
				],
			},
			{
				id: "third-parties",
				title: "6. Third-party platforms",
				paragraphs: [
					"Some features depend on third-party services such as Meta, Facebook, Instagram, Apple, payment providers, hosting providers, email providers, analytics, or support tools. Their terms and policies apply to those services.",
					"We are not responsible for third-party platforms, outages, policy changes, account suspensions, or data handling outside Zuiio's control.",
				],
			},
			{
				id: "fees",
				title: "7. Fees and subscriptions",
				paragraphs: [
					"Paid plans, usage limits, renewal terms, taxes, and payment timing are described at checkout, in an order form, or in a separate written agreement. Unless stated otherwise, fees are non-refundable once a billing period begins.",
					"We may change pricing with reasonable notice. If you do not accept a pricing change, you may cancel before the new price applies.",
				],
			},
			{
				id: "availability",
				title: "8. Availability and support",
				paragraphs: [
					"We work to keep Zuiio services available and reliable, but we do not guarantee uninterrupted or error-free operation. Maintenance, incidents, third-party failures, or force majeure events may affect availability.",
					"Support availability may differ by plan or agreement.",
				],
			},
			{
				id: "termination",
				title: "9. Suspension and termination",
				paragraphs: [
					"You may stop using the services at any time. We may suspend or terminate access if you violate these terms, create security or legal risk, fail to pay fees, or use the services in a way that harms Zuiio, customers, or third-party platforms.",
					"After termination, we may retain or delete data as described in the Privacy Policy, Data Deletion page, and any applicable agreement.",
				],
			},
			{
				id: "disclaimers",
				title: "10. Disclaimers and liability",
				paragraphs: [
					"To the maximum extent permitted by law, Zuiio services are provided as is and as available. We disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement.",
					"To the maximum extent permitted by law, Zuiio will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or lost profits, revenue, goodwill, or data. Our total liability for claims relating to the services is limited to the amount you paid to Zuiio for the affected service during the three months before the claim.",
				],
			},
			{
				id: "law",
				title: "11. Governing law",
				paragraphs: [
					"These terms are governed by the laws of Mongolia, except where mandatory consumer or data protection laws require otherwise.",
				],
			},
			{
				id: "contact",
				title: "12. Contact",
				paragraphs: ["Questions about these terms can be sent to sales@zuiio.com with the subject line “Terms question.”"],
			},
		],
	},
	mn: {
		eyebrow: "Үйлчилгээний нөхцөл",
		title: "Zuiio бүтээгдэхүүн болон мессежийн үйлчилгээг ашиглах нөхцөл",
		description:
			"Эдгээр нөхцөл нь Zuiio вэбсайт, Zer, Tolom, дэмжлэгийн суваг болон Zuiio-ийн ажиллуулдаг чатботыг ашиглах дүрмийг тайлбарлана.",
		lastUpdated: "2026 оны 7 сарын 7",
		sections: [
			{
				id: "acceptance",
				title: "1. Зөвшөөрөх",
				paragraphs: [
					"Zuiio үйлчилгээнд хандах эсвэл ашиглахдаа та энэхүү Үйлчилгээний нөхцөл болон Нууцлалын бодлогыг зөвшөөрч байна. Байгууллагын өмнөөс ашиглаж байгаа бол тухайн байгууллагыг төлөөлөх эрхтэйгээ баталгаажуулна.",
					"Эдгээр нөхцөлийг зөвшөөрөхгүй бол үйлчилгээг ашиглахгүй байна уу.",
				],
			},
			{
				id: "services",
				title: "2. Үйлчилгээ",
				paragraphs: [
					"Zuiio нь бизнесийн үйл ажиллагаанд зориулсан Zer, авто засварын удирдлагад зориулсан Tolom зэрэг бизнесийн программ хангамжийг үзүүлдэг. Мөн вэбсайт, чатбот, дэмжлэгийн хэрэгсэл, гуравдагч талын платформтой интеграц үзүүлж болно.",
					"Найдвартай байдал, аюулгүй байдал, нийцэл, бүтээгдэхүүний чанарыг сайжруулахын тулд бид боломжуудыг шинэчлэх, нэмэх, түр зогсоох эсвэл хасах боломжтой.",
				],
			},
			{
				id: "accounts",
				title: "3. Аккаунт ба хариуцлага",
				paragraphs: [
					"Та аккаунтын мэдээллээ зөв байлгах, нэвтрэх мэдээллээ хамгаалах, workspace эрхийг удирдах, өөрийн аккаунт эсвэл байгууллагын workspace-д хийгдэх бүх үйл ажиллагааг хариуцна.",
					"Зөвшөөрөлгүй хандалт эсвэл буруу ашиглалт сэжиглэвэл бидэнд даруй мэдэгдэнэ үү.",
				],
			},
			{
				id: "acceptable-use",
				title: "4. Зөвшөөрөгдсөн хэрэглээ",
				paragraphs: ["Та Zuiio үйлчилгээ болон холбогдсон гуравдагч талын платформыг буруу ашиглахгүй байхыг зөвшөөрнө."],
				bullets: [
					"Хууль, нууцлал, оюуны өмчийн эрх эсвэл платформын бодлогыг зөрчихгүй.",
					"Malware байршуулах, зөвшөөрөлгүй хандах, систем шалгах, үйлчилгээний хүртээмжийг алдагдуулахгүй.",
					"Spam, хуурамч мессеж, дарамт, хууль бус контент илгээхэд Zuiio үйлчилгээг ашиглахгүй.",
					"Хууль эсвэл бичгээр байгуулсан гэрээгээр зөвшөөрөөгүй бол reverse engineer хийх, scrape хийх, дахин худалдах, benchmark хийхгүй.",
				],
			},
			{
				id: "customer-data",
				title: "5. Хэрэглэгчийн өгөгдөл",
				paragraphs: [
					"Zuiio үйлчилгээнд оруулсан бизнесийн өгөгдөл, файл, мессеж, бүртгэлийн өмчлөл танд хэвээр байна. Та уг өгөгдлийг үйлчилгээ үзүүлэх, хамгаалах, дэмжих, сайжруулахад шаардлагатай хэмжээнд боловсруулах зөвшөөрлийг Zuiio-д олгоно.",
					"Ажилтан, харилцагч, нийлүүлэгч, тээврийн хэрэгсэл эсвэл чатбот хэрэглэгчийн өгөгдөл оруулахдаа шаардлагатай эрх, мэдэгдлийг хангах үүрэгтэй.",
				],
			},
			{
				id: "third-parties",
				title: "6. Гуравдагч талын платформ",
				paragraphs: [
					"Зарим боломж Meta, Facebook, Instagram, Apple, төлбөрийн үйлчилгээ, хостинг, имэйл, аналитик, дэмжлэгийн хэрэгсэл зэрэг гуравдагч талын үйлчилгээнээс хамаарна. Тэдгээр үйлчилгээний өөрийн нөхцөл, бодлого үйлчилнэ.",
					"Zuiio-ийн хяналтаас гадуурх гуравдагч талын платформ, тасалдал, бодлогын өөрчлөлт, аккаунтын түдгэлзүүлэлт, өгөгдөл боловсруулалтад бид хариуцахгүй.",
				],
			},
			{
				id: "fees",
				title: "7. Төлбөр ба subscription",
				paragraphs: [
					"Төлбөртэй багц, хэрэглээний хязгаар, сунгалт, татвар, төлбөрийн хугацааг checkout, захиалгын маягт эсвэл тусдаа бичгээр байгуулсан гэрээнд заана. Өөрөөр заагаагүй бол төлбөрийн хугацаа эхэлсний дараа төлбөр буцаан олгохгүй.",
					"Бид үнийн өөрчлөлтийг зохих мэдэгдэлтэйгээр хийх боломжтой. Хэрэв та шинэ үнийг зөвшөөрөхгүй бол хүчин төгөлдөр болохоос өмнө цуцалж болно.",
				],
			},
			{
				id: "availability",
				title: "8. Хүртээмж ба дэмжлэг",
				paragraphs: [
					"Бид Zuiio үйлчилгээг хүртээмжтэй, найдвартай байлгахыг зорьдог боловч тасралтгүй эсвэл алдаагүй ажиллахыг баталгаажуулахгүй. Засвар үйлчилгээ, incident, гуравдагч талын доголдол эсвэл force majeure үйл явдал хүртээмжид нөлөөлж болно.",
					"Дэмжлэгийн хүртээмж нь багц эсвэл гэрээнээс хамаарч өөр байж болно.",
				],
			},
			{
				id: "termination",
				title: "9. Түдгэлзүүлэх ба дуусгавар болгох",
				paragraphs: [
					"Та үйлчилгээг хэзээ ч ашиглахаа зогсоож болно. Та эдгээр нөхцөлийг зөрчих, аюулгүй байдал эсвэл хууль эрх зүйн эрсдэл үүсгэх, төлбөр төлөхгүй байх, Zuiio, хэрэглэгч эсвэл гуравдагч талын платформд хор учруулах байдлаар ашиглах тохиолдолд бид хандалтыг түдгэлзүүлэх эсвэл дуусгавар болгох боломжтой.",
					"Дуусгавар болсны дараа бид Нууцлалын бодлого, Өгөгдөл устгах хуудас болон холбогдох гэрээнд заасны дагуу өгөгдлийг хадгалах эсвэл устгаж болно.",
				],
			},
			{
				id: "disclaimers",
				title: "10. Баталгаа ба хариуцлагын хязгаарлалт",
				paragraphs: [
					"Хуулиар зөвшөөрөгдөх дээд хэмжээнд Zuiio үйлчилгээ нь байгаа хэлбэрээрээ, боломжтой үедээ үзүүлэгдэнэ. Худалдах боломж, тодорхой зорилгод нийцэх, эрх зөрчихгүй байх зэрэг далд баталгааг бид үгүйсгэнэ.",
					"Хуулиар зөвшөөрөгдөх дээд хэмжээнд Zuiio шууд бус, тусгай, үр дагаврын, жишиг эсвэл шийтгэлийн хохирол, ашиг, орлого, goodwill эсвэл өгөгдлийн алдагдалд хариуцахгүй. Үйлчилгээтэй холбоотой нэхэмжлэлийн нийт хариуцлага нь нэхэмжлэл гарахаас өмнөх гурван сарын хугацаанд тухайн үйлчилгээнд төлсөн дүнгээр хязгаарлагдана.",
				],
			},
			{
				id: "law",
				title: "11. Хэрэглэх хууль",
				paragraphs: ["Заавал хэрэглэх хэрэглэгчийн эсвэл өгөгдөл хамгаалах хууль өөрөөр шаардаагүй бол эдгээр нөхцөлд Монгол Улсын хууль үйлчилнэ."],
			},
			{
				id: "contact",
				title: "12. Холбоо барих",
				paragraphs: ["Эдгээр нөхцөлийн талаар sales@zuiio.com хаяг руу “Terms question” гарчигтай имэйл илгээнэ үү."],
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
		alternates: { canonical: "/terms" },
	};
}

export default async function TermsPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const document = documents[resolveLocale(locale)];

	return <LegalPage locale={locale} {...document} />;
}
