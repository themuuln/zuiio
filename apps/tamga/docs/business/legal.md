---
title: Legal — Business & Compliance Framework
description: Business entity, data privacy, IP, terms of service, horse ownership law, and compliance requirements for Tamga in Mongolia.
---

# Legal — Business & Compliance Framework

> This is not legal advice. It's a working document of what we need to address. Consult a Mongolian lawyer before finalizing.

---

## Business Entity

### Recommended Structure

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **ХХК (LLC)** | Limited liability, tax flexible, investor-friendly | Setup cost, annual reporting | ✅ **Recommended** |
| ИХХ (JSC) | Can issue shares publicly | Overkill for startup | ❌ Too early |
| Хувь хүн (Sole proprietor) | Simple, cheap | Unlimited liability, can't raise funding | ❌ Not viable |

### Registration Steps

1. **Register ХХК** with the General Authority for State Registration (Улсын бүртгэлийн ерөнхий газар)
2. **Tax registration** with the General Taxation Authority (Татварын ерөнхий газар)
3. **Open business bank account** (most likely Khan Bank or Golomt Bank)
4. **VAT registration** (required if annual revenue > ₮50M — may apply in Year 1)

### Key Details

| Item | Details |
|---|---|
| **Company name** | Tamga ХХК (or Тамга ХХК) |
| **Industry** | Software / IT Services / Agricultural Technology |
| **Registration cost** | ~₮100,000–200,000 (state fee + notary) |
| **Timeline** | 3–5 business days |
| **Ongoing obligations** | Annual tax filing, audit if revenue > ₮500M |

---

## Data Privacy & Protection

### Mongolia's Legal Framework

Mongolia has the **Personal Data Protection Law** (Хувийн мэдээлэл хамгаалах тухай хууль, 2021 revision). Key requirements:

| Requirement | What It Means for Tamga |
|---|---|
| **Consent required** | Users must explicitly consent to data collection |
| **Purpose limitation** | Collect only what's needed for horse management |
| **Data minimization** | Don't collect unnecessary personal data |
| **Right to access** | Users can request their data |
| **Right to delete** | Users can request deletion |
| **Breach notification** | Notify authority within 72 hours of breach |
| **Cross-border transfer** | Allowed with adequate protection in destination country |

### What Tamga Collects

| Data Type | Legal Basis | Retention |
|---|---|---|
| User profile (name, phone) | Consent | Until account deletion |
| Horse records | Consent | Until user deletes |
| Health records | Consent | Until user deletes |
| Location (GPS, future) | Consent | User-controlled |
| Payment info | Contract (subscription) | Via RevenueCat/Payment processor |

### Privacy Policy Requirements

Must include (in Mongolian):
1. What data is collected and why
2. How data is stored and protected
3. Who has access to data
4. User rights (access, correction, deletion)
5. Contact information for privacy inquiries
6. Cookie/tracking policy (if web)
7. Children's privacy (if app used by minors — child jockeys context)

### Supabase & Data Storage

| Concern | Mitigation |
|---|---|
| Data stored on AWS (US/EU) | Supabase allows region selection; choose closest to Mongolia |
| RLS policies enforce access control | Users can only see their own data + shared horses |
| Encryption at rest | Supabase encrypts all data at rest |
| Encryption in transit | TLS for all API calls |
| Backup | Supabase automatic daily backups |

---

## Intellectual Property

### Trademarks

| Mark | Status | Action |
|---|---|---|
| "Tamga" (word mark) | ⚠️ Need to register | File with IP Office (Бүтээлийн эрхийн алба) |
| "Тамга" (Cyrillic) | ⚠️ Need to register | File alongside English mark |
| Tamga logo | ⚠️ Need to register | After logo design finalized |
| tamga.mn domain | ✅ Acquired | — |
| tamga.app domain | ✅ Acquired | — |

### Trademark Registration (Mongolia)

