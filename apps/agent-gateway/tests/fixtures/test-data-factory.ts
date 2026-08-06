/**
 * Rich test data factory for Mongolian auto workshop and retail business scenarios.
 * Generates diverse, realistic data that mirrors actual production data.
 */

import { TEST_ORG_ID } from "./supabase-mock";

// ─── Mongolian Data Pools ───────────────────────────────────────────────────────

const MONGOLIAN_FIRST_NAMES = [
	"Бат",
	"Ган",
	"Оюун",
	"Мөнх",
	"Түвшин",
	"Билэг",
	"Эрдэнэ",
	"Сүрэн",
	"Дорж",
	"Баяр",
	"Гал",
	"Жаргал",
	"Наран",
	"Хүрэл",
	"Цэцэг",
] as const;

const MONGOLIAN_LAST_NAMES = [
	"Эрдэнэ",
	"Баатар",
	"Болд",
	"Төмөр",
	"Очир",
	"Сайхан",
	"Ариун",
	"Даваа",
	"Энх",
	"Мөнгөн",
	"Алтан",
	"Гэрэл",
	"Өсөх",
	"Дэлгэр",
] as const;

const MONGOLIAN_FULL_NAMES = [
	"Бат-Эрдэнэ",
	"Ганбат",
	"Оюунбат",
	"Мөнхбат",
	"Түвшинбат",
	"Билэгт",
	"Эрдэнэбат",
	"Сүрэнжав",
	"Доржсүрэн",
	"Баярсайхан",
	"Галбаатар",
	"Жаргалсайхан",
	"Наранбаатар",
	"Хүрэлбаатар",
	"Цэцэгмаа",
	"Оюунчимэг",
	"Энхтуяа",
	"Мөнхтуяа",
	"Алтантуяа",
	"Гэрэлмаа",
	"Номин",
	"Ангирмаа",
	"Маралмаа",
	"Цэнгүүн",
] as const;

const PHONE_PREFIXES = [
	"99",
	"88",
	"95",
	"96",
	"70",
	"80",
	"85",
	"90",
	"91",
	"94",
];

const VEHICLE_BRANDS = [
	"Toyota",
	"Hyundai",
	"Nissan",
	"Honda",
	"Kia",
	"Mitsubishi",
	"Lexus",
	"BMW",
	"Mercedes-Benz",
	"Volkswagen",
	"Subaru",
	"Mazda",
] as const;

const VEHICLE_MODELS: Record<string, string[]> = {
	Toyota: [
		"Camry",
		"Corolla",
		"RAV4",
		"Land Cruiser",
		"Prado",
		"Prius",
		"Hilux",
		"Yaris",
	],
	Hyundai: ["Sonata", "Elantra", "Tucson", "Santa Fe", "Accent", "Porter"],
	Nissan: ["Tiida", "X-Trail", "Patrol", "Sunny", "Qashqai", "Navara"],
	Honda: ["Civic", "Accord", "CR-V", "Fit", "City", "Odyssey"],
	Kia: ["Sportage", "Sorento", "K5", "Rio", "Seltos", "Carnival"],
	Mitsubishi: ["Pajero", "Outlander", "L200", "Mirage", "Delica"],
	Lexus: ["LX570", "RX350", "ES300", "NX200", "LS500"],
	BMW: ["X5", "X3", "3 Series", "5 Series", "X1", "7 Series"],
	Mercedes: ["G-Wagon", "E-Class", "C-Class", "GLC", "GLE", "S-Class"],
	Volkswagen: ["Passat", "Golf", "Tiguan", "Polo", "Amarok"],
	Subaru: ["Forester", "Outback", "Legacy", "Impreza", "XV"],
	Mazda: ["CX-5", "Mazda3", "Mazda6", "CX-9", "MX-5"],
} as const;

const PLATE_LETTERS = ["УБА", "УББ", "УБЕ", "УБД", "УБМ", "УБХ", "УБС", "УБТ"];

