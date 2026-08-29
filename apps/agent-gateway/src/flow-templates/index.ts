import type { FlowEdge, FlowNode, FlowVersion } from "@/flow-executor/types";

export interface FlowTemplate {
	id: string;
	name: string;
	description: string;
	productType: "zer" | "tolom";
	flow: Omit<FlowVersion, "id" | "orgId" | "version" | "isActive"> & {
		nodes: FlowNode[];
		edges: FlowEdge[];
	};
}

const makeTemplate = (input: {
	id: string;
	name: string;
	description: string;
	productType: "zer" | "tolom";
	faq: string;
	booking: string;
	orderStatus: string;
	lead: string;
}): FlowTemplate => {
	const nodes: FlowNode[] = [
		{
			id: "start",
			type: "start",
			data: { label: "Эхлэл", trigger: "default" },
		},
		{
			id: "faq",
			type: "aiReply",
			data: {
				label: "FAQ — түгээмэл асуулт",
				systemPrompt: input.faq,
				model: "deepseek-chat",
				contextSize: 8,
				temperature: 0.2,
			},
		},
		{
			id: "booking",
			type: "askQuestion",
			data: {
				label: "Цаг захиалга",
				question: input.booking,
				saveToField: "appointment",
			},
		},
		{
			id: "order",
			type: "aiReply",
			data: {
				label: "Захиалга / ажлын явц",
				systemPrompt: input.orderStatus,
				model: "deepseek-chat",
				contextSize: 8,
				temperature: 0.2,
			},
		},
		{
			id: "lead",
			type: "askQuestion",
			data: {
				label: "Харилцагчийн мэдээлэл",
				question: input.lead,
				saveToField: "lead_contact",
			},
		},
	];
	const edges: FlowEdge[] = [
		{ id: "e-start-faq", source: "start", target: "faq" },
		{ id: "e-faq-booking", source: "faq", target: "booking" },
		{ id: "e-booking-order", source: "booking", target: "order" },
		{ id: "e-order-lead", source: "order", target: "lead" },
	];
	return {
		id: input.id,
		name: input.name,
		description: input.description,
		productType: input.productType,
		flow: {
			productType: input.productType,
			nodes,
			edges,
			channel: undefined,
			triggerKeywords: [],
			metadata: { name: input.name, description: input.description },
		},
	};
};

export const FLOW_TEMPLATES: FlowTemplate[] = [
	makeTemplate({
		id: "repair",
		name: "Авто засварын газар",
		description:
			"Толом маягийн засварын газар: FAQ, цаг захиалга, ажлын явц, харилцагч бүртгэл.",
		productType: "tolom",
		faq: "Та авто засварын газрын Монгол хэлний туслах. Үйлчилгээ, үнэ, ажиллах цаг, байршлын FAQ-д хариул. Мэдээлэл дутвал searchKnowledge ашиглан мэдлэгийн сангаас хай.",
		booking:
			"Засварын цаг захиалах бол автомашины марк, хийх ажил, тохиромжтой өдөр/цагийг бичнэ үү.",
		orderStatus:
			"Засварын ажлын явц эсвэл захиалгын төлөв асуувал захиалгын дугаарыг авч, боломжтой бол searchKnowledge ашиглан тайлбарла.",
		lead: "Тантай эргэн холбогдохын тулд нэр болон утасны дугаараа үлдээнэ үү.",
	}),
	makeTemplate({
		id: "beauty",
		name: "Гоо сайхны салон",
		description:
			"Салоны FAQ, үйлчилгээний цаг захиалга, захиалгын төлөв, lead capture.",
		productType: "zer",
		faq: "Та гоо сайхны салоны Монгол хэлний зөвлөх. Үйлчилгээ, үнэ, бэлтгэл, ажиллах цагийн FAQ-д хариул. Үйлчилгээний нэр/үнэ хэрэгтэй бол searchProducts, дүрэм/мэдээлэлд searchKnowledge ашигла.",
		booking:
			"Цаг захиалахын тулд хүссэн үйлчилгээ, мэргэжилтэн (хэрэв байгаа бол), өдөр болон цагаа бичнэ үү.",
		orderStatus:
			"Захиалгын төлөв шалгах бол захиалгын дугаар эсвэл утсаа асуу. Үйлчилгээний сонголтод searchProducts ашиглан тусал.",
		lead: "Шинэ үйлчлүүлэгчийн урамшууллын мэдээлэл авахын тулд нэр, утас эсвэл имэйлээ үлдээнэ үү.",
	}),
	makeTemplate({
		id: "retail",
		name: "Дэлгүүр",
		description:
			"Shop маягийн дэлгүүрийн FAQ, бүтээгдэхүүн, хүргэлт, захиалга, lead capture.",
		productType: "zer",
		faq: "Та Монгол хэлээр ажиллах дэлгүүрийн туслах. Бүтээгдэхүүн хайхдаа searchProducts, хүргэлт/буцаалтын дүрэмд searchKnowledge ашигла. Үнэ, үлдэгдлийг таамаглахгүй.",
		booking:
			"Бүтээгдэхүүн сонгоход туслахын тулд сонирхож буй бараа, тоо ширхэг, хүргэлтийн хот/дүүргийг бичнэ үү.",
		orderStatus:
			"Захиалгын төлөв шалгах бол захиалгын дугаар эсвэл утсаа асуу. Бараа хайвал searchProducts ашиглан тохирох сонголтыг санал болго.",
		lead: "Шинэ бараа, хямдралын мэдэгдэл авахын тулд нэр болон утас/имэйлээ үлдээнэ үү.",
	}),
];

export function getFlowTemplate(id: string): FlowTemplate | undefined {
	return FLOW_TEMPLATES.find((template) => template.id === id);
}
