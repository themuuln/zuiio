---
title: Удамын хэрэглэгчийн урсгал
description: Lineage feature-ийн гол хэрэглэгчийн урсгал, Mermaid диаграммууд.
---

# Удамын хэрэглэгчийн урсгал

## Урсгал 1: Апп нээгээд үндсэн удам харах
```mermaid
flowchart LR
  A["Апп нээнэ"] --> B["/lineage route ачаална"]
  B --> C["khan-khuleg root default сонгогдоно"]
  C --> D["Overview card харагдана"]
  D --> E["Tree view default идэвхжинэ"]
  E --> F["Tree canvas дээр node-ууд харагдана"]
```

## Урсгал 2: Өөр root сонгох
```mermaid
flowchart LR
  A["Root chip сонгоно"] --> B["selectedPedigreeNodeId шинэ root id болно"]
  B --> C["lineageHomeView = tree болно"]
  C --> D["selectedLineageRootId шинэчлэгдэнэ"]
  D --> E["Шинэ snapshot татагдана"]
  E --> F["Шинэ root-ийн overview ба tree харагдана"]
```

## Урсгал 3: Харах хэлбэр солих
```mermaid
flowchart LR
  A["Хэрэглэгч view сонгоно"] --> B{"Сонголт"}
  B -->|"Tree"| C["Pinch/pan tree canvas"]
  B -->|"List"| D["Related horses list"]
  B -->|"Timeline"| E["Timeline entries"]
```

## Урсгал 4: Бусад tab руу шилжих
```mermaid
flowchart LR
  A["Bottom navigation item дарна"] --> B{"Tab"}
  B -->|"Морьд / Уралдаан / Хайлт / Профайл"| C["PlaceholderScreen нээгдэнэ"]
  C --> D["Ирээдүйн module-ийн тайлбар харуулна"]
```

## QA-д хэрэгтэй ажиглалт
- Default дэлгэц нь `lineage`.
- `Tree` view дээр л үеийн шүүлтүүр харагдана.
- Node сонгоход card border болон edge highlight өөрчлөгдөнө.
- `Морьд` tab ажиллаж байгааг widget test баталж байна.

## Evidence
- `lib/src/app/router/app_router.dart`
- `lib/src/features/lineage/presentation/lineage_home_screen.dart`
- `lib/src/features/lineage/presentation/pedigree_tree_view.dart`
- `test/widget_test.dart`