const _WORK_ORDER_STATUSES = [
	"pending",
	"in_progress",
	"waiting_parts",
	"completed",
	"delivered",
	"cancelled",
] as const;
const _ACTIVE_STATUSES = ["pending", "in_progress", "waiting_parts"];

const APPOINTMENT_STATUSES = [
	"scheduled",
	"confirmed",
	"completed",
	"cancelled",
] as const;

const EXPENSE_CATEGORIES = [
	{ id: "cat-parts", name: "Сэлбэг" },
	{ id: "cat-labor", name: "Цалин" },
	{ id: "cat-rent", name: "Түрээс" },
	{ id: "cat-utility", name: "Цахилгаан" },
	{ id: "cat-marketing", name: "Сурталчилгаа" },
	{ id: "cat-fuel", name: "Шатахуун" },
	{ id: "cat-tax", name: "Татвар" },
	{ id: "cat-other", name: "Бусад" },
] as const;

const INVOICE_STATUSES = ["paid", "unpaid", "partial", "overdue"] as const;

const APPOINTMENT_NOTES = [
	"Engine check engine light",
	"Бүрэн тосолгоо",
	"Тоормосны систем засвар",
	"Дугуй солих",
	"Жирийн үйлчилгээ",
	"Хөргөлтийн систем",
	"Климат контроль",
	"Хөдөлгүүрийн оношилгоо",
	"Тос солих",
] as const;

// ─── Generators ─────────────────────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
	return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomAmount(min = 50000, max = 3000000): number {
	return Math.round(randomInt(min, max) / 1000) * 1000;
}

function randomPlate(): string {
	return `${pick(PLATE_LETTERS)}${randomInt(1000, 9999)}`;
}

function randomPhone(): string {
	return `${pick(PHONE_PREFIXES)}${randomInt(1000000, 9999999)}`;
}

function randomDate(daysAgo: number): string {
	const d = new Date(Date.now() - randomInt(0, daysAgo) * 86400000);
	return d.toISOString();
}

function randomFutureDate(maxDays = 14): string {
	const d = new Date(Date.now() + randomInt(1, maxDays) * 86400000);
	d.setHours(randomInt(8, 17), randomInt(0, 3) * 15, 0, 0);
	return d.toISOString();
}

// ─── Customer Factory ──────────────────────────────────────────────────────────

export interface TestCustomer {
	id: string;
	organization_id: string;
	full_name: string;
	first_name: string;
	last_name: string;
	phone: string;
	total_visits: number;
	last_visit_at: string;
	created_at: string;
}

export function generateCustomers(count: number): TestCustomer[] {
	return Array.from({ length: count }, (_, i) => {
		const fullName = MONGOLIAN_FULL_NAMES[i % MONGOLIAN_FULL_NAMES.length];
		const firstName = pick(MONGOLIAN_FIRST_NAMES);
		const lastName = pick(MONGOLIAN_LAST_NAMES);
		return {
			id: `cust-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			full_name: fullName,
			first_name: firstName,
			last_name: lastName,
			phone: randomPhone(),
			total_visits: randomInt(0, 30),
			last_visit_at: randomDate(60),
			created_at: randomDate(180),
		};
	});
}

// ─── Vehicle Factory ────────────────────────────────────────────────────────────

export interface TestVehicle {
	id: string;
	organization_id: string;
	customer_id: string;
	plate_number: string;
	make: string;
	model: string;
	year: number;
}

export function generateVehicles(
	count: number,
	customers: TestCustomer[],
): TestVehicle[] {
	return Array.from({ length: count }, (_, i) => {
		const make = pick(VEHICLE_BRANDS);
		const models = VEHICLE_MODELS[make] ?? ["Unknown"];
		const customer = customers[i % customers.length];
		return {
			id: `veh-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			customer_id: customer.id,
			plate_number: randomPlate(),
			make,
			model: pick(models),
			year: randomInt(2005, 2026),
		};
	});
}

