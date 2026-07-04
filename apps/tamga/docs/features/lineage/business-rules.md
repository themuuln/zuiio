---
title: Удам судалгаа — Бизнес
description: Удам судалгаа функцийн зорилго, хүрээ, бизнес дүрэм ба edge case-ууд.
---

# Удам судалгаа — Бизнес

## Зорилго

Өрхийн адууны удам, холбоос, гол үр төл, цаг хугацааны чухал мөчүүдийг нэг дороос ойлгомжтой харах туршилтын дэлгэц өгөх.

## Яагаад хэрэгтэй вэ

- Гол азарганы шугамыг хурдан харах
- Өрхийн болон гаднах холбоостой адууг ялгаж ойлгох
- Нэг root-оос олон төрлөөр мэдээлэл үзэх (`Tree`, `List`, `Timeline`)
- Дараагийн шатны CRUD, search, sync feature-үүдийн суурь UX-ийг батлах

## Хэрэглэгч

- Local guest хэлбэрээр апп нээж буй өрхийн хэрэглэгч
- Удамын шугам, үр төл, шагналын товч мэдээлэл харах хүн

## Хүрээ

### Багтсан
- Root азарга сонгох
- Удам модоор харах
- Холбоотой адууг жагсаалтаар харах
- Он дарааллын timeline харах
- Доод navigation-аас бусад module руу орох entry point

### Одоогоор багтаагүй
- Нэвтрэх эрх, role ялгалт
- Cloud sync
- Морь нэмэх, засах, устгах
- Search, events, profile-ийн бодит workflow
- Бодит backend API, database integration

## Нэр томьёо

| Нэр | Тайлбар |
|-----|---------|
| Root | Одоогийн удам харах төв адуу/азарга |
| Tree view | Удмын холбоосыг дүрслэлээр харуулах харагдац |
| List view | Холбоотой адууг жагсаалтаар харуулах харагдац |
| Timeline | Тухайн шугамтай холбоотой үйл явдлыг он дарааллаар харуулах хэсэг |
| Өрхийн | Хэрэглэгчийн талд харьяалагдаж буй адуу |
| Гаднах | Өөр өрх, гадаад холбоосын адуу |

---

## Бизнес дүрэм

| # | Дүрэм | Нотолгоо |
|---|-------|----------|
| BR-1 | Апп нээгдэхэд хэрэглэгч `/lineage` route дээр бууна. | `app_router.dart` |
| BR-2 | Session mode нь зөвхөн `guestLocal`; өөр session төрөл одоогоор байхгүй. | `session_mode_provider.dart` |
| BR-3 | Default root нь `khan-khuleg`. | `selectedLineageRootIdProvider` |
| BR-4 | Root солиход сонгосон node шинэ root болж, view нь заавал `tree` рүү шилжинэ. | `lineage_home_screen.dart` |
| BR-5 | Tree depth filter нь зөвхөн `Tree` view дээр хэрэглэгдэнэ. | `lineage_home_screen.dart` |
| BR-6 | `maxGeneration` өгөгдвөл `generation.abs() <= maxGeneration` нөхцлөөр node харагдана. | `pedigree_layout.dart` |
| BR-7 | Tree дотор зөвхөн харагдаж буй node-уудын edge үлдэнэ. | `pedigree_layout.dart` |
| BR-8 | Адуу бүр `Өрхийн` эсвэл `Гаднах` гэсэн ялгаатай тэмдэглэгээтэй. | `lineage_home_screen.dart` |
| BR-9 | `fetchSnapshot` үл мэдэгдэх root id авбал эхний snapshot руу fallback хийнэ. | `local_lineage_repository.dart` |
| BR-10 | `horses`, `events`, `search`, `profile` route-ууд бодит module биш, placeholder тайлбартай. | `app_router.dart` |

## Онцгой тохиолдол

- Root өгөгдөл хоосон бол `selectedLineageRootProvider` нь `null` эсвэл эхний root-г буцаах логиктой.
- Layout хоосон бол tree view `SizedBox.shrink()` эсвэл loading төлөв рүү орно.
- Snapshot болон roots асинхрон provider тул loading/error төлөв UI дээр тусдаа card/progress хэлбэрээр гарна.

## Нөлөө

- Root солих үед view автоматаар `tree` болдог нь хэрэглэгчийг тухайн root-ийн гол дүрслэл рүү буцаана.
- Unknown root fallback нь crash-ээс хамгаална, гэхдээ буруу өгөгдлийг далдлах эрсдэлтэй.

## Эvidence

- `lib/src/app/router/app_router.dart`
- `lib/src/features/session/application/session_mode_provider.dart`
- `lib/src/features/lineage/application/lineage_roots_provider.dart`
- `lib/src/features/lineage/application/pedigree_layout.dart`
- `lib/src/features/lineage/data/local_lineage_repository.dart`
