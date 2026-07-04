---
title: Удамын шийдвэрүүд
description: Lineage feature-ийн шийдвэрийн хүснэгт, логик сонголтууд.
---

# Удамын шийдвэрүүд

## Decision table: дэлгэцийн төлөв
| Нөхцөл | Шийдвэр | Үр дүн |
| --- | --- | --- |
| Апп анх ачаалсан | `initialLocation = '/lineage'` | Удамын feature хамгийн түрүүнд харагдана |
| Root chip сонгосон | `selectedLineageRootId`, `selectedPedigreeNodeId` update хийнэ | Шинэ root-ийн snapshot ачаална |
| Root chip сонгосон | `lineageHomeView = LineageHomeView.tree` | Root солих бүрт tree рүү буцна |
| View = `tree` | Tree canvas + depth filter үзүүлнэ | Дүрслэл төвтэй хэрэглээ |
| View = `list` | `relatedHorses` жагсаана | Хялбар унших горим |
| View = `timeline` | `timeline` event-үүдийг жагсаана | Цаг хугацааны дараалал |
| Depth = `three`, `five`, `full` | `maxGeneration`-ийг provider-оор тооцно | Tree node filtering хийнэ |
| Unknown root id | Эхний snapshot fallback | UI хоосрохгүй |

## Decision table: визуал ялгалт
| Нөхцөл | Шийдвэр |
| --- | --- |
| `isRoot = true` | Root card `primaryContainer` өнгөтэй |
| `isOwnedByHousehold = true` | `Өрхийн` badge харуулна |
| `isOwnedByHousehold = false` | `Гаднах` badge харуулна |
| `hiddenBranchCount > 0` | `+N` badge харуулна |
| Edge нь selected node-тэй холбоотой | Primary өнгөөр highlight хийнэ |
| `photoUrl` байвал | `CircleAvatar(backgroundImage)` ашиглана |
| `photoUrl` байхгүй + `sex = 'stallion'` | 🐎 эможи (`primaryContainer` дэвсгэр) |
| `photoUrl` байхгүй + `sex = 'mare'` | 🐴 эможи (`tertiaryContainer` дэвсгэр) |
| `tamgaNo` байвал | Card footer-т `primaryContainer` badge харуулна |
| Node сонгосон | `AnimatedSwitcher` + fade/slide transition (220ms) |
| Detail panel | `_StatChip` grid: Шагнал, Үр төл, Тамга, Хурд |

## Архитектурын шийдвэр
1. State management-д `flutter_riverpod` ашигласан.
2. Navigation-д `go_router` + `StatefulShellRoute.indexedStack` ашигласан.
3. Data source нь одоогоор `LocalLineageRepository`. Supabase руу шилжих төлөвтэй.
4. Layout тооцоог UI-аас салгаж `buildPedigreeLayout` функцэд төвлөрүүлсэн.
5. `graphview` пакет ашиглахгүй — custom Buchheim-Walker layout нь bidirectional (ancestor/descendant) дэмжинэ.
6. Material 3 `colorScheme` ашигласан — hardcoded өнгө ашиглахгүй (dark mode дэмжих).

## Evidence
- `lib/src/app/router/app_router.dart`
- `lib/src/features/lineage/application/lineage_roots_provider.dart`
- `lib/src/features/lineage/application/pedigree_layout.dart`
- `lib/src/features/lineage/presentation/pedigree_tree_view.dart`
