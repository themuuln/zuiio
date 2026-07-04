/// Хэрэглэгчийн нэвтрэх төлөв.
enum AuthStatus { authenticated, unauthenticated, loading }

/// Хэрэглэгчийн нэвтрэх мэдээлэл.
class AuthState {
  const AuthState({
    required this.status,
    this.userId,
    this.email,
    this.phone,
    this.displayName,
    this.avatarUrl,
    this.isAnonymous = false,
  });

  const AuthState.authenticated({
    required String this.userId,
    this.email,
    this.phone,
    this.displayName,
    this.avatarUrl,
    this.isAnonymous = false,
  }) : status = AuthStatus.authenticated;

  const AuthState.unauthenticated()
    : status = AuthStatus.unauthenticated,
      userId = null,
      email = null,
      phone = null,
      displayName = null,
      avatarUrl = null,
      isAnonymous = false;

  const AuthState.loading()
    : status = AuthStatus.loading,
      userId = null,
      email = null,
      phone = null,
      displayName = null,
      avatarUrl = null,
      isAnonymous = false;

  final AuthStatus status;
  final String? userId;
  final String? email;
  final String? phone;
  final String? displayName;
  final String? avatarUrl;
  final bool isAnonymous;

  bool get isAuthenticated => status == AuthStatus.authenticated;
  bool get isUnauthenticated => status == AuthStatus.unauthenticated;
  bool get isLoading => status == AuthStatus.loading;
  bool get hasEmail => email != null && email!.isNotEmpty;
  bool get hasPhone => phone != null && phone!.isNotEmpty;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is AuthState &&
          status == other.status &&
          userId == other.userId &&
          email == other.email &&
          phone == other.phone &&
          displayName == other.displayName &&
          avatarUrl == other.avatarUrl &&
          isAnonymous == other.isAnonymous;

  @override
  int get hashCode => Object.hash(
    status,
    userId,
    email,
    phone,
    displayName,
    avatarUrl,
    isAnonymous,
  );

  @override
  String toString() =>
      'AuthState(status: $status, userId: $userId, '
      'email: $email, isAnonymous: $isAnonymous)';
}
