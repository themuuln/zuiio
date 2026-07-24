import type { Bay, BayKPI } from "./types";

// ─── Mock Bays ────────────────────────────────────────────
// Realistic auto-shop data. 6 bays, mixed statuses.

export const MOCK_BAYS: Bay[] = [
  {
    id: "bay-1",
    number: 1,
    status: "in-progress",
    vehicle: {
      plateNumber: "УБА-1234",
      make: "Toyota",
      model: "Land Cruiser",
      year: 2022,
      color: "Цагаан",
    },
    mechanics: [
      { id: "m1", name: "Бат-Эрдэнэ", avatarUrl: null },
      { id: "m2", name: "Оюунболд", avatarUrl: null },
    ],
    services: [
      {
        id: "s1",
        name: "Engine oil change",
        status: "completed",
        price: 120000,
      },
      {
        id: "s2",
        name: "Brake pad replacement",
        status: "in-progress",
        price: 350000,
      },
      { id: "s3", name: "Wheel alignment", status: "pending", price: 80000 },
    ],
    workOrderId: "wo-001",
    startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    estimatedMinutes: 180,
    elapsedMinutes: 90,
    notes: "Customer requested express service",
  },
  {
    id: "bay-2",
    number: 2,
    status: "in-progress",
    vehicle: {
      plateNumber: "УБО-5678",
      make: "Hyundai",
      model: "Tucson",
      year: 2023,
      color: "Хар",
    },
    mechanics: [{ id: "m3", name: "Сүрэнжав", avatarUrl: null }],
    services: [
      {
        id: "s4",
        name: "AC compressor repair",
        status: "in-progress",
        price: 500000,
      },
    ],
    workOrderId: "wo-002",
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    estimatedMinutes: 120,
    elapsedMinutes: 45,
    notes: "",
  },
  {
    id: "bay-3",
    number: 3,
    status: "waiting",
    vehicle: {
      plateNumber: "УБС-9012",
      make: "Nissan",
      model: "X-Trail",
      year: 2021,
      color: "Улаан",
    },
    mechanics: [],
    services: [
      {
        id: "s5",
        name: "Transmission service",
        status: "pending",
        price: 450000,
      },
    ],
    workOrderId: "wo-003",
    startedAt: null,
    estimatedMinutes: 240,
    elapsedMinutes: 0,
    notes: "Waiting for parts delivery",
  },
  {
    id: "bay-4",
    number: 4,
    status: "ready-for-pickup",
    vehicle: {
      plateNumber: "УБҮ-3456",
      make: "Mitsubishi",
      model: "Outlander",
      year: 2020,
      color: "Мөнгөн",
    },
    mechanics: [{ id: "m4", name: "Доржпүрэв", avatarUrl: null }],
    services: [
      { id: "s6", name: "Full service", status: "completed", price: 680000 },
      { id: "s7", name: "Tire rotation", status: "completed", price: 60000 },
    ],
    workOrderId: "wo-004",
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 180,
    elapsedMinutes: 180,
    notes: "Payment received",
  },
  {
    id: "bay-5",
    number: 5,
    status: "empty",
    vehicle: null,
    mechanics: [],
    services: [],
    workOrderId: null,
    startedAt: null,
    estimatedMinutes: null,
    elapsedMinutes: 0,
    notes: "",
  },
  {
    id: "bay-6",
    number: 6,
    status: "empty",
    vehicle: null,
    mechanics: [],
    services: [],
    workOrderId: null,
    startedAt: null,
    estimatedMinutes: null,
    elapsedMinutes: 0,
    notes: "",
  },
];

// ─── Mock KPIs ────────────────────────────────────────────

export const MOCK_KPIS: BayKPI[] = [
  { label: "Нийт бэй", value: 6, icon: "◻" },
  {
    label: "Ажиллаж байна",
    value: 2,
    trend: { value: 1, direction: "up" },
    icon: "●",
  },
  { label: "Хүлээж байна", value: 1, icon: "◉" },
  {
    label: "Бэлэн",
    value: 1,
    trend: { value: 1, direction: "down" },
    icon: "✓",
  },
  { label: "Элбэгээрүүлсэн", value: 2, icon: "○" },
  {
    label: "Өнөөдрийн орлого",
    value: "₮1.2M",
    trend: { value: 12, direction: "up" },
    icon: "₸",
  },
];