// ─── Work Order Factory ─────────────────────────────────────────────────────────

export interface TestWorkOrder {
	id: string;
	organization_id: string;
	customer_id: string;
	status: string;
	total: string;
	created_at: string;
	updated_at: string;
	customers?: { full_name: string; phone: string };
	vehicles?: {
		plate_number: string;
		make: string;
		model: string;
		year: number;
	};
}

export function generateWorkOrders(
	count: number,
	customers: TestCustomer[],
	statusDistribution: Record<string, number> = {
		New: 0.2,
		"In Progress": 0.3,
		Diagnosing: 0.15,
		Completed: 0.2,
		"Ready for Pickup": 0.1,
		Cancelled: 0.05,
	},
): TestWorkOrder[] {
	const statuses = Object.keys(statusDistribution);
	const weights = Object.values(statusDistribution);
	return Array.from({ length: count }, (_, i) => {
		const r = Math.random();
		let cumulative = 0;
		let status = statuses[statuses.length - 1]!;
		for (let j = 0; j < statuses.length; j++) {
			cumulative += weights[j]!;
			if (r <= cumulative) {
				status = statuses[j]!;
				break;
			}
		}
		const customer = customers[i % customers.length];
		return {
			id: `wo-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			customer_id: customer.id,
			status,
			total: String(randomAmount(100000, 5000000)),
			created_at: randomDate(30),
			updated_at: randomDate(15),
			customers: { full_name: customer.full_name, phone: customer.phone },
		};
	});
}

// ─── Invoice Factory ────────────────────────────────────────────────────────────

export interface TestInvoice {
	id: string;
	organization_id: string;
	customer_id: string;
	total: string;
	amount_paid: string;
	balance_due: string;
	status: string;
	issued_at: string;
	created_at: string;
}

export function generateInvoices(
	count: number,
	customers: TestCustomer[],
): TestInvoice[] {
	return Array.from({ length: count }, (_, i) => {
		const total = randomAmount(50000, 3000000);
		const status = pick(INVOICE_STATUSES);
		let amountPaid: number;
		let balanceDue: number;
		switch (status) {
			case "paid":
				amountPaid = total;
				balanceDue = 0;
				break;
			case "unpaid":
				amountPaid = 0;
				balanceDue = total;
				break;
			case "partial":
				amountPaid =
					Math.round((total * (0.2 + Math.random() * 0.5)) / 1000) * 1000;
				balanceDue = total - amountPaid;
				break;
			case "overdue":
				amountPaid = 0;
				balanceDue = total;
				break;
			default:
				amountPaid = 0;
				balanceDue = total;
		}
		return {
			id: `inv-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			customer_id: customers[i % customers.length].id,
			total: String(total),
			amount_paid: String(amountPaid),
			balance_due: String(balanceDue),
			status,
			issued_at: randomDate(30),
			created_at: randomDate(30),
		};
	});
}

// ─── Expense Factory ────────────────────────────────────────────────────────────

export interface TestExpense {
	id: string;
	organization_id: string;
	customer_id?: string;
	amount: string;
	expense_date: string;
	description: string;
	category_id: string;
	expense_categories: { name: string };
}

