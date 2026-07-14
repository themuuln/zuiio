enum SellerVerificationStatus { unverified, verified, trustedStable }

class SellerProfile {
  const SellerProfile({
    required this.sellerId,
    required this.displayName,
    required this.stableName,
    required this.locationLabel,
    required this.verificationStatus,
    required this.verificationLabel,
    required this.responseNote,
    required this.bio,
    this.averageRating = 0.0,
    this.ratingCount = 0,
    this.reviews = const [],
  });

  final String sellerId;
  final String displayName;
  final String stableName;
  final String locationLabel;
  final SellerVerificationStatus verificationStatus;
  final String verificationLabel;
  final String responseNote;
  final String bio;
  final double averageRating;
  final int ratingCount;
  final List<String> reviews;

  SellerProfile copyWith({
    String? sellerId,
    String? displayName,
    String? stableName,
    String? locationLabel,
    SellerVerificationStatus? verificationStatus,
    String? verificationLabel,
    String? responseNote,
    String? bio,
    double? averageRating,
    int? ratingCount,
    List<String>? reviews,
  }) {
    return SellerProfile(
      sellerId: sellerId ?? this.sellerId,
      displayName: displayName ?? this.displayName,
      stableName: stableName ?? this.stableName,
      locationLabel: locationLabel ?? this.locationLabel,
      verificationStatus: verificationStatus ?? this.verificationStatus,
      verificationLabel: verificationLabel ?? this.verificationLabel,
      responseNote: responseNote ?? this.responseNote,
      bio: bio ?? this.bio,
      averageRating: averageRating ?? this.averageRating,
      ratingCount: ratingCount ?? this.ratingCount,
      reviews: reviews ?? this.reviews,
    );
  }

  factory SellerProfile.fromJson(Map<String, dynamic> json) {
    return SellerProfile(
      sellerId: json['sellerId'] as String,
      displayName: json['displayName'] as String,
      stableName: json['stableName'] as String,
      locationLabel: json['locationLabel'] as String,
      verificationStatus: SellerVerificationStatus.values.byName(
        json['verificationStatus'] as String,
      ),
      verificationLabel: json['verificationLabel'] as String,
      responseNote: json['responseNote'] as String,
      bio: json['bio'] as String,
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: json['ratingCount'] as int? ?? 0,
      reviews: List<String>.from(json['reviews'] as List? ?? const []),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'sellerId': sellerId,
      'displayName': displayName,
      'stableName': stableName,
      'locationLabel': locationLabel,
      'verificationStatus': verificationStatus.name,
      'verificationLabel': verificationLabel,
      'responseNote': responseNote,
      'bio': bio,
      'averageRating': averageRating,
      'ratingCount': ratingCount,
      'reviews': reviews,
    };
  }
}

enum MarketInquiryStatus {
  newInquiry,
  sellerReplied,
  viewingScheduled,
  vetCheck,
  offer,
  sold,
  closed,
}

extension MarketInquiryStatusLabel on MarketInquiryStatus {
  String get label => switch (this) {
    MarketInquiryStatus.newInquiry => 'New inquiry',
    MarketInquiryStatus.sellerReplied => 'Seller replied',
    MarketInquiryStatus.viewingScheduled => 'Viewing scheduled',
    MarketInquiryStatus.vetCheck => 'Vet check',
    MarketInquiryStatus.offer => 'Offer',
    MarketInquiryStatus.sold => 'Sold',
    MarketInquiryStatus.closed => 'Closed',
  };

  String get storageValue => switch (this) {
    MarketInquiryStatus.newInquiry => 'new',
    MarketInquiryStatus.sellerReplied => 'sellerReplied',
    MarketInquiryStatus.viewingScheduled => 'viewingScheduled',
    MarketInquiryStatus.vetCheck => 'vetCheck',
    MarketInquiryStatus.offer => 'offer',
    MarketInquiryStatus.sold => 'sold',
    MarketInquiryStatus.closed => 'closed',
  };
}

MarketInquiryStatus marketInquiryStatusFromJson(String value) {
  return switch (value) {
    'new' => MarketInquiryStatus.newInquiry,
    _ => MarketInquiryStatus.values.byName(value),
  };
}

class MarketInquiry {
  const MarketInquiry({
    required this.id,
    required this.listingId,
    required this.buyerId,
    required this.sellerId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String listingId;
  final String buyerId;
  final String sellerId;
  final MarketInquiryStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory MarketInquiry.fromJson(Map<String, dynamic> json) {
    return MarketInquiry(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      buyerId: json['buyerId'] as String,
      sellerId: json['sellerId'] as String,
      status: marketInquiryStatusFromJson(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'buyerId': buyerId,
      'sellerId': sellerId,
      'status': status.storageValue,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

enum ListingReportStatus { submitted, reviewing, resolved }

extension ListingReportStatusLabel on ListingReportStatus {
  String get label => switch (this) {
    ListingReportStatus.submitted => 'Submitted',
    ListingReportStatus.reviewing => 'Reviewing',
    ListingReportStatus.resolved => 'Resolved',
  };
}

class ListingReport {
  const ListingReport({
    required this.id,
    required this.listingId,
    required this.reporterId,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String listingId;
  final String reporterId;
  final String reason;
  final ListingReportStatus status;
  final DateTime createdAt;

  factory ListingReport.fromJson(Map<String, dynamic> json) {
    return ListingReport(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      reporterId: json['reporterId'] as String,
      reason: json['reason'] as String,
      status: ListingReportStatus.values.byName(json['status'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'listingId': listingId,
      'reporterId': reporterId,
      'reason': reason,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}
