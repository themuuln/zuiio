---
title: Store Metadata — iOS App Store & Google Play Store
description: Complete metadata configuration for app store submissions.
---

# Store Metadata

> Full metadata configuration for iOS App Store and Google Play Store submissions.

---

## App Identity

| Field | Value |
|---|---|
| **App Name** | Тамга (Tamga) |
| **Subtitle** | Моринын удмын сан |
| **Bundle ID (iOS)** | `com.tamga.app` |
| **Package Name (Android)** | `com.tamga.app` |
| **Version** | 1.0.0 |
| **Build Number** | 1 |

---

## Category

### Primary
| Store | Category |
|---|---|
| **iOS** | Lifestyle |
| **Android** | Business |

### Secondary
| Store | Category |
|---|---|
| **iOS** | — (none) |
| **Android** | Lifestyle |

---

## Pricing & Availability

| Field | Value |
|---|---|
| **Price** | Free (with in-app purchases) |
| **Available in** | Mongolia (primary), Worldwide |
| **Age Rating** | 4+ (iOS) / Everyone (Android) |
| **Content Rating** | No objectionable content |

### In-App Purchases (RevenueCat)

| Product ID | Name | Price | Type |
|---|---|---|---|
| `tamga_pro_monthly` | Pro Monthly | ₮9,900/mo | Subscription |
| `tamga_pro_annual` | Pro Annual | ₮99,000/yr | Subscription |
| `tamga_breeder_monthly` | Breeder Monthly | ₮24,900/mo | Subscription |
| `tamga_breeder_annual` | Breeder Annual | ₮249,000/yr | Subscription |
| `tamga_stable_monthly` | Stable Monthly | ₮49,900/mo | Subscription |
| `tamga_stable_annual` | Stable Annual | ₮499,000/yr | Subscription |

---

## Keywords

### iOS (100 chars max, comma-separated)
```
horse,management,pedigree,Mongolia,equestrian,breeding,health,tracking,vet,records
```

### Google Play (5 keywords, max 30 chars each)
```
horse management
pedigree tracker
Mongolian horses
equestrian app
horse health
```

---

## URLs

| Field | URL |
|---|---|
| **Support URL** | https://tamga.mn/support |
| **Privacy Policy URL** | https://tamga.mn/privacy |
| **Marketing URL** | https://tamga.mn |
| **Terms of Use URL** | https://tamga.mn/terms |

---

## Contact Information

| Field | Value |
|---|---|
| **Developer Name** | Tamga LLC (Тамга ХХК) |
| **Email** | support@tamga.mn |
| **Phone** | +976 XXXX XXXX |
| **Address** | Ulaanbaatar, Mongolia |

---

## App Privacy (Apple App Privacy Section)

### Data Used to Track You
| Data Type | Linked to Identity | Used for Tracking |
|---|---|---|
| Purchases | Yes | Yes |
| Identifiers (User ID) | Yes | Yes |

### Data Linked to You
| Data Type | Purpose |
|---|---|
| Contact Info (Email) | Account management |
| Purchases | Subscription management |
| Usage Data | Analytics |
| Diagnostics | Crash reporting |

### Data Not Collected
| Data Type | Status |
|---|---|
| Location | Not collected at launch (planned for Phase 5) |
| Contacts | Not collected |
| Health | Not collected (horse health only) |
| Financial | Not collected (processed by RevenueCat) |

---

## Google Play Data Safety

| Category | Collected | Shared | Purpose |
|---|---|---|---|
| Personal Info (Name, Email) | Yes | No | Account creation |
| Financial Info (Purchase history) | Yes | No | Subscription management |
| App Activity (Usage data) | Yes | No | Analytics |
| Device Info (Crash logs) | Yes | No | Stability |
| Location | No | No | — |
| Contacts | No | No | — |
| Photos/Media | User-uploaded only | No | Horse photos |
| Files | User-uploaded only | No | Documents |

**Data encryption:** In transit (TLS) and at rest (AES-256)
**Data deletion:** Users can delete account and all data via in-app settings

---

## Review Notes (for App Store / Play Store reviewers)

### English
```
This app is a horse management tool for Mongolian horse owners. It allows users to:
1. Create and manage horse records with photos
2. Track pedigree lineage (3-5 generations)
3. Log health records (vaccinations, vet visits, treatments)
4. Store documents (vet certificates, insurance)
5. Browse a horse marketplace

The app uses Supabase for cloud storage and authentication.
In-app purchases are managed via RevenueCat.
No real-money gambling, no user-generated social content.

Demo account for review:
Email: review@tamga.mn
Password: TamgaReview2026!
```

### Mongolian
```
Энэ бол Монголын морь эзэмшигчдэд зориулсан моринын удирдлагын хэрэгсэл юм. Хэрэглэгчид дараах зүйлсийг хийх боломжтой:
1. Моринын бүртгэл үүсгэх, зураг нэмэх
2. Удмын мод хянах (3-5 үе)
3. Эрүүл мэндийн бүртгэл хөтлөх (вакцин, эмчийн үзлэг, эмчилгээ)
4. Баримт хадгалах (малын эмчийн гэрчилгээ, даатгал)
5. Моринын зах зээл харах

Supabase ашиглан үүлэн хадгалалт, нэвтрэх эрхийг удирдана.
RevenueCat ашиглан доторх худалдан авалтыг удирдана.
```

---

## Changelog / What's New (v1.0.0)

### English
```
Initial release of Tamga — the horse management app built for Mongolia.

Features:
- Horse records with digital passports
- 5-generation pedigree tree with inbreeding calculator
- Health tracking with smart reminders
- Farrier logs and schedules
- Document vault for vet certificates and insurance
- Horse marketplace with verified pedigree
- Offline-first design for rural use
- Mongolian-language interface
```

### Mongolian
```
Тамга-ийн анхны хувилбар — Монголд зориулсан моринын удирдлагын хэрэгсэл.

Боломжууд:
- Моринын дижитал пасспорт
- 5 үеийн удмын мод, элбэг хэвийн тооцоолол
- Ухаалаг сануулгатай эрүүл мэндийн бүртгэл
- Хүрэнчийн бүртгэл
- Баримтын сан
- Баталгаатай удмын мэдээлэлтэй зах зээл
- Оффлайн горим
- Монгол хэлний интерфейс
```

---

## Related

- [Store Listing](./store-listing.md) — App descriptions
- [Product](./product.md) — Feature inventory and pricing
- [Legal](./legal.md) — Privacy policy and compliance
