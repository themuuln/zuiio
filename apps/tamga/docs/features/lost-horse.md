---
title: Эрэл хайгуул — Lost Horse
description: Хаяж морь зарлах, ойр хавийн заруудыг харах, газрын зураг дээр хайх функцийн төлөв ба gap analysis.
---

# Эрэл хайгуул — Lost Horse

Tamga-ийн lost horse функц нь хаяж морийг хурдан зарлах, бусад хэрэглэгчийн идэвхтэй заруудыг жагсаалт болон газрын зураг дээр харах, хайх радиусын бүсийг ойлгомжтой харуулах зорилготой.

## Монетизацын зарчим

Lost horse функц дээр тусламж үзүүлэх боломжийг хаахгүй. **Харах, мэдээлэл өгөх, туслах нь үнэгүй** байна. Харин эзэмшигчийн зар үүсгэх, ойр хавийн хүмүүст push notification илгээх, яаралтай boost хийх зэрэг түгээлтийн үйлдлүүд төлбөртэй байна.

| Үйлдэл | Үнэ | Дүрэм |
|---|---:|---|
| Идэвхтэй хаяж морьдыг харах | ₮0 | Бүх хэрэглэгч list/map дээр харна |
| Basic lost horse report | ₮2,000 | Public list/map дээр нийтлэнэ, push broadcast орохгүй |
| Nearby broadcast — 10 км | +₮3,000 | 10 км радиуст байгаа notification зөвшөөрсөн хэрэглэгчдэд urgent push |
| Nearby broadcast — 30 км | +₮5,000 | 30 км радиуст байгаа хэрэглэгчдэд urgent push |
| Urgent boost — 72 цаг | +₮10,000 | Жагсаалтын дээд хэсэгт, map дээр илүү тод, дахин сануулах эрхтэй |
| Pro/Business allowance | Багцад багтана | Сард хязгаартай free/discounted report + broadcast credit |

### Checkout flow

1. Хэрэглэгч report form бөглөнө.
2. Submit дарахад `Зөвхөн нийтлэх`, `10 км мэдэгдэх`, `30 км мэдэгдэх`, `72 цаг boost` гэсэн сонголттой checkout sheet гарна.
3. Төлбөр амжилттай бол report хадгалагдаж, сонгосон broadcast job үүснэ.
4. Төлбөр амжилтгүй бол report нийтлэгдэхгүй эсвэл draft хэлбэрээр хадгалагдана.
5. Broadcast илгээгдсэн тоо, радиус, дуусах хугацааг detail screen дээр owner-д харуулна.

## Одоогийн хэрэглэгчийн урсгал

1. Хэрэглэгч `Эрэл хайгуул` таб руу орно.
2. `Жагсаалт` таб дээр идэвхтэй хаяж морьд realtime feed-ээр харагдана.
3. Хэрэв GPS зөвшөөрөлтэй бол зарууд хэрэглэгчээс ойроос хол руу эрэмбэлэгдэнэ.
4. `Газрын зураг` таб дээр хаяж морь, хайх радиус, ойр хавийн адуу, geofence бүсүүд харагдана.
5. `Хаяж морь бүртгэх` товчоор бодит report form нээгдэнэ.
6. Зар үүсгэх үед морь, тайлбар, GPS байршил, хайх радиус хадгалагдана.
7. Зарын эзэмшигч detail дэлгэцээс `Олсон` эсвэл `Цуцалсан` төлөвт шилжүүлнэ.

## Gap analysis

| Gap | Эрсдэл | Шийдсэн төлөв |
|---|---|---|
| Finder FAB premium prompt нээж, бодит report form руу очихгүй байсан | Хэрэглэгч хаяж морь зарлаж чадахгүй мэт санагдана | ✅ FAB шууд report form нээнэ |
| GPS байхгүй үед `0,0` координат хадгалах боломжтой байсан | Буруу байршилтай safety зар үүснэ | ✅ GPS байхгүй бол submit зогсоож тайлбар харуулна |
| Report/status mutation-ууд await хийхгүй байсан | Амжилтгүй хадгалалт ч дэлгэц хаагдаж магадгүй | ✅ Save/update дууссаны дараа snackbar + pop |
| Active reports “distance sorted” гэж бичигдсэн ч зөвхөн created_at-аар ирж байсан | Малчинд ойр зарууд эхэнд харагдахгүй | ✅ GPS байвал client-side distance sort |
| Card дээр зөвхөн нэр, цаг, status байсан | Жагсаалтаас хайх радиус болон зайг хурдан ойлгохгүй | ✅ Distance, search radius, description preview нэмсэн |
| Detail action-ууд owner бус хэрэглэгчид харагдаж байсан | RLS дээр fail хийх UX үүснэ | ✅ Зөвхөн owner resolve/cancel харна |
| Nearby horse haversine тооцоонд degree-ээр cosine хийж байсан | Ойр адууны distance filter буруу гарах эрсдэлтэй | ✅ Latitude cosine-г radians болгосон |
| Paid broadcast төлөвлөгөө тодорхойгүй байсан | Free тусламж ба paid түгээлт хоорондоо холилдоно | ✅ Free view/help, paid publish/broadcast/boost гэж ялгав |

## Техникийн тэмдэглэл

- Presentation entry point: `lib/src/features/lost_horse/presentation/lost_horse_finder_screen.dart`
- Report/list/detail implementation: `lib/src/features/map/presentation/`
- Providers: `lib/src/features/map/application/lost_horse_providers.dart`
- Repository: `lib/src/features/map/data/supabase_map_repository.dart`
- Domain model: `lib/src/features/map/domain/lost_horse_report.dart`

## Үлдсэн сайжруулалт

| Priority | Ажил | Тайлбар | Төлөв |
|---|---|---|---|
| P1 | Contact handoff | Зарын эзэмшигчтэй утсаар эсвэл in-app message-ээр холбогдох flow нэмэх | ✅ In-app chat + consented phone (recovery P0) |
| P1 | Paid rescue checkout | Report submit-ийн дараа publish/broadcast/boost сонголт болон payment flow нэмэх | ⏳ Зориуд хойшлуулсан — free recovery core (P0 шийдвэр) |
| P1 | Broadcast job + audit | Төлбөр амжилттай бол radius notification job үүсгэж, илгээсэн тоо/хугацааг хадгалах | ✅ Subscription/outbox/alert-dispatch Edge Function (P0) |
| P1 | Manual last-seen pin | GPS current location биш, хамгийн сүүлд харсан цэгийг map дээр сонгох | ✅ Recovery wizard last-seen step (P0) |
| P2 | Photo attachment | Report дээр horse photo болон нэмэлт зураг хавсаргах | ✅ Private buckets + staged media (P0) |
| P2 | Push radius alerts | Төлбөртэй broadcast болон хэрэглэгчийн search/geofence бүсэд шинэ зар орвол urgent notification илгээх | ⏳ At-least-once dispatch pipeline зөвхөн (P0) — FCM/SMS хүргэлт дараа |
| P3 | Offline draft queue | Сүлжээгүй үед зар draft үүсгээд sync queue-р илгээх | ✅ Durable sync queue + retry (P0) |
| Phase 3 | Marketplace connection | Зах зээл ⇄ эрэл хайгуул холболт — lost/stolen listing guard, provenance | ✅ 2026-08-01: `lost_report_conflict` server guard + flag/clear triggers, listing badge/banner, create-listing block, provenance rows |

## Verification

- `flutter test test/features/map`
- `dart analyze lib/src/features/lost_horse lib/src/features/map`
