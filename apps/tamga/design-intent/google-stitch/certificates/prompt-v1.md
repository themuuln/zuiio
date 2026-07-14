<!-- Layout: Digital Certificates -->
Design a digital certificate section for a mobile horse management app.

Include:
- Certificate detail screen showing ownership certificate with share and transfer actions
- Certificate verification screen for QR code or ID-based verification

Interactions:
- Certificate card shows full ownership details
- Share button opens share sheet
- Transfer button navigates to transfer flow
- Verification screen scans QR or enters ID manually

Style: warm earthy palette, orange (#F06A2E) accents, official/document feel, clean card layout, system font

Optimize for mobile, QR scanner integration, share functionality

---

<!-- Component: Certificate Detail Screen -->
Design a digital horse ownership certificate screen for mobile.

Include:
- Back arrow + "Цахим гэрчилгээ" (Digital Certificate) title
- Certificate card (full-width, styled like an official document):
  - Ornamental top border (orange pattern or horse motif)
  - "Бүртгэлийн гэрчилгээ" (Registration Certificate) header
  - Certificate ID number (monospace, muted)
  - Horse details section: name, breed, color, birth year, gender
  - Owner details section: name, phone, region
  - QR code (bottom-right of certificate, scannable)
  - Issue date and validity
  - Tamga logo watermark
- Action buttons row below certificate:
  - "Хуваалцах" (Share) button — outlined, with share icon
  - "Шилжүүлэх" (Transfer) button — outlined, with transfer icon
  - "Татаж авах" (Download) button — outlined, with download icon

Style: official document aesthetic, ornamental details, warm cream background on certificate card, orange accent borders, serif-like header for formality, system font

Optimize for mobile, full-screen certificate view, PDF export, QR scanner for verification

---

<!-- Component: Certificate Verification Screen -->
Design a certificate verification screen for mobile.

Include:
- "Гэрчилгээ шалгах" (Verify Certificate) title with back arrow
- QR scanner viewfinder at top (200dp × 200dp, rounded corners, orange corner brackets):
  - Camera preview as background
  - Orange scanning frame overlay
  - "QR код уншуулна уу" (Scan QR code) instruction text
- Divider with "эсвэл" (or)
- Manual entry section:
  - "Гэрчилгээний дугаар" (Certificate ID) text input
  - "Шалгах" (Verify) button — outlined, orange
- Result section (after verification):
  - Green checkmark + "Баталгаатай" (Verified) or red X + "Баталгаагүй" (Not Verified)
  - Certificate summary card if verified
  - Horse name, owner, issue date

Style: camera-integrated UI, orange scanning frame, clean verification result, warm background, system font

Optimize for mobile, camera permission handling, fast QR recognition, offline verification support
