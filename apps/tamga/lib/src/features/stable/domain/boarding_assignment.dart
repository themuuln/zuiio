/// Адууны байршлын (boarding) бүртгэл.
library;

/// Байршлын төлөв.
enum BoardingStatus {
  /// Идэвхтэй байршиж буй.
  active,

  /// Түр завсарласан (эзэн нь аваад явсан, буцах магадлалтай).
  paused,

  /// Гарсан.
  ended,
}

/// Адууны байршлын бүртгэл.
class BoardingAssignment {
  const BoardingAssignment({
    required this.id,
    required this.stableId,
    required this.horseId,
    required this.horseName,
    required this.ownerId,
    required this.ownerName,
    required this.startedAt,
    this.endedAt,
    this.status = BoardingStatus.active,
    this.monthlyFee = 0,
    this.notes = '',
  });

  final String id;
  final String stableId;
  final String horseId;
  final String horseName;
  final String ownerId;
  final String ownerName;
  final DateTime startedAt;
  final DateTime? endedAt;
  final BoardingStatus status;
  final int monthlyFee; // MNT
  final String notes;

  BoardingAssignment copyWith({
    String? id,
    String? stableId,
    String? horseId,
    String? horseName,
    String? ownerId,
    String? ownerName,
    DateTime? startedAt,
    DateTime? endedAt,
    BoardingStatus? status,
    int? monthlyFee,
    String? notes,
  }) {
    return BoardingAssignment(
      id: id ?? this.id,
      stableId: stableId ?? this.stableId,
      horseId: horseId ?? this.horseId,
      horseName: horseName ?? this.horseName,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      startedAt: startedAt ?? this.startedAt,
      endedAt: endedAt ?? this.endedAt,
      status: status ?? this.status,
      monthlyFee: monthlyFee ?? this.monthlyFee,
      notes: notes ?? this.notes,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'stableId': stableId,
    'horseId': horseId,
    'horseName': horseName,
    'ownerId': ownerId,
    'ownerName': ownerName,
    'startedAt': startedAt.toIso8601String(),
    'endedAt': endedAt?.toIso8601String(),
    'status': status.name,
    'monthlyFee': monthlyFee,
    'notes': notes,
  };

  factory BoardingAssignment.fromJson(Map<String, dynamic> json) =>
      BoardingAssignment(
        id: json['id'] as String,
        stableId: json['stableId'] as String,
        horseId: json['horseId'] as String,
        horseName: json['horseName'] as String,
        ownerId: json['ownerId'] as String,
        ownerName: json['ownerName'] as String,
        startedAt: DateTime.parse(json['startedAt'] as String),
        endedAt: json['endedAt'] != null
            ? DateTime.parse(json['endedAt'] as String)
            : null,
        status: BoardingStatus.values.byName(
          json['status'] as String? ?? 'active',
        ),
        monthlyFee: json['monthlyFee'] as int? ?? 0,
        notes: json['notes'] as String? ?? '',
      );

  String get statusLabel {
    switch (status) {
      case BoardingStatus.active:
        return 'Идэвхтэй';
      case BoardingStatus.paused:
        return 'Түр завсарласан';
      case BoardingStatus.ended:
        return 'Гарсан';
    }
  }
}
