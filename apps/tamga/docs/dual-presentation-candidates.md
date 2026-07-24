# Dual-Presentation (Sheet + Full Page) Candidates

> Analysis date: 2026-07-23
>
> Converting a page to *dual presentation* means it opens as a smooth bottom sheet when triggered
> in-app (e.g., from a list or card), but as a full `Scaffold` page when navigated to directly
> via deep link or GoRouter. Follows the `QuickCreateSheet` Dribbble-style pattern.

## Completed

### HorseDocumentsScreen (`/horses/:horseId/documents`)

|Mode|Entry point|
|---|---|
|**Sheet**|`horse_info_tab.dart` → `Navigator.push(context, HorseDocumentsSheet.route(horse: horse))`|
|**Full page**|GoRouter `/horses/:horseId/documents` → `HorseDocumentsScreen` (unchanged)|

### QuickCreateSheet (`/quick-create`)

|Mode|Entry point|
|---|---|
|**Sheet**|FAB → `ModalSheetRoute(builder: (_) => QuickCreateSheet())`|
|**Full page**|GoRouter `/quick-create` → `_QuickCreateFullPage`|

## Migration Pattern

```dart
// 1. Route path constant
const String myRoutePath = '/path';

// 2. Full page route function
GoRoute myFullPageRoute() {
  return GoRoute(
    path: myRoutePath,
    builder: (ctx, state) => MyScreen(...),
  );
}

// 3. Static route method on sheet class
class MySheet extends ConsumerWidget {
  static ModalSheetRoute<void> route({required Arg arg}) {
    return ModalSheetRoute(
      swipeDismissible: true,
      swipeDismissSensitivity: const SwipeDismissSensitivity(...),
      builder: (_) => MySheet(arg: arg),
    );
  }
  // ...
}
```

## Remaining Candidates — Prioritized

### Tier 1 — Light & Peek-Friendly (< 400 lines, low risk)

|Page|Lines|Path|Why sheet fits|
|---|---|---|---|
|`SearchScreen`|238|`/search`|Quick search → type & dismiss. Natural sheet UX.|
|`HorseDocumentsScreen`|304|DONE ✅||
|`NotificationPreferencesScreen`|313|`/profile/notifications`|Simple toggle switches.|
|`StableProfileScreen`|383|`/profile/stable`|Team/stable info peek from any team context.|

### Tier 2 — Medium (400–700 lines, good ROI)

|Page|Lines|Path|Why sheet fits|
|---|---|---|---|
|`EventsScreen`|403|`/events`|Calendar peek from dashboard.|
|`BreederProfileScreen`|412|`/market/breeder-profile`|Seller profile peek from market listing.|
|`CertificateScreen`|430|`/certificates/:id`|Quick cert view from horse detail.|
|`RaceVideosScreen`|508|`/race-videos`|Video grid peek.|
|`ConflictResolutionScreen`|502|`/profile/sync-conflicts`|Sync conflict list from profile.|
|`VetConnectScreen`|545|`/services/vet-connect`|Already modal by design.|
|`SellerProfileScreen`|580|`/market/seller-profile`|Seller profile peek.|
|`PartnerDashboardScreen`|673|`/profile/partner-dashboard`|Partner stats peek.|

### Tier 3 — Heavy (> 700 lines, lower priority)

|Page|Lines|Path|Complexity|
|---|---|---|---|
|`RaceDetailScreen`|877|`/races/:raceId`|Peek race info from list. Would need list/summary extraction.|
|`ListingDetailScreen`|1363|`/market/:listingId`|Peek listing card, expand for full. Significant extraction.|
|`AnalyticsScreen`|1134|`/profile/analytics`|Deep chart content, partial only.|
|`PaymentScreen`|754|`/payment`|Payment flow, step-based.|
|`CreateListingScreen`|963|`/market/create`|Complex form, not sheet-friendly.|
## Remaining `showModalBottomSheet` Cleanup

~~These 4 files still use `showModalBottomSheet` directly (not migrated to `showSmoothSheet`):~~

**All 4 migrated. Zero `showModalBottomSheet` calls remain.** ✅
