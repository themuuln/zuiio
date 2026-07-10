import { requireEmail, requirePassword } from "@/lib/validation";

export function validateRegistrationInput(input: {
  fullName: string;
  email: string;
  password: string;
}) {
  if (input.fullName.trim().length < 2) {
    return "Нэр дор хаяж 2 тэмдэгттэй байх ёстой.";
  }

  if (!requireEmail(input.email)) {
    return "Зөв имэйл хаяг оруулна уу.";
  }

  if (!requirePassword(input.password)) {
    return "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.";
  }

  return null;
}

export function validateLoginInput(input: { email: string; password: string }) {
  if (!requireEmail(input.email)) {
    return "Зөв имэйл хаяг оруулна уу.";
  }

  if (!input.password.trim()) {
    return "Нууц үгээ оруулна уу.";
  }

  return null;
}

export function validatePasswordResetRequestInput(input: { email: string }) {
  if (!requireEmail(input.email)) {
    return "Зөв имэйл хаяг оруулна уу.";
  }

  return null;
}

export function validatePasswordUpdateInput(input: {
  password: string;
  confirmPassword: string;
}) {
  if (!requirePassword(input.password)) {
    return "Нууц үг дор хаяж 8 тэмдэгттэй байх ёстой.";
  }

  if (input.password !== input.confirmPassword) {
    return "Нууц үг таарахгүй байна.";
  }

  return null;
}

export function validateOrganizationInput(input: {
  name: string;
  slug: string;
}) {
  if (input.name.trim().length < 2) {
    return "Байгууллагын нэр дор хаяж 2 тэмдэгттэй байна.";
  }

  if (input.slug.trim().length < 3) {
    return "Холбоос дор хаяж 3 тэмдэгттэй байна.";
  }

  return null;
}

export function validateProductInput(input: {
  name: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStock: number;
}) {
  if (!input.name.trim()) {
    return "Бүтээгдэхүүний нэр шаардлагатай.";
  }

  if (
    ![
      input.costPrice,
      input.salePrice,
      input.currentStock,
      input.minStock,
    ].every((value) => Number.isFinite(value) && value >= 0)
  ) {
    return "Үнэ болон үлдэгдлийн утгууд 0 эсвэл түүнээс их тоо байх ёстой.";
  }

  return null;
}

export function validateExpenseInput(input: {
  category: string;
  amount: number;
}) {
  if (!input.category.trim()) {
    return "Ангилал шаардлагатай.";
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return "Зарлагын дүн 0-ээс их байх ёстой.";
  }

  return null;
}

export function validateCategoryInput(input: { name: string }) {
  if (!input.name.trim()) {
    return "Ангиллын нэр шаардлагатай.";
  }

  return null;
}

export function validateContactInput(input: { name: string }) {
  if (!input.name.trim()) {
    return "Харилцагчийн нэр шаардлагатай.";
  }

  return null;
}

export function validateStockMovementInput(input: {
  productId: string;
  type: string;
  quantity: number;
}) {
  if (!input.productId.trim()) {
    return "Бүтээгдэхүүн сонгоно уу.";
  }

  if (!["in", "adjustment"].includes(input.type)) {
    return "Хөдөлгөөний төрөл буруу байна.";
  }

  if (input.type === "in" && input.quantity <= 0) {
    return "Орлогын тоо хэмжээ 0-ээс их байх ёстой.";
  }

  if (input.type === "adjustment" && input.quantity === 0) {
    return "Тохируулгын тоо хэмжээ 0-ээс ялгаатай байх ёстой.";
  }

  return null;
}

export function validateSaleInput(input: {
  productId: string;
  quantity: number;
  unitPrice: number;
  paidAmount: number;
  totalAmount: number;
}) {
  if (
    !input.productId ||
    !Number.isFinite(input.quantity) ||
    !Number.isFinite(input.unitPrice) ||
    input.quantity <= 0 ||
    input.unitPrice < 0
  ) {
    return "Бүтээгдэхүүн, тоо хэмжээ, үнэ зөв бөглөгдөх ёстой.";
  }

  if (
    !Number.isFinite(input.paidAmount) ||
    input.paidAmount < 0 ||
    input.paidAmount > input.totalAmount
  ) {
    return "Төлсөн дүн 0-ээс их бөгөөд нийт дүнгээс хэтрэхгүй байна.";
  }

  return null;
}