export function generateExpenses(count: number): TestExpense[] {
	return Array.from({ length: count }, (_, i) => {
		const category = pick(EXPENSE_CATEGORIES);
		return {
			id: `exp-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			amount: String(randomAmount(5000, 2000000)),
			expense_date: randomDate(30).slice(0, 10),
			description: pick([
				"Сэлбэг худалдан авалт",
				"Цалин",
				"Түрээсийн төлбөр",
				"Цахилгаан",
				"Сурталчилгаа",
				"Тасалгааны материал",
				"Багаж хэрэгсэл",
				"Тээврийн зардал",
				"Интернет",
			]),
			category_id: category.id,
			expense_categories: { name: category.name },
		};
	});
}

// ─── Appointment Factory ────────────────────────────────────────────────────────

export interface TestAppointment {
	id: string;
	organization_id: string;
	customer_id: string;
	vehicle_id: string;
	scheduled_at: string;
	status: string;
	notes: string;
	created_at: string;
	customers: { full_name: string; phone: string };
	vehicles: { plate_number: string; make: string; model: string };
}

export function generateAppointments(
	count: number,
	customers: TestCustomer[],
	vehicles: TestVehicle[],
): TestAppointment[] {
	return Array.from({ length: count }, (_, i) => {
		const customer = customers[i % customers.length];
		const vehicle =
			vehicles.find((v) => v.customer_id === customer.id) ??
			vehicles[i % vehicles.length];
		return {
			id: `apt-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			customer_id: customer.id,
			vehicle_id: vehicle?.id ?? "veh-unknown",
			scheduled_at: randomFutureDate(7),
			status: pick(APPOINTMENT_STATUSES),
			notes: pick(APPOINTMENT_NOTES),
			created_at: randomDate(14),
			customers: { full_name: customer.full_name, phone: customer.phone },
			vehicles: {
				plate_number: vehicle?.plate_number ?? randomPlate(),
				make: vehicle?.make ?? "Toyota",
				model: vehicle?.model ?? "Camry",
			},
		};
	});
}

// ─── Sales Factory (for Zer) ────────────────────────────────────────────────────

export interface TestSale {
	id: string;
	organization_id: string;
	sale_date: string;
	total_amount: string;
	paid_amount: string | null;
}

export function generateSales(count: number): TestSale[] {
	return Array.from({ length: count }, (_, i) => {
		const total = randomAmount(10000, 2000000);
		const isFullyPaid = Math.random() > 0.4;
		return {
			id: `sale-${i + 1}-${Date.now()}`,
			organization_id: TEST_ORG_ID,
			sale_date: randomDate(30).slice(0, 10),
			total_amount: String(total),
			paid_amount: isFullyPaid
				? String(total)
				: Math.random() > 0.5
					? String(randomAmount(0, total))
					: null,
		};
	});
}

// ─── Build Complete Test Dataset ────────────────────────────────────────────────

export interface TestDataset {
	customers: TestCustomer[];
	vehicles: TestVehicle[];
	workOrders: TestWorkOrder[];
	invoices: TestInvoice[];
	expenses: TestExpense[];
	appointments: TestAppointment[];
	sales: TestSale[];
}

export function generateFullDataset(opts?: {
	customerCount?: number;
	vehicleCount?: number;
	workOrderCount?: number;
	invoiceCount?: number;
	expenseCount?: number;
	appointmentCount?: number;
	saleCount?: number;
}): TestDataset {
	const cc = opts?.customerCount ?? 20;
	const customers = generateCustomers(cc);
	const vehicles = generateVehicles(opts?.vehicleCount ?? cc + 5, customers);
	return {
		customers,
		vehicles,
		workOrders: generateWorkOrders(opts?.workOrderCount ?? 40, customers),
		invoices: generateInvoices(opts?.invoiceCount ?? 30, customers),
		expenses: generateExpenses(opts?.expenseCount ?? 50),
		appointments: generateAppointments(
			opts?.appointmentCount ?? 15,
			customers,
			vehicles,
		),
		sales: generateSales(opts?.saleCount ?? 60),
	};
}

// ─── Report a single customer's full profile ────────────────────────────────────

export function findCustomerByQuery(
	dataset: TestDataset,
	query: string,
): TestCustomer[] {
	const q = query.toLowerCase();
	return dataset.customers.filter(
		(c) =>
			c.full_name.toLowerCase().includes(q) ||
			c.phone.includes(q) ||
			c.first_name.toLowerCase().includes(q) ||
			c.last_name.toLowerCase().includes(q),
	);
}

export function getCustomerVehicles(
	dataset: TestDataset,
	customerId: string,
): TestVehicle[] {
	return dataset.vehicles.filter((v) => v.customer_id === customerId);
}
