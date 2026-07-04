class DigitalCertificate {
  const DigitalCertificate({
    required this.id,
    required this.horseId,
    required this.ownerId,
    required this.issuer,
    required this.issueDate,
    required this.certificateHash,
    required this.isVerified,
  });

  final String id;
  final String horseId;
  final String ownerId;
  final String issuer;
  final DateTime issueDate;
  final String certificateHash;
  final bool isVerified;

  DigitalCertificate copyWith({
    String? id,
    String? horseId,
    String? ownerId,
    String? issuer,
    DateTime? issueDate,
    String? certificateHash,
    bool? isVerified,
  }) {
    return DigitalCertificate(
      id: id ?? this.id,
      horseId: horseId ?? this.horseId,
      ownerId: ownerId ?? this.ownerId,
      issuer: issuer ?? this.issuer,
      issueDate: issueDate ?? this.issueDate,
      certificateHash: certificateHash ?? this.certificateHash,
      isVerified: isVerified ?? this.isVerified,
    );
  }

  factory DigitalCertificate.fromJson(Map<String, dynamic> json) {
    return DigitalCertificate(
      id: json['id'] as String,
      horseId: json['horseId'] as String,
      ownerId: json['ownerId'] as String,
      issuer: json['issuer'] as String,
      issueDate: DateTime.parse(json['issueDate'] as String),
      certificateHash: json['certificateHash'] as String,
      isVerified: json['isVerified'] as bool,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'horseId': horseId,
      'ownerId': ownerId,
      'issuer': issuer,
      'issueDate': issueDate.toIso8601String(),
      'certificateHash': certificateHash,
      'isVerified': isVerified,
    };
  }
}