| Step | Details |
|---|---|
| **Office** | Intellectual Property Office of Mongolia (Бүтээлийн эрхийн алба) |
| **Cost** | ~₮150,000–300,000 per mark |
| **Timeline** | 6–12 months for full registration |
| **Classes** | Class 9 (software), Class 35 (business services), Class 42 (tech services) |
| **Duration** | 10 years, renewable |

### Copyright

- App code is automatically copyrighted upon creation
- Document it: copyright notice in source files, `package.json`, app store listings
- Format: `© 2026 Tamga ХХК. All rights reserved.`

### Open Source

- Currently no open-source components that require license compliance
- When adding dependencies: check licenses (MIT, BSD, Apache = safe; GPL = avoid for mobile)

---

## Terms of Service (Outline)

### Key Clauses to Include

1. **Acceptance of Terms** — using the app = agreeing to ToS
2. **Description of Service** — horse management platform
3. **User Accounts** — one account per person, responsibility for activity
4. **Horse Data Ownership** — users own their horse data; Tamga has license to store/process
5. **Prohibited Uses** — fraud, impersonation, scraping, illegal activity
6. **Intellectual Property** — Tamga owns the app; users own their data
7. **Payment Terms** — subscription billing, refund policy, auto-renewal
8. **Disclaimers** — "not a veterinary service," "not a legal registry"
9. **Limitation of Liability** — cap at subscription amount
10. **Termination** — user can delete account; Tamga can terminate for ToS violation
11. **Governing Law** — Mongolia
12. **Dispute Resolution** — Ulaanbaatar courts (or arbitration)
13. **Changes to Terms** — notification requirement
14. **Contact** — support email

### Critical Disclaimers

| Disclaimer | Why |
|---|---|
| "Tamga is not a legal horse registry" | Avoid liability if users claim official registration |
| "Tamga is not a veterinary service" | Health records are user-entered, not professional advice |
| "Race results are for informational purposes" | Avoid disputes over accuracy |
| "Ownership records are user-declared" | Tamga doesn't verify ownership — that's the user's responsibility |

---

## Horse Ownership Legal Framework

### Mongolia's Livestock Laws

Mongolia's **Livestock Law** (Малын тухай хууль) governs horse ownership:

| Concept | Legal Status |
|---|---|
| **Brand mark (тамга)** | Legally required for identification; registered with local government |
| **Ownership proof** | Brand mark + local government registration |
| **Sale/transfer** | Bill of sale + brand mark transfer registration |
| **Insurance** | Voluntary; regulated by Financial Regulatory Commission |
| **Race eligibility** | Must be registered with race organizers (Naadam committee) |

### Tamga's Legal Position

| What Tamga Does | What It Doesn't Do |
|---|---|
| Digital record of horse data | Replace legal registration |
| User-declared ownership tracking | Verify or guarantee ownership |
| Pedigree visualization | Certify pedigree accuracy (unless verified) |
| Health record keeping | Provide veterinary advice |
| Marketplace listings | Execute legal sales contracts |

### Important: Not a Legal Registry

Tamga is a **management tool**, not a government-registered horse registry. The ToS must clearly state:
- Tamga records are user-entered and user-responsible
- Official horse registration is done through local government (aimag/soum livestock offices)
- Tamga does not replace the legally required тамга (brand mark) system

---

## Insurance Considerations

### For the Business

| Insurance Type | Priority | Notes |
|---|---|---|
| **Professional liability** | High | If users claimTamga data caused financial loss |
| **Cyber liability** | High | Data breach, ransomware, business interruption |
| **General business liability** | Medium | Standard for any business |
| **Directors & Officers** | Medium | If raising investment |
| **Workers' comp** | When hiring | Required by Mongolian law |

### For Users (Future Feature)

Digital insurance integration is planned (Phase 3). Legal considerations:
- Partnership with licensed insurance company (MIG Daatgal or competitor)
- Tamga doesn't sell insurance — facilitates connection
- Insurance company handles underwriting, claims, compliance
- Tamga provides data (horse age, health history) with user consent

