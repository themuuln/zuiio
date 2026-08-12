# Meta Business Verification — Document Package

Purpose: prepare the documents to verify Zui Innovation LLC in Meta Business Suite for the business portfolio **Zuiio**. The same documents are used for Apple Developer Program organization enrollment (separate process, see section 1).

Source of requirements: Meta Business Help Center — "Upload official documents to verify your business" (https://www.facebook.com/business/help/159334372093366, retrieved 2026-08-12).

> This is a working document. It is not legal advice. Confirm with Meta support and the translator before final submission.

---

## 1. Legal Entity (from official records)

| Field | Value | Source |
|---|---|---|
| Legal entity ID (РД) | 7302969 | Registration reference |
| Designated name | ЗҮЙ ИННОВАЦ (ZUI INNOVATION) | Registration reference |
| Legal form | ХХК — Limited Liability Company | Registration reference |
| State registration number | 9011895313 | Registration reference |
| State registration date | 2026-07-07 | Registration reference |
| Reference issue date | 2026-07-28 (digital code LCU9-JDBM-UQ1D-HI4S) | Registration reference |
| Registered address | Unit 4, Building 30, Peace Avenue, 6th Khoroo, Bayangol District, Ulaanbaatar, Mongolia | Registration reference / Charter |
| Phone | 88650115 | Registration reference / Charter |
| Email | themuln.official@gmail.com | Registration reference / Charter |
| Shareholder & Executive Director | Undrakhbayar Temuulen (100%; capital 100,000 MNT) | Registration reference / Founding Decision |
| Activities | Software development, IT services, IT consulting | Registration reference / Charter |

**Apple Developer Program (organization type):** a separate process from Meta. Apple requires a D-U-N-S number (free via Dun & Bradstreet) and the same legal entity documents. Meta's document rules (supported languages, stamping) do not apply to Apple. Verify Apple's current enrollment requirements before submission.

## 2. Source Documents in `docs/legal-entity/submission/`

| File | Content | Role for Meta |
|---|---|---|
| `zui-registration-with-english-translation-soninbileg.pdf` | State Registration Detailed Reference (official, Mongolian) + English translation | Business Registration document |
| `zui.pdf` | State Registration Detailed Reference (official, Mongolian) | Same as above (Mongolian original) |
| `Corporate Document Translations for Zui Innovation LLC.pdf` | Founding Decision 26-01 + Articles of Association, English translation with translator certification (Soninbileg, 19 Jul 2026) | Certificate/Articles of Incorporation |
| `Corporate Document Translations for Zui Innovation LLC - REDACTED.pdf` | Same document, civil registration number ZP05311115 removed (2 occurrences, redacted 2026-08-12) | Upload-safe copy of the above |
| `Zui Innovation LLC - Charter (Dyrem) - original scans.pdf` | Original Mongolian charter (Дүрэм), 4 scanned pages, sections 1–11 | Original for the rules path |
| `Zui-Innovation-Articles-of-Association-EN.pdf` / `.docx` | Full English translation of the charter (all 11 sections), stamp-ready draft (2026-08-12) | Upload candidate for the rules path after stamping |
| `Zui Innovation LLC - Charter - original and EN translation.pdf` | Merged: 4 original scans + 5 translation pages (ends with certification block), 9 pages (2026-08-12) | Single-file upload for the rules path after stamping |
| `certificate-english/` (dir) | 01: original certificate scan (page 1); 02: English translation (PDF + DOCX); 03: merged original + translation | Upload candidates for the certificate path after stamping |
| `Zui-Innovation-State-Registration-Reference-EN.pdf` / `.docx` | Complete English translation of the registration reference (working copy, uncertified) | Upload candidate after stamping (section 4) |
| `meta-business-verification.pdf` / `.docx` | This document package (Word/PDF exports of this file) | Reference |

## 3. Meta Requirements → Status

| Meta requirement | Our status | Action |
|---|---|---|
| Prove legal business name | Registration reference shows "ЗҮЙ ИННОВАЦ" | Confirm the name spelling in Meta matches the document (open question 5) |
| Prove official mailing address or phone | Reference shows address + phone 88650115 | Ready |
| Document in a supported language (Mongolian is NOT supported) | English translations exist | Confirm official translating-agency stamp (open question 4) |
| Document current, issued by relevant authority | Issued by General Authority for State Registration, 2026-07-28 | Ready |
| Cover personal information not needed | Civil registration number ZP05311115 is visible | MUST redact before upload (section 5) |
| Proof of domain ownership (only if verifying via email code) | No company domain in the records | Decide verification contact (open question 6) |
| Tax document / bank statement (optional) | Not available | Optional; supply if Meta asks (open question 7) |

## 4. Document to Upload (recommended)

Primary: **State Registration Detailed Reference with English translation** (`zui-registration-with-english-translation-soninbileg.pdf`).

Reason: one document proves the legal name, the registered address, and the phone number. This matches Meta's accepted type "Business Registration or License Document".

Alternative: **Corporate Document Translations** (Articles of Association) matches "Certificate/Articles of Incorporation". Use it if the reference is rejected.

Physical certificate scan (checked 2026-08-12): page 1 of the State Registration Certificate (serial 000376542) matches the reference on all identifiers — name ЗҮЙ инновац (Й, not Ү), state registration no. 9011895313, РД 7302969, registration date 2026-07-07, decision 01 of 2026-07-06, address (Bayangol, 6th Khoroo, Peace Avenue 30-4), phone 88650115, form Хязгаарлагдмал хариуцлагатай компани (LLC). Page 2 (additional amendments register) contains an unrelated entry dated 2020-07-07 — do NOT include page 2 in any upload.

Rules:
- Upload the English translation only if it carries the official stamp of a translating agency.
- The document must not expire before the review completes.
- Combine multiple pages into one PDF if Meta accepts only one file.

## 5. Redaction Instructions (MUST DO BEFORE UPLOAD)

The registration reference contains personal data that Meta does not need. Cover these fields in the uploaded copy:

1. **Civil registration number** — ZP05311115 (shareholder section).
2. **Any other personal identification numbers** on the document.
3. Keep visible: company name, legal form, registration numbers, address, phone, email, activities, capital.

Method: black-out with a PDF editor, or print → cover with opaque tape → re-scan. Verify the redaction is opaque before upload.

Status (2026-08-12): **done** — `Corporate Document Translations for Zui Innovation LLC - REDACTED.pdf` covers both occurrences of ZP05311115 (Founding Decision and Articles §1.3). The registration reference does not display the civil registration number, so it needs no redaction.

## 6. Verification Steps in Meta Business Suite

1. Log in to Meta Business Manager with the business portfolio that owns the asset.
2. Open Settings → Business info → Business verification.
3. Enter the business details: legal name, address, phone (must match the document).
4. Upload the prepared document (section 4).
5. Choose the verification method: email code or phone call.
6. If email code is chosen and the email is a company domain, provide proof of domain ownership.
7. Wait for Meta's review. Keep the original documents available if Meta asks for more.

Note: business verification is different from Meta Verified for businesses. It does not give a verified badge.

## 7. Open Questions (answers change this document)

Answered: purpose = business portfolio verification + Apple Developer Program organization enrollment; portfolio name = Zuiio; verification contact = themuln.official@gmail.com + 88650115 (no company domain → no domain ownership proof needed); portfolio ID = not required for submission (optional, only for Meta support); Meta's form asks for **certificate or rules** as document type; original Дүрэм received (4 scans, saved) and fully translated into English (draft, 2026-08-12). Remaining:

1. Document choice: **certificate** (certificate page 1 / registration reference) or **rules** (full charter translation)? Both are prepared; the stamped translation decides which is ready first. Note: the charter spells the name «Зүй инноваци»; the registration record uses ЗҮЙ ИННОВАЦ — the registered form governs for verification.
2. Is the English translation certified and stamped by a registered translating agency? Is there a stamped PDF copy?
3. Legal name spelling in Meta: "Zui Innovation", "Зүй инновац", or "ЗҮЙ ИННОВАЦ"?
4. Backup documents: tax registration certificate (Татварын гэрчилгээ) or business bank statement in the company name?

## 8. Checklist Before Submission

- [ ] Redacted copy prepared (civil ID covered)
- [ ] English translation stamped by the translating agency
- [ ] Legal name in Meta matches the document exactly
- [ ] Address and phone in Meta match the registration reference
- [ ] One combined PDF, pages in order
- [ ] Verification contact chosen; domain ownership proof ready if needed
- [ ] Original documents kept on hand

## 9. Submission Readiness Review (2026-08-12)

Verdict: **the package is NOT ready to submit as it is.** One blocking gap: the certified English translation. Everything else is conditional on exact name/address entry.

| Check | Status | Risk |
|---|---|---|
| Accepted document type | Registration reference = "Business Registration or License Document" | ✅ Pass |
| Document current, official issuer | Issued 2026-07-28 by General Authority for State Registration | ✅ Pass |
| Language | Mongolian is NOT in Meta's supported list → English translation required | ❌ Blocker |
| Translation officially stamped | Both available translations state they are not certified until the translator's name, date, signature, and official stamp are completed | ❌ Blocker |
| Legal name matches Business Manager entry | Depends on the spelling entered | ⚠️ Must match exactly |
| Address matches Business Manager entry | Depends on the transliteration entered | ⚠️ Must match exactly |
| Personal data covered | Redacted 2026-08-12 — corporate-docs copy (ZP05311115, 2 occurrences); reference shows no ID | ✅ Done |
| Domain ownership proof | Only needed if the verification email is a company domain | ⚠️ Conditional |
| Phone reachable | 88650115 (document number) | ✅ Pass |

Required actions before submission:

1. **Stamp the translation** — have the English translation of the registration reference signed and stamped by a registered translating agency (paper stamp or notarized copy). This is the most likely rejection cause. Without it, Meta treats the document as not in a supported language.
2. **Match the name exactly** — enter the legal name in Business Manager exactly as it appears on the document (decide the Latin or Cyrillic spelling first; do not mix).
3. **Redact personal IDs** — cover the civil registration number in every uploaded page, including the corporate-docs copy.
4. **Choose the verification contact** — if you verify by email on a company domain, prepare the domain ownership proof (DNS record or HTML tag).
5. **Prepare a backup** — a government-issued tax certificate or a business bank statement in the company name, in case Meta requests a second document.
