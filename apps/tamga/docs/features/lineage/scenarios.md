---
title: Удамын сценариуд
description: QA болон acceptance төрлийн жишээ сценариуд.
---

# Удамын сценариуд

## Сценари 1: Default lineage дэлгэц
**Given** апп анх нээгдсэн
**When** router эхэлнэ
**Then** хэрэглэгч `/lineage` дээр `Tamga`, `Өрхийн удам мод`, `Хан Хүлэг` мэдээллийг харна.

## Сценари 2: Root солих
**Given** lineage дэлгэц нээгдсэн
**When** хэрэглэгч `Цагаан Салхи` root chip-ийг дарна
**Then** шинэ root snapshot ачаалж, selected node нь root болж, харагдац `Tree` байна.

## Сценари 3: View солих
**Given** lineage snapshot ачаалсан
**When** хэрэглэгч `List` view сонгоно
**Then** `relatedHorses` жагсаалт card-уудаар харагдана.

## Сценари 4: Timeline харах
**Given** lineage snapshot ачаалсан
**When** хэрэглэгч `Timeline` view сонгоно
**Then** event бүр `year`, `title`, `description`-тай жагсана.

## Сценари 5: Tree node сонгох
**Given** tree canvas харагдаж байна
**When** хэрэглэгч node card дарна
**Then** selected node card доор харагдаж, холбоотой edge-үүд highlight хийнэ.

## Сценари 6: Бусад module руу шилжих
**Given** хэрэглэгч bottom navigation ашиглаж байна
**When** `Морьд` tab-ийг дарна
**Then** placeholder тайлбар дэлгэц гарч, widget test-ийн smoke assertion pass байх ёстой.

## Evidence
- `lib/src/features/lineage/presentation/lineage_home_screen.dart`
- `lib/src/features/lineage/presentation/pedigree_tree_view.dart`
- `lib/src/app/router/app_router.dart`
- `test/widget_test.dart`
