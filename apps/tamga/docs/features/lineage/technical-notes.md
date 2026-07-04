---
title: Удамын техникийн тэмдэглэл
description: Lineage feature-ийн route, provider, domain model, rendering implementation.
---

# Удамын техникийн тэмдэглэл

## Архитектур
- Entry: `main.dart` -> `ProviderScope(child: TamgaApp())`
- App shell: `MaterialApp.router` + `appRouterProvider`
- Navigation shell: `StatefulShellRoute.indexedStack`
- Core feature path: `lib/src/features/lineage/`

## Route map
| Route | Төлөв | Builder |
| --- | --- | --- |
| `/lineage` | Идэвхтэй feature | `LineageHomeScreen` |
| `/horses` | Placeholder | `PlaceholderScreen` |
| `/events` | Placeholder | `PlaceholderScreen` |
| `/search` | Placeholder | `PlaceholderScreen` |
| `/profile` | Placeholder | `PlaceholderScreen` |

## State providers
| Provider | Төрөл | Үүрэг |
| --- | --- | --- |
| `sessionModeProvider` | `Provider<SessionMode>` | Одоогийн session төлөв (`guestLocal`) |
| `lineageRepositoryProvider` | `Provider<LineageRepository>` | Data source injection |
| `selectedLineageRootIdProvider` | `StateProvider<String>` | Идэвхтэй root id |
| `lineageHomeViewProvider` | `StateProvider<LineageHomeView>` | `tree/list/timeline` view |
| `lineageTreeDepthProvider` | `StateProvider<LineageTreeDepth>` | Үеийн шүүлтүүр |
| `selectedPedigreeNodeIdProvider` | `StateProvider<String?>` | Сонгосон node |
| `lineageRootsProvider` | `FutureProvider<List<LineageRoot>>` | Root жагсаалт |
| `lineageSnapshotProvider` | `FutureProvider<LineageSnapshot>` | Root snapshot |
| `pedigreeLayoutProvider` | `Provider<PedigreeLayoutResult?>` | Tree layout result |
| `selectedPedigreeNodeProvider` | `Provider<PedigreeNodeVm?>` | Сонгосон node-ийн VM |

## Data model
- `LineageRoot` — root адууны summary
- `LineageSnapshot` — root + summary + tree nodes/edges + related horses + timeline
- `LineageTreeNode` — tree дээрх node (photoUrl, sex, tamgaNo, region, speedIndex optional fields added 2026-06-08)
- `LineageTreeEdge` — `sire`, `dam`, `offspring` холбоос
- `LineageHorse` — list view item
- `LineageTimelineEntry` — timeline item

## Local data source
`LocalLineageRepository` нь:
- 2 root хадгална: `khan-khuleg`, `tsagaan-salkhi`
- Root тус бүрт `LineageSnapshot` өгнө
- `fetchSnapshot` дээр unknown id-д first snapshot fallback хийнэ

## Tree layout implementation
`buildPedigreeLayout` функц:
1. `maxGeneration`-оор харагдах node-уудыг шүүнэ.
2. Node-уудыг `generation`, `branchOrder`, `sortOrder`, `name` дарааллаар эрэмбэлнэ.
3. Row бүрийн өргөнийг тооцоод төвлөрсөн canvas үүсгэнэ.
4. Visible node-уудын edge-үүдийг л үлдээнэ.
5. `PedigreeNodeVm` ба `PedigreeEdgeVm` болгон UI-д дамжуулна.

## Tree rendering
`PedigreeTreeView` нь:
- `InteractiveViewer` ашиглана
- `boundaryMargin = 120`
- `maxScale = 2.8`
- `minScale = 0.45`
- Node card бүр `InkWell` tap interaction-тай
- `_NodeAvatar`: photo URL → horse emoji (🐎/🐴) → first-letter fallback
- Tamga badge: `tamgaNo` байвал card footer-т харуулна
- Edge painter нь `LineageTreeRelationType`-оос өнгө сонгоно
- `SelectedNodeCard`: avatar header + `_StatChip` grid (Шагнал, Үр төл, Тамга, Хурд) + region info
- `AnimatedSwitcher` + `FadeTransition` + `SlideTransition` (220ms) node солих үед

## UI composition
`LineageHomeScreen` дараах үндсэн хэсгүүдтэй:
- Hero-like app bar (`SliverAppBar.large`)
- Overview card
- Root chooser (`ChoiceChip`)
- View switcher (`SegmentedButton`)
- Tree/List/Timeline active section
- Selected node detail card (animated transitions)

## Theme
`AppTheme.light()` нь:
- `ColorScheme.fromSeed(seedColor: 0xFF8C5A2B)`
- `useMaterial3: true`
- Дугуй булантай card/navigation style

## Test coverage
`test/widget_test.dart` одоогоор:
- App shell render болохыг шалгана
- `Өрхийн удам мод`, `Хан Хүлэг`, bottom navigation labels-ийг батална
- `Морьд` tab tap хийж placeholder тайлбарыг шалгана

## Evidence
- `lib/main.dart`
- `lib/src/app/app.dart`
- `lib/src/app/router/app_router.dart`
- `lib/src/app/theme/app_theme.dart`
- `lib/src/features/session/application/session_mode_provider.dart`
- `lib/src/features/lineage/application/lineage_roots_provider.dart`
- `lib/src/features/lineage/application/pedigree_layout.dart`
- `lib/src/features/lineage/data/local_lineage_repository.dart`
- `lib/src/features/lineage/presentation/lineage_home_screen.dart`
- `lib/src/features/lineage/presentation/pedigree_tree_view.dart`
- `test/widget_test.dart`
