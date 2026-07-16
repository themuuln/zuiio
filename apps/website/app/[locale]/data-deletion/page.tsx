import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage, resolveLocale, type LegalDocument } from "../legal-page";

interface Props {
	params: Promise<{ locale: string }>;
}

const documents: Record<"en" | "mn", LegalDocument> = {
	en: {
		eyebrow: "Data Deletion",
		title: "Request deletion of Zuiio account, product, or chatbot data",
		description:
			"Use this page for Meta/Facebook app review, chatbot users, Apple review, and customers who need a clear way to request deletion of personal information handled by Zuiio.",
		lastUpdated: "July 7, 2026",
		sections: [
			{
				id: "what-you-can-delete",
				title: "1. What you can ask us to delete",
				paragraphs: ["You can request deletion of personal information that Zuiio controls or processes on behalf of a customer workspace."],
				bullets: [
					"Zuiio website inquiries and support messages.",
					"Zuiio-operated chatbot messages and sender identifiers provided by Meta, Facebook, Instagram, or another messaging platform.",
					"Personal details in Zer or Tolom workspaces, subject to the workspace owner's authority and legal retention obligations.",
					"Account profile information associated with your Zuiio user account.",
				],
			},
			{
				id: "email-request",
				title: "2. Email request",
				paragraphs: ["Send an email to sales@zuiio.com with the subject line “Data deletion request.” Include enough information for us to identify the data without asking for unnecessary sensitive details."],
				bullets: [
					"Your name and the email or phone number used with Zuiio, if applicable.",
					"The product or channel: Zer, Tolom, website, Facebook/Instagram chatbot, or another Zuiio chatbot.",
					"The organization or workspace name, if the request concerns business records.",
					"A short description of the data you want deleted.",
				],
			},
			{
				id: "chatbot-request",
				title: "3. Chatbot request",
				paragraphs: [
					"If you interacted with a Zuiio chatbot through Facebook, Instagram, Messenger, or another messaging platform, you may also send “delete my data” in the same conversation. We may reply to confirm the request and verify that we are deleting the correct conversation data.",
					"Platform providers may keep their own copies of messages, identifiers, or logs under their own policies. To delete data held by the platform itself, use that platform's account and privacy tools.",
				],
			},
			{
				id: "verification",
				title: "4. Verification",
				paragraphs: [
					"We may ask for additional information to verify your identity, confirm your authority over a workspace, or identify the correct chatbot conversation. We will not ask for your password.",
					"For business records controlled by a Zuiio customer workspace, we may direct the request to the workspace owner or administrator.",
				],
			},
			{
				id: "timeline",
				title: "5. Timeline",
				paragraphs: [
					"We aim to acknowledge deletion requests within 7 business days and complete verified requests within 30 days unless a longer period is required by law, security review, backup expiration, or dispute resolution.",
					"When the request is complete, we will confirm by email or in the messaging conversation when feasible.",
				],
			},
			{
				id: "limits",
				title: "6. What may be retained",
				paragraphs: ["Some information may be retained when necessary for legitimate business, security, accounting, legal, or compliance reasons."],
				bullets: [
					"Security logs needed to prevent fraud or abuse.",
					"Billing, tax, and accounting records required by law.",
					"Records needed to resolve disputes, enforce agreements, or comply with legal obligations.",
					"Backups that are deleted on their normal rotation schedule and are not used for new product activity.",
				],
			},
			{
				id: "contact",
				title: "7. Contact",
				paragraphs: ["For deletion requests, email sales@zuiio.com with the subject line “Data deletion request.”"],
			},
		],
	},
	mn: {
		eyebrow: "Өгөгдөл устгах",
		title: "Zuiio аккаунт, бүтээгдэхүүн эсвэл чатботын өгөгдөл устгуулах хүсэлт",
		description:
			"Энэ хуудас нь Meta/Facebook app review, чатбот хэрэглэгч, Apple review болон Zuiio боловсруулдаг хувийн мэдээллийг устгуулах тодорхой арга хэрэгтэй хэрэглэгчдэд зориулагдсан.",
		lastUpdated: "2026 оны 7 сарын 7",
		sections: [
			{
				id: "what-you-can-delete",
				title: "1. Юуг устгуулах хүсэлт гаргаж болох вэ",
				paragraphs: ["Та Zuiio-ийн хянадаг эсвэл хэрэглэгчийн workspace-ийн өмнөөс боловсруулдаг хувийн мэдээллийг устгуулах хүсэлт гаргаж болно."],
				bullets: [
					"Zuiio вэбсайтын лавлагаа болон дэмжлэгийн мессеж.",
					"Meta, Facebook, Instagram эсвэл бусад мессежийн платформоос өгсөн илгээгчийн танигч болон Zuiio-ийн ажиллуулдаг чатботын мессеж.",
					"Workspace эзэмшигчийн эрх болон хууль ёсны хадгалалтын үүргээс хамааран Zer эсвэл Tolom workspace доторх хувийн мэдээлэл.",
					"Zuiio хэрэглэгчийн аккаунттай холбоотой профайлын мэдээлэл.",
				],
			},
			{
				id: "email-request",
				title: "2. Имэйлээр хүсэлт гаргах",
				paragraphs: ["sales@zuiio.com хаяг руу “Data deletion request” гарчигтай имэйл илгээнэ үү. Шаардлагагүй эмзэг мэдээлэл өгөхгүйгээр өгөгдлийг танихад хангалттай мэдээлэл оруулна."],
				bullets: [
					"Таны нэр болон Zuiio-д ашигласан имэйл эсвэл утас, хэрэв байгаа бол.",
					"Бүтээгдэхүүн эсвэл суваг: Zer, Tolom, вэбсайт, Facebook/Instagram чатбот эсвэл өөр Zuiio чатбот.",
					"Бизнесийн бүртгэлтэй холбоотой бол байгууллага эсвэл workspace-ийн нэр.",
					"Устгуулахыг хүссэн өгөгдлийн товч тайлбар.",
				],
			},
			{
				id: "chatbot-request",
				title: "3. Чатботоор хүсэлт гаргах",
				paragraphs: [
					"Та Facebook, Instagram, Messenger эсвэл бусад мессежийн платформоор Zuiio чатботтой харилцсан бол тухайн ярианд “delete my data” гэж илгээж болно. Бид зөв харилцан ярианы өгөгдлийг устгаж буйг баталгаажуулахын тулд хариу илгээж магадгүй.",
					"Платформ үйлчилгээ үзүүлэгч нь өөрийн бодлогын дагуу мессеж, танигч эсвэл логийн хуулбарыг хадгалж болно. Платформ өөрөө хадгалсан өгөгдлийг устгахын тулд тухайн платформын аккаунт болон нууцлалын хэрэгслийг ашиглана уу.",
				],
			},
			{
				id: "verification",
				title: "4. Баталгаажуулалт",
				paragraphs: [
					"Бид таны хэн болох, workspace-ийн эрх, эсвэл зөв чатботын харилцан яриаг тодорхойлохын тулд нэмэлт мэдээлэл асууж болно. Бид таны нууц үгийг асуухгүй.",
					"Zuiio хэрэглэгчийн workspace-ийн хянадаг бизнесийн бүртгэлтэй холбоотой хүсэлтийг workspace эзэмшигч эсвэл админд чиглүүлж болно.",
				],
			},
			{
				id: "timeline",
				title: "5. Хугацаа",
				paragraphs: [
					"Бид устгах хүсэлтийг ажлын 7 хоногийн дотор хүлээн авснаа мэдэгдэх, баталгаажсан хүсэлтийг 30 хоногийн дотор гүйцэтгэхийг зорьдог. Хууль, аюулгүй байдлын шалгалт, нөөц хуулбарын хугацаа эсвэл маргаан шийдвэрлэлтээс шалтгаалан илүү урт хугацаа шаардагдаж болно.",
					"Хүсэлт дууссаны дараа боломжтой бол имэйлээр эсвэл мессежийн ярианд баталгаажуулна.",
				],
			},
			{
				id: "limits",
				title: "6. Хадгалагдаж болох мэдээлэл",
				paragraphs: ["Зарим мэдээллийг бизнес, аюулгүй байдал, нягтлан бодох бүртгэл, хууль эсвэл нийцлийн шаардлагаар хадгалах шаардлагатай байж болно."],
				bullets: [
					"Залилан эсвэл буруу ашиглалтаас сэргийлэх аюулгүй байдлын лог.",
					"Хуулиар шаардсан төлбөр, татвар, нягтлан бодох бүртгэлийн мэдээлэл.",
					"Маргаан шийдвэрлэх, гэрээ хэрэгжүүлэх эсвэл хууль ёсны үүрэг биелүүлэхэд шаардлагатай бүртгэл.",
					"Ердийн rotation-ийн дагуу устах бөгөөд шинэ бүтээгдэхүүний үйл ажиллагаанд ашиглагдахгүй нөөц хуулбар.",
				],
			},
			{
				id: "contact",
				title: "7. Холбоо барих",
				paragraphs: ["Устгах хүсэлтийг sales@zuiio.com хаяг руу “Data deletion request” гарчигтай илгээнэ үү."],
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
		alternates: { canonical: "/data-deletion" },
	};
}

export default async function DataDeletionPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const document = documents[resolveLocale(locale)];

	return <LegalPage locale={locale} {...document} />;
}
