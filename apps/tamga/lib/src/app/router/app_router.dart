import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_providers.dart';
import '../../features/auth/domain/auth_state.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/phone_login_screen.dart';
import '../../features/auth/presentation/otp_verify_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/ai/presentation/breeding_advice_screen.dart';
import '../../features/analytics/presentation/analytics_screen.dart';
import '../../features/breeding/presentation/breeding_screen.dart';
import '../../features/certificates/presentation/certificate_screen.dart';
import '../../features/certificates/presentation/verify_certificate_screen.dart';
import '../../features/documents/presentation/horse_documents_screen.dart';
import '../../features/events/presentation/events_screen.dart';
import '../../features/events/presentation/partner_dashboard_screen.dart';
import '../../features/lineage/presentation/lineage_home_screen.dart';
import '../../features/lineage/presentation/inbreeding_calculator_screen.dart';
import '../../features/lost_horse/presentation/lost_horse_finder_screen.dart';
import '../../features/races/presentation/race_detail_screen.dart';
import '../../features/races/presentation/race_list_screen.dart';
import '../../features/market/presentation/conversation_screen.dart';
import '../../features/market/presentation/create_listing_screen.dart';
import '../../features/market/presentation/favorite_listings_screen.dart';
import '../../features/market/presentation/inbox_screen.dart';
import '../../features/market/presentation/listing_detail_screen.dart';
import '../../features/market/presentation/market_screen.dart';
import '../../features/market/presentation/moderation_queue_screen.dart';
import '../../features/market/presentation/my_listings_screen.dart';
import '../../features/market/presentation/price_history_screen.dart';
import '../../features/market/presentation/saved_searches_screen.dart';
import '../../features/market/presentation/seller_profile_screen.dart';
import '../../features/market/presentation/seller_verification_screen.dart';
import '../../features/social/presentation/breeder_profile_screen.dart';
import '../../features/social/presentation/leaderboard_screen.dart';
import '../../features/market/domain/market_conversation.dart';
import '../../features/market/domain/market_listing.dart';
import '../../features/map/presentation/report_lost_horse_screen.dart';
import '../../features/map/presentation/active_reports_screen.dart';
import '../../features/onboarding/presentation/onboarding_screen.dart';
import '../../features/payments/presentation/payment_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../../features/profile/presentation/notification_preferences_screen.dart';
import '../../features/teams/presentation/pending_invitations_screen.dart';
import '../../features/teams/presentation/stable_profile_screen.dart';
import '../../features/teams/presentation/team_management_screen.dart';
import '../../features/shared/presentation/conflict_resolution_screen.dart';
import '../../features/shared/presentation/sync_queue_screen.dart';
import '../../features/shared/presentation/sync_settings_screen.dart';
import '../../features/race_videos/presentation/race_videos_screen.dart';
import '../../features/search/presentation/search_screen.dart';
import '../../features/services/domain/service_provider_type.dart';
import '../../features/services/presentation/booking_screen.dart';
import '../../features/services/presentation/vet_connect_screen.dart';
import '../../features/services/presentation/provider_dashboard_screen.dart';
import '../../features/stable/presentation/stable_screen.dart';
import '../../features/shell/presentation/app_shell.dart';

/// Override this in main.dart's ProviderScope to set the correct initial
/// route based on onboarding state read before runApp.
final initialRouteProvider = Provider<String>((ref) => '/lineage');

/// A listenable that triggers GoRouter redirect re-evaluation.
///
/// Global ValueNotifier (not Riverpod) — mutated directly in auth
/// listener callbacks to avoid `_dirty` assertion during ProviderScope
/// mount (Riverpod issue #4781).
final routerRefreshNotifier = ValueNotifier<int>(0);

/// Public routes that don't require authentication.
const _publicRoutes = <String>{
  '/login',
  '/register',
  '/phone-login',
  '/phone-verify',
  '/onboarding',
  '/certificates/verify',
};

/// GoRouter redirect guard logic.
///
/// Returns a redirect path or `null` if no redirect is needed.
/// - Loading state: no redirect (splash screen is shown)
/// - Unauthenticated: redirect protected routes to `/login`
/// - Authenticated: redirect `/login` and `/register` to `/lineage`
@visibleForTesting
String? authGuardRedirect(AuthState? authState, String location) {
  // During loading state, allow all navigation (splash screen handles UI)
  if (authState == null || authState.isLoading) return null;

  // Unauthenticated users: redirect all non-public routes to /login
  if (authState.isUnauthenticated) {
    if (!_publicRoutes.contains(location)) return '/login';
    return null;
  }

  // Authenticated users (including anonymous): redirect auth screens to /lineage
  if (authState.isAuthenticated) {
    if (location == '/login' || location == '/register') return '/lineage';
    return null;
  }
  return null;
}

