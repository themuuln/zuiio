/**
 * Shared Mongolian label maps for the buyer order history + detail pages.
 * Status label conventions match the POS (sales/deliveries) surfaces.
 */

export const STATUS_LABELS: Record<string, string> = {
  completed: "Гүйцэтгэсэн",
  pending: "Хүлээгдэж буй",
  cancelled: "Цуцалсан",
  refunded: "Буцаагдсан",
  failed: "Амжилтгүй",
};

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  assigned: "Даалгасан",
  in_transit: "Хүргэлтэнд",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцалсан",
};

export const DELIVERY_TYPE_LABELS: Record<string, string> = {
  delivery: "Хүргэлт",
  pickup: "Дэлгүүрээс авах",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: "Бэлэн",
  card: "Карт",
  qpay: "QPay",
  bank_transfer: "Банкны шилжүүлэг",
  invoice: "Нэхэмжлэл",
};