---

## Payment & Financial Compliance

### Payment Processing

| Method | Provider | Legal Requirement |
|---|---|---|
| **QPay** | Most banks | Standard merchant agreement |
| **SocialPay** | Most banks | Standard merchant agreement |
| **In-app purchase (iOS)** | Apple | Apple takes 15–30% commission |
| **Google Play billing** | Google | Google takes 15% (first $1M) |
| **RevenueCat** | Subscription management | Handles Apple/Google billing complexity |

### Tax Obligations

| Tax | Rate | Notes |
|---|---|---|
| **Corporate income tax** | 10% | On net profit |
| **VAT** | 10% | Required if revenue > ₮50M/year |
| **Social insurance** | 11.5% employer | On employee salaries |
| **Personal income tax** | 10% | Withheld from employee salaries |

### Revenue Recognition

- Subscriptions: recognize revenue monthly as service is delivered
- On-site registration: recognize at time of service
- Marketplace commission: recognize at time of completed sale

---

## Regulatory Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Government restricts horse data apps | Low | High | Stay compliant with livestock laws; don't claim official status |
| Data privacy enforcement increases | Medium | Medium | Build privacy-first from day one |
| Apple/Google reject app | Low | High | Follow store guidelines meticulously |
| Uyach seeks legal action (trademark?) | Low | Medium | "Tamga" is generic Mongolian — strong defense |
| Insurance regulations change | Medium | Medium | Partner with licensed insurer, don't self-insure |

---

## ⚠️ Тодорхойлолтууд (Service Disclaimers)

Tamga нь дараах үйлчилгээнүүдэд тодорхойлолт (disclaimer) гаргах шаардлагатай:

| Үйлчилгээ | Тодорхойлолт | Хуульчтай хэлэлцэх |
|---|---|---|
| **Даатгалын шилжүүлэг** | Tamga нь даатгалын зөвлөх биш. Зөвхөн холбооны үйлчилгээ. Даатгалын шийдвэрийг хэрэглэгч өөрөө гаргана. | Тийм |
| **Малын эмчийн зах зээл** | Зөвхөн жагсаалт + захиалга. Эмнэлгийн зөвлөх биш. Телемедицин биш. | Тийм |
| **Гэрчилгээ** | Tamga-ийн баталгаат бүртгэл. Засгийн газрын албан ёсны баримт биш. | Тийм |
| **Дата лиценз** | Хэрэглэгчийн зөвшөөрөлгүйгээр өгөгдөл зарахгүй. Бүх өгөгдөл нэр төрийг хадгална. | Тийм |
| **Худалдааны шимтгэл** | 3% шимтгэл нь худалдааны үйлчилгээний төлбөр. Даатгал биш. | Тийм |

---

## Legal To-Do List

### Before Launch (Critical)

- [ ] Register ХХК (LLC)
- [ ] Open business bank account
- [ ] File trademark application for "Tamga" / "Тамга"
- [ ] Draft Privacy Policy (in Mongolian)
- [ ] Draft Terms of Service (in Mongolian)
- [ ] Draft Cookie Policy (for web version)
- [ ] Review Supabase data processing agreement
- [ ] Set up RevenueCat account (handles Apple/Google compliance)

### Before Monetization

- [ ] Consult lawyer on subscription billing compliance
- [ ] Review QPay/SocialPay merchant agreements
- [ ] Set up accounting system
- [ ] Register for VAT if projected revenue > ₮50M

### Before Partnerships

- [ ] Draft partnership agreements template
- [ ] Review insurance company integration legal requirements
- [ ] Clarify liability for user-generated horse data

---

## Related

- [Product](./product.md) — what we're building
- [Finance](./finance.md) — revenue model and tax
- [Database](./database.md) — data architecture (privacy-relevant)
- [Tech Stack](./tech-stack.md) — security and encryption details
- [Competitor](./competitor.md) — Uyach's legal positioning
