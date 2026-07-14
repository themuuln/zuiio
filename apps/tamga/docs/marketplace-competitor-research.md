# Marketplace Competitor Research Report

> **Date:** 2026-06-17
> **Scope:** Horse/livestock marketplace apps and classifieds platforms
> **Objective:** Identify best features, UX patterns, trust mechanisms, and competitive advantages for Tamga's marketplace

---

## Table of Contents

1. [Platform Analysis](#1-platform-analysis)
   - [1.1 Unegui.mn (Mongolia)](#11-uneguimn-mongolia)
   - [1.2 Facebook Marketplace / Facebook Groups](#12-facebook-marketplace--facebook-groups)
   - [1.3 DreamHorse.com (US)](#13-dreamhorsecom-us)
   - [1.4 Equine.com (US)](#14-equinecom-us)
   - [1.5 HorseClicks (US)](#15-horseclicks-us)
   - [1.6 Neighh (US)](#16-neighh-us)
   - [1.7 Elite Equine Marketplace (US)](#17-elite-equine-marketplace-us)
   - [1.8 eHorses.com (Europe/Global)](#18-ehorsescom-europeglobal)
   - [1.9 Hüner / Уяач (Mongolia)](#19-hner--mongolia)
2. [Cross-Platform Comparison](#2-cross-platform-comparison)
3. [Trust & Safety Innovations](#3-trust--safety-innovations)
4. [Common Frauds & Mitigations](#4-common-frauds--mitigations)
5. [Recommended Feature List for Tamga Marketplace](#5-recommended-feature-list-for-tamga-marketplace)
6. [Top 5 Competitive Advantages for Tamga](#6-top-5-competitive-advantages-for-tamga)

---

## 1. Platform Analysis

### 1.1 Unegui.mn (Mongolia)

**Overview:** Mongolia's #1 general classifieds platform. Has a dedicated "Мал амьтан" (Livestock/Animals) category with subcategories including "Морь, адуу" (Horses). ~426 active listings in total livestock category (as of June 2026).

**How Listings Are Created:**
- Free basic text listings with photos
- Category hierarchy: Мал амьтан → Мал амьтан (Animals) → Таван хошуу мал (Five Animals) → Морь, адуу (Horses)
- Sellers can upload photos (CDN-hosted)
- Fields: title, price (₮), location (province/district level), description text, photos
- Listing form appears to be general classifieds form — no horse-specific fields (no breed, age, color, pedigree, health records, etc.)

**Search/Filter Capabilities:**
- Basic: category drill-down, price range (min/max with preset values: 25k–5M ₮)
- Sort by: relevance, date (newest), price (low-high, high-low)
- Location filter by province
- GIS map-based search area drawing (custom polygon on map)
- "Saved search" email notification for keyword/category
- NO breed filtering, NO age filtering, NO horse-specific search facets

**Seller Reputation/Trust:**
- **E-Mongolia identity verification** integration (DAN official ID system) — users can verify their identity via government e-ID
- Verified badge displayed on listings from verified users
- Email verification required for messaging
- Basic account system
- NO seller ratings/reviews system
- NO transaction history or reputation scores

**Transaction Flow:**
- All communication via built-in chat/messaging
- Buyer and seller arrange payment directly (no platform-mediated payments)
- No commission/escrow
- Contact info shared through platform

**Mobile UX Strengths:**
- Native Android app (1M+ downloads) and iOS app ("Unegui zar")
- Clean category navigation
- Map-based search area
- Push notifications for messages

**Mobile UX Weaknesses:**
- General-purpose classifieds UI — no horse-specific design
- No photo galleries optimized for showcasing livestock
- No structured data fields for animal attributes (age, breed, color, health, pedigree)
- No trial/PPE (pre-purchase exam) coordination
- Text-heavy listings with inconsistent formatting
- No video upload in listings (basic photo only)

**Monetization:**
- Free basic listings
- Premium/featured placement (paid)
- E-Mongolia verification (free, incentivized)
- Display advertising

**What Unegui.mn Does Well:**
- Massive existing user base (Mongolia's #1 classifieds)
- Government ID integration for trust
- Map-based area search (useful for remote livestock purchases)
- Free listing lowers barrier

**What Unegui.mn Does Poorly for Horse Listings:**
- **No horse-specific data model** — every listing is a generic text ad. Buyers cannot filter by breed, age, color, training level, pedigree, or health status
- **No trust beyond ID verification** — no seller reviews, no transaction history, no dispute resolution
- **No media-rich listings** — single images only, no video, no lineage documentation
- **No marketplace-specific features** — no offers, no negotiation tools, no escrow, no contracts
- **No mobile-optimized selling flow** for herders who may have limited tech literacy
- **No integration with vet records, microchip data, or registration papers**

---

### 1.2 Facebook Marketplace / Facebook Groups

**Overview:** Facebook is the de facto platform for horse trading globally and in Mongolia. Facebook has policies restricting animal sales in Marketplace, so most activity happens in Facebook Groups.

**How Listings Are Created:**
- Posts in specialized groups (e.g., "HORSES FOR SALE", "AQHA HORSES FOR SALE", Mongolian horse trading groups)
- Free-form text with photos/videos in feed
- No structured data — completely unstructured posts
- Comment-based interest ("DM me", "Interested", tag friends)

**Search/Filter Capabilities:**
- Facebook search within groups (very limited)
- No structured filters — rely on scrolling
- Hashtags sometimes used but inconsistently

**Seller Reputation/Trust:**
- Facebook profile acts as identity (real name policy)
- Group membership and history
- Mutual friends/recommendations
- NO formal rating system
- NO transaction verification
- Scams common (fake profiles, hacked accounts)

**Transaction Flow:**
- Entirely buyer/seller arranged via Messenger
- No platform involvement
- Cash, bank transfer, or HiPay in Mongolia
- No escrow, no protection

**Mobile UX Strengths:**
- Already installed on every smartphone
- Familiar interface
- Groups provide community feel
- Easy photo/video sharing
- Messenger for instant communication

**Mobile UX Weaknesses:**
- No structured data — every listing is a wall-of-text post
- No search or filter for horse attributes
- Facebook's policy prohibits animal sales in Marketplace (enforcement inconsistent)
- Sellers must belong to multiple groups to reach buyers
- No way to track listing performance or inquiries
- Algorithm buries older posts
- High scam risk

**What It Does Well:**
- Massive reach (everyone in Mongolia has Facebook)
- Zero friction to post
- Community/viral effects
- Free

**What It Does Poorly:**
- No marketplace infrastructure at all
- No trust mechanism beyond profile
- No transaction support
- No way to distinguish serious vs. scam listings
- Fragmented across dozens of groups

---

### 1.3 DreamHorse.com (US)

**Overview:** Family-owned horse classifieds since 1998. Focus on US market. ~25+ years of operation.

**How Listings Are Created:**
- Free text-only ads (renewable every 90 days)
- Paid photo ads: Single Photo ($20/90 days), Gallery Ad up to 4 photos ($40/90 days), Spotlight Ad ($100/180 days with top placement + banner art)
- Option to add video link (+$10), extra photos (+$10)
- "Bump Ad to Top" ($5), Social Media Promotion ($25)
- Structured fields: breed, age, price, height, gender, color, skill level, discipline, location, description
- Horse-specific data model with standardized breed list, discipline categories, etc.

**Search/Filter Capabilities:**
- **Advanced Search Center:** breed, city, state, age, price range, height, gender, color, skill level, discipline
- Browse by breed + state
- Search by horse name, bloodline, or ID number
- Zip code radius search
- Very sophisticated for a classifieds site

**Seller Reputation/Trust:**
- BBB Accredited Business (since 1998)
- Community flagging system for inappropriate ads
- User Safety Alerts on every transaction notification
- No formal seller ratings
- "Flag Ad" button for community moderation
- DreamHorse WILL disable accounts for fraud (at their discretion)
- Recommends vet checks, written contracts, and buyer research

**Transaction Flow:**
- No platform involvement in transactions
- No payment processing
- No commission
- Buyer/seller negotiate directly
- DreamHorse explicitly states they are NOT an agent/broker/dealer

**Monetization:**
- Free text ads (loss leader)
- Paid photo upgrades ($20-$100+)
- Bump/promotion fees
- No commission on sales

**Strengths:**
- Deep horse-specific search with 10+ filter dimensions
- Longest-running horse classifieds (trusted brand)
- Free text ads remove friction
- Community flagging helps combat fraud
- Clear safety guidelines and fraud warnings

**Weaknesses:**
- Outdated UI (looks like 1998)
- No mobile app
- No direct messaging (email-only contact forms)
- No seller verification beyond payment
- No mobile-optimized listing creation
- No review/rating system
- No escrow or transaction security

---

### 1.4 Equine.com (US)

**Overview:** Founded 1995. Facilitated 130,000+ horse sales. Recently redesigned (2024). Partner with A Home For Every Horse rescue program.

**How Listings Are Created:**
- Simplified pricing: $20 for 120-day listing (all features included)
- Photo and video upload capabilities
- Direct messaging between buyers and sellers
- Special approval process for ads (manual review to combat fraud)
- Free listings for rescue organizations

**Search/Filter Capabilities:**
- Breed, discipline, location, price, age, gender
- Modern responsive web design
- Category browsing

**Seller Reputation/Trust:**
- **Ad approval process** — every ad is reviewed before going live (key differentiator)
- Partner with rescue network
- Educational content on scam avoidance
- 130,000+ successful sales track record

**Transaction Flow:**
- Direct messaging via platform
- Buyer/seller arrange payment independently
- No platform commission

**Monetization:**
- Flat $20/120-day listing fee
- No commission

**Strengths:**
- Manual ad review reduces scams significantly
- Single price point simplifies decision
- Photo+video support
- Direct messaging
- Long-standing reputation (30 years)

**Weaknesses:**
- Limited to US market
- No mobile app
- No seller rating/review system
- No escrow
- Relatively low listing volume compared to Facebook

---

### 1.5 HorseClicks (US)

**Overview:** US equine marketplace launched 2008. Also sells tack, trailers, equestrian services.

**How Listings Are Created:**
- Free and paid listing tiers
- Horse-specific fields: breed, age, price, location, discipline, color, height, gender
- Photo uploads
- Contact form for inquiries

**Search/Filter Capabilities:**
- Browse by breed, discipline, location
- Good breed and category taxonomy

**Seller Reputation/Trust:**
- No formal verification system
- User reviews mixed (3.04 stars on ResellerRatings)
- Some complaints about listing quality

**Strengths:**
- Established brand
- Multi-category (horses, tack, trailers, services)
- Decent search filters

**Weaknesses:**
- No mobile app
- Outdated design
- No seller rating system
- Mixed user satisfaction

---

### 1.6 Neighh (US)

**Overview:** Modern, mobile-native horse marketplace launched ~2024-2025. Positioned as "trust-first" platform.

**How Listings Are Created:**
- Modern web-based listing creation
- Fields: breed, age, price, discipline, location, temperament, description
- Multiple photo uploads (CDN with responsive images)
- Sale, Lease, or both options
- Title + description with rich formatting

**Search/Filter Capabilities:**
- Filter by: For Sale, Lease, New Today
- Breed, age, price, discipline, location
- Clean card-based feed UI
- Search by keyword
- View count displayed on each listing

**Seller Reputation/Trust:**
- **Verified seller badges** planned/implemented
- **Buyer profiles** — buyers also create profiles
- **Lifelong horse history tracking** — horses have persistent IDs across ownership changes
- "Verified seller tips" shown inline in feed (educational content)

**Transaction Flow:**
- Platform handles initial connection
- Direct contact between buyer and seller
- No platform commission visible

**Monetization:**
- Free to list?
- "Promote listing" feature available
- Premium placement options

**Strengths:**
- Modern, clean mobile-first design
- Verified seller concept with badges
- Persistent horse identity across ownership (lifelong history)
- View counts on listings (market feedback/social proof)
- Temperament as a filterable field (Calm, Energetic, etc.)
- Slick image-first card layout

**Weaknesses:**
- Small user base (new platform, 112 horses listed)
- US-only focus
- No escrow or payment processing
- Limited search refinement compared to DreamHorse

---

### 1.7 Elite Equine Marketplace (US)

**Overview:** Founded 2024. Hunter/jumper focused. Subscription-based model. Full-service listing management available.

**How Listings Are Created:**
- Unlimited listings under subscription
- Photo, video, details
- Map-based trial system (show where horse is based + upcoming travel locations)
- Full-service package available (platform handles listing creation for seller)

**Search/Filter Capabilities:**
- Smart filters for discipline, price, location
- Map-based search
- Wishlist-based notifications ("notify me when matching listing appears")

**Seller Reputation/Trust:**
- Direct messaging
- User dashboard with view counts and earnings tracking
- No formal rating system yet

**Transaction Flow:**
- Direct messaging
- Platform does NOT process payments
- Subscription model, not per-sale commission

**Monetization:**
- $19.99/month unlimited listings
- Long-term package discounts
- Full-service listing management (premium tier)

**Strengths:**
- Clean, modern design
- Map-based trial scheduling (innovative)
- Subscription model (no per-listing friction)
- Mobile-responsive design
- Wishlist alerts
- Service provider directory + event listings (ecosystem approach)

**Weaknesses:**
- Hunter/jumper niche focus (not general horse marketplace)
- No seller/buyer rating system yet
- No escrow or payment processing
- Early stage (limited listings)

---

### 1.8 eHorses.com (Europe/Global)

**Overview:** World's largest online horse marketplace (19,000+ listings). Europe-based but global reach.

**How Listings Are Created:**
- Free and premium listing tiers
- Structured fields: breed, age, discipline, price, location, height, color, gender
- Photo and video upload
- "Protection Contract" available for buyers

**Search/Filter Capabilities:**
- Breed, discipline, age, price, height, color, gender, location
- Advanced filtering
- International listings

**Seller Reputation/Trust:**
- Contact form (email-based, not direct chat)
- Moderation team
- General terms and conditions with buyer/seller protections
- "Protection Contract" option for purchases

**Strengths:**
- Massive inventory (19,000+ horses)
- International reach (40+ countries)
- Well-structured data model
- Protection contract option

**Weaknesses:**
- No mobile app
- Email-only contact (no real-time chat)
- No seller rating system
- European-focused pricing/payment

---

### 1.9 Hüner / Уяач (Mongolia)

**Overview:** "Facebook for Horses" — Mongolian social app for herders. Launched 2017. iOS and Android. Designed for documenting and sharing horse information.

**How Profiles/Listings Are Created:**
- Up to 10 photos per horse
- Data fields: ancestry (lineage), race history, age, sex, health conditions
- Social feed of horses (follow specific animals)
- Privacy controls (public vs. private horse data)

**Search/Filter Capabilities:**
- Browse horses in the network
- Follow specific horses/owners

**Seller Reputation/Trust:**
- Identity through registration
- Horse documentation (photos, lineage, health data)
- Planned microchipping + GPS tracking integration
- Metadata tracking

**Transaction Flow:**
- Social network, not marketplace (no built-in transaction flow)
- Networking leads to private sales

**Monetization:**
- Venture capital funded
- Likely freemium or data services

**Strengths:**
- Built specifically for Mongolian horse culture
- Comprehensive per-horse documentation (photos, lineage, race history, health)
- Social features (follow horses, news feed)
- Offline capability (critical for rural herders)
- Planned microchip integration

**Weaknesses:**
- Early-stage/beta (2017 article, uncertain current status)
- No marketplace/transaction features
- Limited user adoption
- No buyer/seller protections
- No payment integration

---

## 2. Cross-Platform Comparison

| Feature | Unegui.mn | Facebook | DreamHorse | Equine.com | Neighh | Elite Equine | eHorses | Hüner |
|---------|-----------|----------|------------|------------|--------|-------------|---------|-------|
| **Horse-specific data model** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Photo upload** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Video upload** | ❌ | ✅ | 🔗 Link only | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Breed filter** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Age filter** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Price filter** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Location filter** | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Discipline filter** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Temperament filter** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Color/height/gender** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pedigree/lineage data** | ❌ | ❌ | ❌ | ❌ | ✅* | ❌ | ❌ | ✅ |
| **Health records** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Race history** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Mobile app** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Direct messaging** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Seller verification** | ✅ (E-Mongolia) | 🔵 Profile | ❌ | ✅ (Ad review) | ✅ (Planned) | ❌ | ❌ | ❌ |
| **Seller ratings/reviews** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Community flagging** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Escrow/payment** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Commission model** | ❌ | ❌ | ❌ | ❌ | ❌ | Subscription | ❌ | ❌ |
| **Offline capability** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Map-based search** | ✅ | ❌ | ✅ (zip) | ❌ | ❌ | ✅ | ❌ | ❌ |
| **GDPR/Privacy** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

\* Neighh tracks lifelong horse history across ownership changes

---

## 3. Trust & Safety Innovations

### What Each Platform Does for Trust

| Mechanism | Platform | Impact |
|-----------|----------|--------|
| **Government ID verification** | Unegui.mn (E-Mongolia) | High — ties real identity to every listing |
| **Ad approval/manual review** | Equine.com | High — prevents fraudulent ads before they appear |
| **Community flagging** | DreamHorse | Medium — crowd-sourced moderation |
| **Verified seller badges** | Neighh | Medium — visual trust signal |
| **Lifelong horse ID** | Neighh | High — prevents re-listing problem horses under new identity |
| **Microchipping integration** | Hüner (planned) | High — tamper-proof horse identity |
| **Profile identity** | Facebook | Low-Medium — real names but accounts get hacked |
| **BBB accreditation** | DreamHorse | Low — institutional trust, not per-seller |
| **User safety alerts** | DreamHorse | Low — educational, not preventative |
| **Pre-purchase exam recommendation** | Equine.com, DreamHorse | Low — advice only |
| **Written contract recommendation** | Equine.com | Low — advice only |
| **Protection contract option** | eHorses | Medium — formalized protection |

### None of these platforms offer:
- Escrow payment protection
- Buyer/seller rating systems (like eBay, Airbnb)
- Dispute resolution
- Insurance for transactions
- Third-party vet verification integration
- Certificates of authenticity / digital title transfer

---

## 4. Common Frauds & Mitigations

### Top Horse Sale Scams (from Equine.com, DreamHorse, Creatures.com)

1. **Too-good-to-be-true pricing** — Horse priced far below market value to lure victims
2. **Urgency / pressure tactics** — "Multiple buyers lined up, need deposit now"
3. **Deposit-before-viewing** — Seller demands payment before buyer sees horse in person
4. **Sparse listing details** — Minimal info, seller won't provide more
5. **Fake/mismatched photos** — Poor quality images, or images that don't match the horse
6. **No video available** — Seller refuses or cannot provide video of the horse moving
7. **Selling for a friend** — Seller cannot prove ownership, claims to sell for someone else
8. **Drugged horses** — Horse sedated or medicated during trial to mask behavioral issues
9. **Misrepresentation** — Horse doesn't match age, training level, health, or soundness claimed
10. **Phantom horses** — Horse doesn't exist, photos stolen from other listings

### Platforms' Prevention Gaps

| Scam Type | Unegui.mn | Facebook | DreamHorse | Equine.com | Neighh |
|-----------|-----------|----------|------------|------------|--------|
| Fake pricing | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deposit scams | ❌ | ❌ | ❌ | ❌ | ❌ |
| Fake photos | ❌ | ❌ | 🔵 Flagged | ✅ Reviewed | ❌ |
| Misrepresentation | ❌ | ❌ | ❌ | ❌ | ❌ |
| Identity fraud | ✅ ID verify | ❌ | ❌ | ❌ | ✅ Verif. badges |
| Ownership fraud | ❌ | ❌ | ❌ | ❌ | ✅ Horse history |

---

## 5. Recommended Feature List for Tamga Marketplace

### Tier 1: Core (MVP) — Must Have

1. **Horse-Specific Data Model**
   - Structured fields: breed (Mongolian native breeds + others), age, color, height (hands/cm), gender, price, location (aimag/soum level), temperament, training level, discipline, health status, reason for selling
   - Standardized breed list including: Mongolian native horse, Darkhad, Gal shar, Tes, etc.
   - Mongolian + English bilingual labels

2. **Rich Media Uploads**
   - Up to 10 photos per listing
   - Video upload (30-60 seconds showing horse moving)
   - Photo management (reorder, delete, set cover)
   - Reason: Unegui.mn does photos but no video; video is critical for remote horse buying

3. **Advanced Search & Filters**
   - Breed, age range, price range, location (aimag/soum), gender, color, discipline, temperament, health status
   - Map-based search (Unegui does this well — replicate it)
   - Saved searches with push/email notifications
   - Sort by: newest, price, relevance, distance

4. **Seller Verification**
   - Integrate with E-Mongolia DAN identity verification (Unegui already has this — partner or improve upon it)
   - Verified seller badge on listings and profiles
   - Phone number verification (SMS code)
   - Reason: This is Tamga's biggest trust advantage

5. **In-App Direct Messaging**
   - Real-time chat between buyer and seller
   - Message history stored in-app
   - Read receipts
   - Block/report user
   - Reason: Every competitor either lacks this or does it poorly

6. **Listing Creation Flow (Mobile-First)**
   - Step-by-step wizard (not a wall of text fields)
   - Photo-first interface
   - Auto-save drafts (critical for herders with intermittent connectivity)
   - Preview before publishing
   - Reason: Must be simpler than Unegui.mn for herder adoption

### Tier 2: Trust & Safety

7. **Seller Rating & Review System**
   - Post-transaction ratings (1-5 stars)
   - Written reviews
   - Response from seller
   - Reason: NO horse marketplace has this. Huge competitive gap.

8. **Horse Identity / Lifelong History**
   - Each horse gets a permanent profile that persists across owners (like Neighh)
   - Include: photos over time, ownership history, health records, race/competition results, lineage
   - Integrate with microchip/GPS if available
   - Reason: Builds trust, prevents fraud, adds value beyond transaction

9. **Safety Education**
   - Inline tips during listing creation and browsing (like Neighh's "Verified seller tips")
   - Scam warning banners on listings from unverified sellers
   - Downloadable bill of sale / contract template (Mongolian + English)
   - Pre-purchase exam (PPE) checklist

10. **Listing Moderation**
    - ✅ Automated flagging for suspicious content
    - ✅ Community report button
    - ✅ **Admin review queue for reported listings** — Approve/reject flow with seller notification, gated behind feature flag
    - Reason: Equine.com's ad review is effective but manual; automated can scale

### Tier 3: Transaction Support

11. **Offer / Negotiation System**
    - Buyer can send an offer price
    - Seller accepts, declines, or counter-offers
    - All offers recorded

12. **Trial Scheduling**
    - Seller marks location and available trial dates/times
    - Buyer requests trial
    - In-app notification to coordinate
    - Reason: Elite Equine Marketplace does this — valuable for high-value horse sales

13. **Contract Generation**
    - Generate bill of sale from listing data
    - Include: buyer/seller info, horse description, price, date
    - Editable before finalizing
    - Option to share via WhatsApp/Messenger

### Tier 4: Monetization

14. **Free Basic Listings** (like Unegui.mn, DreamHorse)
    - Standard placement, 3 photos, 30 days

15. **Premium Listings**
    - Featured/top placement
    - Up to 10 photos + video
    - Verified seller badge
    - 60-90 day duration
    - Social media promotion (share on Facebook)

16. **Boost / Bump**
    - Pay to refresh listing to top of search results
    - $5 equivalent (like DreamHorse's Bump feature)

17. **Subscription for Power Sellers**
    - Unlimited listings
    - Analytics dashboard (views, inquiries, saved)
    - Priority support

### Tier 5: Ecosystem (Future)

18. **Service Directory**
    - Veterinarians, farriers, trainers, transporters
    - Reviews for service providers
    - Reason: Elite Equine Marketplace does this

19. **Events & Competitions**
    - List upcoming races, tournaments, naadam events
    - Connect horses to their competition results (automatic verification via event results)

20. **Integration with Tamga's Existing Features**
    - Lineage data from existing pedigree tracking
    - Health records from health/farrier logs
    - Sync with sync queue for offline-first usage
    - Certificate/document vault for ownership documents

---

## 6. Top 5 Competitive Advantages for Tamga

### Advantage 1: Horse-Specific + Mongolia-Specific Data Model

**The Gap:** Unegui.mn treats horse listings as generic classifieds with no structured data. Facebook has zero structure. Mongolian herders need breed (Mongolian native types), age, color, training (broken, riding, racing), health status, and location (aimag/soum).

**Tamga's Advantage:** Build the first Mongolian-specific horse marketplace with structured fields for Mongolian breeds, Mongolian location hierarchy (aimag/soum/bag), and Mongolian currency/pricing norms. Every other platform is either generic (Unegui.mn) or Western-focused.

**Why It Wins:** Herders can filter by exact breed type, find horses in their specific region, and compare structured listings — something no existing platform offers in Mongolia.

---

### Advantage 2: E-Mongolia + Tamga Dual Verification

**The Gap:** Unegui.mn has E-Mongolia verification but no seller ratings or reputation system. Facebook has no verification at all. Horse scams are rampant on both.

**Tamga's Advantage:** Combine government ID verification (E-Mongolia) with a seller rating/review system. This creates the most trusted horse marketplace in Mongolia. Verified + reviewed sellers will command premium prices and attract serious buyers.

**Why It Wins:** Horse purchases are high-value (1M–500M+ ₮). Buyers will flock to the platform that gives them the most confidence. No competitor has this combination.

---

### Advantage 3: Lifelong Horse Identity + Existing Feature Integration

**The Gap:** Horses change hands multiple times in Mongolia. Lineage, health history, and race results are lost with each sale. Unegui.mn and Facebook start from zero every time.

**Tamga's Advantage:** Tamga already has lineage tracking, health logs, and competition records. The marketplace can attach to an existing permanent horse profile that follows the animal across ownership. This is the "Carfax for horses."

**Why It Wins:** A buyer can see a horse's full history — parents, health records, vaccination history, race results, previous owners. This is transformational trust. Neighh is trying to build this; Tamga already has the data infrastructure from the existing app.

---

### Advantage 4: Mobile-First, Offline-Capable, Built for Herders

**The Gap:** DreamHorse, Equine.com, HorseClicks have no mobile apps. Elite Equine has no mobile app. Neighh is web-only. Unegui.mn has an app but it's a general classifieds app. Facebook works but is not purpose-built.

**Tamga's Advantage:** Flutter app with offline-first Isar database (already built). Herders in remote areas with intermittent connectivity can:
- Browse listings offline
- Save drafts offline
- Message when connection returns
- Upload photos when on 3G/4G

**Why It Wins:** Mongolia's herders are in remote areas with poor connectivity. An offline-capable app built specifically for them addresses a real pain point that no competitor solves.

---

### Advantage 5: Integrated Ecosystem (Not Just a Marketplace)

**The Gap:** All competitors are standalone marketplaces. Buyers must leave the platform for vet records, health history, lineage info, competition results, and contract generation.

**Tamga's Advantage:** Tamga already has:
- Horse profiles with medical records
- Lineage/pedigree tracking
- Competition/event results
- Document vault for certificates
- Sync queue for offline data

The marketplace isn't a separate product — it's a feature of the existing horse management app. Listings are created from existing horse profiles with one click, pulling in photos, health data, and lineage automatically.

**Why It Wins:** Sellers don't have to re-enter data. Buyers get verified history. The platform becomes the source of truth for Mongolian horse ownership, not just a listing board. This lock-in effect is powerful — once a herder's horse data is in Tamga, they'll use Tamga to sell.

---

## Summary

| Platform | Best For | Key Takeaway for Tamga |
|----------|----------|----------------------|
| Unegui.mn | Reach, free listings | Must beat on trust + horse-specific data |
| Facebook Groups | Virality, zero friction | Must offer more trust and structure |
| DreamHorse | Search depth, longevity | Copy the advanced search filters |
| Equine.com | Trust via ad review | Implement automated moderation |
| Neighh | Modern UX, verified sellers | Copy verified badges + horse history |
| Elite Equine | Subscription model, map trials | Copy trial scheduling + service directory |
| eHorses | International scale, data model | Copy structured listing fields |
| Hüner | Mongolian social, offline | Copy horse documentation + offline mode |

### Key Insight

**No existing platform combines: (1) horse-specific data, (2) seller verification, (3) seller ratings, (4) lifelong horse history, (5) mobile offline capability, and (6) integration with health/lineage data.** Tamga can be the first to do all six in Mongolia, creating a defensible competitive moat.
