/// Үйлчилгээний захиалгын төлөв.
enum ServiceBookingStatus {
  pending,
  confirmed,
  completed,
  cancelled,
}

extension ServiceBookingStatusLabel on ServiceBookingStatus {
  String get label => switch (this) {
    ServiceBookingStatus.pending => 'Хүлээгдэж буй',
    ServiceBookingStatus.confirmed => 'Баталгаажсан',
    ServiceBookingStatus.completed => 'Дууссан',
    ServiceBookingStatus.cancelled => 'Цуцалсан',
  };
}
