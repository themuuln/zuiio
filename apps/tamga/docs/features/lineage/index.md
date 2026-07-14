---
title: Удам
description: Tamga аппын lineage feature-ийн canonical documentation pack.
---

# Удам

## Товч танилцуулга
`Tamga` аппын одоогоор хамгийн бүрэн хэрэгжсэн хэсэг нь `lineage` feature байна. Энэ feature нь өрхийн адууны удам модыг `Tree`, `List`, `Timeline` гэсэн 3 харах хэлбэрээр үзүүлэх бөгөөд root азарга сонгож тухайн шугамын холбоосуудыг local mock өгөгдлөөр харуулдаг.

## Хамрах хүрээ
- `/lineage` маршрутаар эхлэх үндсэн дэлгэц
- Root азарга сонголт
- `Tree`, `List`, `Timeline` view
- Үеийн шүүлтүүр (`3 үе`, `5 үе`, `Бүгд`)
- Өрхийн болон гаднах адууг ялгах тэмдэглэгээ
- Доод navigation доторх бусад tab-уудын placeholder төлөв

## Одоогийн төлөв
- Төлөв: Prototype
- Итгэлцүүр: Medium-High
- Docs framework: VitePress
- Хүртээмжтэй зам: `/lineage`
- Хязгаарлалт: `guestLocal` session, local static data, бодит CRUD/sync байхгүй

## Хэнд зориулсан бэ
- Бизнес тал ба дүрэм: [business-rules.md](./business-rules.md)
- Урсгал ба QA: [user-flows.md](./user-flows.md), [scenarios.md](./scenarios.md)
- Шийдвэрүүд: [decisions.md](./decisions.md)
- Хөгжүүлэлт: [technical-notes.md](./technical-notes.md)
- Төлөв ба эрсдэл: [gap-analysis.md](./gap-analysis.md)

## Гол ажиглалт
| Сэдэв | Ажиглалт |
| --- | --- |
| Entry point | App `MaterialApp.router` ашиглаж, `GoRouter`-ийн `initialLocation` нь `/lineage`. |
| Core data | `LocalLineageRepository` нь 2 root (`khan-khuleg`, `tsagaan-salkhi`) болон snapshot-уудыг in-memory өгдөг. |
| State | Root, view, tree depth, selected node төлөвүүдийг Riverpod provider-уудаар удирддаг. |
| UI | Tree view нь `InteractiveViewer` дээр суурилсан pinch/pan canvas ашигладаг. |
| App breadth | `/horses`, `/events`, `/search`, `/profile` tab-ууд одоогоор placeholder дэлгэцтэй. |

## Evidence
- `lib/src/app/router/app_router.dart` — `initialLocation`, `/lineage`, бусад tab route-ууд
- `lib/src/features/lineage/presentation/lineage_home_screen.dart` — үндсэн lineage UI, root chooser, view switcher
- `lib/src/features/lineage/application/lineage_roots_provider.dart` — feature state provider-ууд
- `lib/src/features/lineage/data/local_lineage_repository.dart` — local roots, snapshots
- `lib/src/features/lineage/presentation/pedigree_tree_view.dart` — pinch/pan tree canvas
- `test/widget_test.dart` — shell болон `/horses` placeholder navigation smoke test
