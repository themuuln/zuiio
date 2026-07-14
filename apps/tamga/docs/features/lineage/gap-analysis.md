---
title: Удам судалгаа — Төлөв & Gap Analysis
description: Хэрэгжсэн зүйл, одоогийн төлөв, дутуу хэсэг, эрсдэл.
---

# Удам судалгаа — Төлөв & Gap Analysis

## Одоогийн төлөв

| Талбар | Утга |
|--------|------|
| Төлөв | Production-ready (seed data) |
| Сүүлд баталгаажуулсан | 2026-06-08 |
| Ашигласан код | Visual improvements (avatars, stat chips, animation) |
| Framework | VitePress |

---

## Хэрэгжсэн зүйл

- Local lineage prototype үндсэндээ ажиллаж байна
- 2 root dataset-ээр tree/list/timeline харагдац ажиллаж байна
- Bottom navigation shell ажиллаж, бусад module-ийн entry point-ууд харагдаж байна
- Basic widget smoke test байна
- Photo avatars (photo URL → horse emoji → first-letter fallback) нэмэгдсэн
- Node cards дээр tamga badge, stat chips (Шагнал, Үр төл, Тамга, Хурд) нэмэгдсэн
- `SelectedNodeCard` дээр `AnimatedSwitcher` + fade/slide transition нэмэгдсэн
- `LineageTreeNode` domain model дээр optional fields нэмэгдсэн: photoUrl, sex, tamgaNo, region, speedIndex
- Custom Buchheim-Walker tree layout algorithm (bidirectional, ancestor+descendant)

## Дутуу зүйл

| Ангилал | Цоорхой |
|---------|---------|
| Data | Persistence, sync, backend API, offline save логик байхгүй |
| Session/Auth | `guestLocal`-оос өөр session mode алга |
| CRUD | Root, horse, event бүртгэл нэмэх/засах/устгах UI ба domain алга |
| Search | `/search` зөвхөн placeholder |
| Horses | `/horses` зөвхөн placeholder |
| Events | `/events` зөвхөн placeholder |
| Profile | `/profile` зөвхөн placeholder |
| Validation | Root switching, tree depth, node selection interaction-д test алга |

## Эрсдэл

- Unknown root fallback нь өгөгдлийн алдааг UI дээр ил тод харуулахгүй байж магадгүй
- `5 үе` болон `Бүгд` filter байгаа ч sample dataset бага тул ялгаа бодит хэрэглээнд хангалттай харагдахгүй байж магадгүй
- Local mock data дээр UX батлагдсан ч production data shape өөр бол layout болон card density асуудал үүсч болно
- Placeholder route-ууд app scope-ийг том мэт харагдуулж байгаа ч бодит feature coverage бага

## Тодорхойгүй зүйл

- Owners/maintainers кодоос тодорхойгүй
- Бодит өгөгдлийн эх үүсвэр ямар байх нь кодоос харагдахгүй
- Search, events, profile feature-үүдийн business rule хараахан тодорхойлогдоогүй

## Дараагийн алхам

1. `SupabaseLineageRepository` бичих — `horses` таблицаас `sire_id`/`dam_id`-аар ancestor + descendant ахиулж snapshot бүтээх
2. Root switching болон tree interaction дээр нэмэлт widget test нэмэх
3. Placeholder route бүрийг тусдаа canonical feature pack-р задлах үед энэ pack-ийг `lineage` төвтэй хэвээр үлдээх