/// The app's GoRouter instance.
///
/// The initial route is determined before runApp (in main.dart) so the
/// first frame renders the correct screen without any redirects or
/// post-frame navigation — avoiding semantics tree mutations during
/// the warm-up frame.
final appRouterProvider = Provider<GoRouter>((ref) {
  final initialRoute = ref.watch(initialRouteProvider);
  return GoRouter(
    initialLocation: initialRoute,
    refreshListenable: routerRefreshNotifier,

    // ── Redirect guard ─────────────────────────────────────────
    // Хэрэглэгчийн нэвтрэх төлөвөөр route-уудыг хамгаална.
    redirect: (context, state) {
      final authValue = ref.read(authStateProvider);
      final authState = authValue.valueOrNull;
      final redirect = authGuardRedirect(authState, state.uri.path);

      // Хэрэв redirect байхгүй эсвэл хэрэглэгч нэвтрээгүй бол redirect-ийг шууд буцаах.
      if (redirect == null || redirect == '/login') return redirect;

      // Authenticated user login/register дээр байгаа:
      // Хадгалагдсан чиглэл байвал түүн рүү шилжих (public route-уудыг эс тооцвол).
      if (authState != null && authState.isAuthenticated) {
        final preservedRoute = ref.read(preservedRouteAfterReAuthProvider);
        if (preservedRoute != null && !_publicRoutes.contains(preservedRoute)) {
          // Хадгалагдсан чиглэлийг сэргээж, цэвэрлэх.
          ref.read(preservedRouteAfterReAuthProvider.notifier).state = null;
          return preservedRoute;
        }
      }

      return redirect;
    },

    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (ctx, state) => const OnboardingScreen(),
      ),

      // ── Нэвтрэх / Бүртгүүлэх (shell-гүй) ──
      GoRoute(path: '/login', builder: (ctx, state) => const LoginScreen()),
      GoRoute(
        path: '/register',
        builder: (ctx, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/phone-login',
        builder: (ctx, state) => const PhoneLoginScreen(),
      ),
      GoRoute(
        path: '/phone-verify',
        builder: (ctx, state) {
          final phone = state.extra as String? ?? '';
          return OtpVerifyScreen(phone: phone);
        },
      ),
      GoRoute(
        path: '/race-videos',
        builder: (ctx, state) => const RaceVideosScreen(),
      ),
      GoRoute(
        path: '/races',
        builder: (ctx, state) => const RaceListScreen(),
        routes: [
          GoRoute(
            path: ':raceId',
            builder: (ctx, state) {
              return RaceDetailScreen(raceId: state.pathParameters['raceId']!);
            },
          ),
        ],
      ),
      GoRoute(path: '/search', builder: (ctx, state) => const SearchScreen()),
      GoRoute(path: '/payment', builder: (ctx, state) => const PaymentScreen()),
      GoRoute(path: '/stable', builder: (ctx, state) => const StableScreen()),
      GoRoute(
        path: '/certificates/verify',
        builder: (ctx, state) => const VerifyCertificateScreen(),
      ),
      GoRoute(
        path: '/certificates/:certificateId',
        builder: (ctx, state) {
          return CertificateScreen(
            certificateId: state.pathParameters['certificateId']!,
          );
        },
      ),
      GoRoute(
        path: '/horses/:horseId/documents',
        builder: (ctx, state) {
          final horse = state.extra as dynamic;
          return HorseDocumentsScreen(horse: horse);
        },
      ),
      GoRoute(
        path: '/breeding',
        builder: (ctx, state) => const BreedingScreen(),
        routes: [
          GoRoute(
            path: 'ai',
            builder: (ctx, state) => const BreedingAdviceScreen(),
          ),
        ],
      ),
      GoRoute(
        path: '/inbox',
        builder: (ctx, state) => const InboxScreen(),
        routes: [
          GoRoute(
            path: ':conversationId',
            builder: (ctx, state) {
              final extra = state.extra;
              MarketConversation? conversation;
              String? title;
              if (extra is MarketConversation) {
                conversation = extra;
              } else if (extra is Map<String, dynamic>) {
                conversation = extra['conversation'] as MarketConversation?;
                title = extra['title'] as String?;
              }
              return ConversationScreen(
                conversationId: state.pathParameters['conversationId']!,
                conversation: conversation,
                title: title,
              );
            },
          ),
        ],
      ),

      // ── Үйлчилгээ / Services ──
      GoRoute(
        path: '/services/booking',
        builder: (ctx, state) {
          final extra = state.extra;
          ServiceProviderType? providerType;
          String? providerId;
          if (extra is Map<String, dynamic>) {
            providerType = extra['providerType'] as ServiceProviderType?;
            providerId = extra['providerId'] as String?;
          }
          return BookingScreen(
            providerType: providerType,
            providerId: providerId,
          );
        },
      ),
      GoRoute(
        path: '/services/vet-connect',
        builder: (ctx, state) => const VetConnectScreen(),
      ),
      GoRoute(
        path: '/services/provider-dashboard',
        builder: (ctx, state) => const ProviderDashboardScreen(),
      ),

      // ── Гол хуудсууд (StatefulShellRoute — 5 tab) ──
      StatefulShellRoute.indexedStack(
        builder: (ctx, state, navigationShell) {
          return AppShell(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/lineage',
                builder: (ctx, state) => const LineageHomeScreen(),
                routes: [
                  GoRoute(
                    path: 'coi',
                    builder: (ctx, state) => const InbreedingCalculatorScreen(),
                  ),
                ],
              ),
            ],
          ),

          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/market',
                builder: (ctx, state) => const MarketScreen(),
                routes: [
                  GoRoute(
                    path: 'create',
                    builder: (ctx, state) => const CreateListingScreen(),
                  ),
                  GoRoute(
                    path: 'edit/:listingId',
                    builder: (ctx, state) => CreateListingScreen(
                      listing: state.extra as MarketListing?,
                    ),
                  ),
                  GoRoute(
                    path: 'my-listings',
                    builder: (ctx, state) => const MyListingsScreen(),
                  ),
                  GoRoute(
                    path: 'price-history',
                    builder: (ctx, state) => const PriceHistoryScreen(),
                  ),
                  GoRoute(
                    path: 'favorites',
                    builder: (ctx, state) => const FavoriteListingsScreen(),
                  ),
                  GoRoute(
                    path: 'seller-profile',
                    builder: (ctx, state) {
                      final extra = state.extra as Map<String, String>? ?? {};
                      return SellerProfileScreen(
                        sellerId: extra['sellerId'] ?? '',
                        listingId: extra['listingId'] ?? '',
                      );
                    },
                  ),
                  GoRoute(
                    path: 'breeder-profile',
                    builder: (ctx, state) {
                      final extra = state.extra as Map<String, String>? ?? {};
                      return BreederProfileScreen(
                        sellerId: extra['sellerId'] ?? '',
                      );
                    },
                  ),
                  GoRoute(
                    path: 'leaderboard',
                    builder: (ctx, state) => const LeaderboardScreen(),
                  ),
                  GoRoute(
                    path: ':listingId',
                    builder: (ctx, state) {
                      return ListingDetailScreen(
                        listingId: state.pathParameters['listingId']!,
                      );
                    },
                  ),
                ],
              ),
            ],
          ),

          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/events',
                builder: (ctx, state) => const EventsScreen(),
              ),
            ],
          ),

          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/lost-horse',
                builder: (ctx, state) => const LostHorseFinderScreen(),
                routes: [
                  GoRoute(
                    path: 'report',
                    builder: (ctx, state) => const ReportLostHorseScreen(),
                  ),
                  GoRoute(
                    path: 'active',
                    builder: (ctx, state) => const ActiveReportsScreen(),
                  ),
                ],
              ),
            ],
          ),

          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                builder: (ctx, state) => const ProfileScreen(),
                routes: [
                  GoRoute(
                    path: 'inbox',
                    builder: (ctx, state) => const InboxScreen(),
                  ),
                  GoRoute(
                    path: 'notifications',
                    builder: (ctx, state) =>
                        const NotificationPreferencesScreen(),
                  ),
                  GoRoute(
                    path: 'sync-queue',
                    builder: (ctx, state) => const SyncQueueScreen(),
                  ),
                  GoRoute(
                    path: 'sync-settings',
                    builder: (ctx, state) => const SyncSettingsScreen(),
                  ),
                  GoRoute(
                    path: 'sync-conflicts',
                    builder: (ctx, state) => const ConflictResolutionScreen(),
                  ),
                  GoRoute(
                    path: 'moderation',
                    builder: (ctx, state) => const ModerationQueueScreen(),
                  ),
                  GoRoute(
                    path: 'verification',
                    builder: (ctx, state) => const SellerVerificationScreen(),
                  ),
                  GoRoute(
                    path: 'saved-searches',
                    builder: (ctx, state) => const SavedSearchesScreen(),
                  ),
                  GoRoute(
                    path: 'partner-dashboard',
                    builder: (ctx, state) => const PartnerDashboardScreen(),
                  ),
                  GoRoute(
                    path: 'analytics',
                    builder: (ctx, state) => const AnalyticsScreen(),
                  ),
                  GoRoute(
                    path: 'stable',
                    builder: (ctx, state) => const StableProfileScreen(),
                  ),
                  GoRoute(
                    path: 'invitations',
                    builder: (ctx, state) => const PendingInvitationsScreen(),
                  ),
                  GoRoute(
                    path: 'team',
                    builder: (ctx, state) => const TeamManagementScreen(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );
});
