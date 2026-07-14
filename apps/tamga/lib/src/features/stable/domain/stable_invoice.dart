/// Нэхэмжлэх (invoice).
library;

/// Нэхэмжлэхийн төлөв.
enum InvoiceStatus {
  /// Төлөгдөөгүй.
  unpaid,

  /// Төлбөр хэсэгчлэн төлөгдсөн.
  partial,

  /// Бүрэн төлөгдсөн.
  paid,

  /// Цуцлагдсан.
  cancelled,
}

/// Нэхэмжлэхийн мөр.
class InvoiceLineItem {
  const InvoiceLineItem({
    required this.description,
    required this.amount,
    this.quantity = 1,
  });

  final String description;
  final int quantity;
  final int amount; // MNT (unit price)

  int get total => amount * quantity;

  Map<String, dynamic> toJson() => {
    'description': description,
    'quantity': quantity,
    'amount': amount,
  };

  factory InvoiceLineItem.fromJson(Map<String, dynamic> json) =>
      InvoiceLineItem(
        description: json['description'] as String,
        quantity: json['quantity'] as int? ?? 1,
        amount: json['amount'] as int,
      );
}

/// Нэхэмжлэх.
class StableInvoice {
  const StableInvoice({
    required this.id,
    required this.stableId,
    required this.clientId,
    required this.clientName,
    required this.issuedAt,
    this.dueAt,
    this.paidAt,
    this.status = InvoiceStatus.unpaid,
    this.lineItems = const [],
    this.notes = '',
  });

  final String id;
  final String stableId;
  final String clientId;
  final String clientName;
  final DateTime issuedAt;
  final DateTime? dueAt;
  final DateTime? paidAt;
  final InvoiceStatus status;
  final List<InvoiceLineItem> lineItems;
  final String notes;

  /// Нийт дүн.
  int get totalAmount => lineItems.fold(0, (sum, item) => sum + item.total);

  /// Төлөгдөх дүн (status дээр тулгуурлан).
  int get outstandingAmount =>
      status == InvoiceStatus.paid || status == InvoiceStatus.cancelled
      ? 0
      : totalAmount;

  StableInvoice copyWith({
    String? id,
    String? stableId,
    String? clientId,
    String? clientName,
    DateTime? issuedAt,
    DateTime? dueAt,
    DateTime? paidAt,
    InvoiceStatus? status,
    List<InvoiceLineItem>? lineItems,
    String? notes,
  }) {
    return StableInvoice(
      id: id ?? this.id,
      stableId: stableId ?? this.stableId,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      issuedAt: issuedAt ?? this.issuedAt,
      dueAt: dueAt ?? this.dueAt,
      paidAt: paidAt ?? this.paidAt,
      status: status ?? this.status,
      lineItems: lineItems ?? this.lineItems,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'stableId': stableId,
    'clientId': clientId,
    'clientName': clientName,
    'issuedAt': issuedAt.toIso8601String(),
    'dueAt': dueAt?.toIso8601String(),
    'paidAt': paidAt?.toIso8601String(),
    'status': status.name,
    'lineItems': lineItems.map((e) => e.toJson()).toList(),
    'notes': notes,
  };

  factory StableInvoice.fromJson(Map<String, dynamic> json) => StableInvoice(
    id: json['id'] as String,
    stableId: json['stableId'] as String,
    clientId: json['clientId'] as String,
    clientName: json['clientName'] as String,
    issuedAt: DateTime.parse(json['issuedAt'] as String),
    dueAt: json['dueAt'] != null
        ? DateTime.parse(json['dueAt'] as String)
        : null,
    paidAt: json['paidAt'] != null
        ? DateTime.parse(json['paidAt'] as String)
        : null,
    status: InvoiceStatus.values.byName(json['status'] as String? ?? 'unpaid'),
    lineItems:
        (json['lineItems'] as List?)
            ?.map((e) => InvoiceLineItem.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
    notes: json['notes'] as String? ?? '',
  );

  String get statusLabel {
    switch (status) {
      case InvoiceStatus.unpaid:
        return 'Төлөгдөөгүй';
      case InvoiceStatus.partial:
        return 'Хэсэгчилсэн';
      case InvoiceStatus.paid:
        return 'Төлөгдсөн';
      case InvoiceStatus.cancelled:
        return 'Цуцлагдсан';
    }
  }
}
