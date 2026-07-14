title: Finance — Revenue Model & Unit Economics
desc: Multi-stream revenue model, unit economics, burn rate, funding strategy, break-even analysis.

# Finance — Revenue Model & Unit Economics

> Working model for Tamga's financial plan. Treat this as a planning model, not audited financial advice.
> Last revised: 2026-06-10

## Quick Verdict

Tamga should be modeled as a **trust + transaction platform**, not a pure subscription app. The subscription line creates baseline recurring revenue, but the fastest cash comes from on-site registration, vendor pre-sales, race organizer pilots, certificates, and verified marketplace transfers.

**Base-case result:** Year 1 reaches about **₮51.6M gross revenue**, **₮41.4M contribution after direct costs**, and **₮9.4M after-tax operating profit** if the operations/sales work happens on schedule.

---

## Model Constants

These constants drive every projection below.

| Constant | Base Assumption | Source / Rationale |
|---|---:|---|
| FX rate | **₮3,500 = $1** | Rounded planning rate from MongolBank/Data.mn 2025 averages |
| VAT rate | **10%** | [PwC Mongolia — other taxes](https://taxsummaries.pwc.com/mongolia/corporate/other-taxes) |
| VAT registration threshold | **₮50M revenue over 12 consecutive months** | [PwC Mongolia — VAT](https://taxsummaries.pwc.com/mongolia/corporate/other-taxes) |
| Small entity CIT | **1% of revenue up to ₮300M/year** | [PwC Mongolia — corporate income tax](https://taxsummaries.pwc.com/mongolia/corporate/taxes-on-corporate-income) |
| Standard CIT placeholder | **10% of pre-tax profit** | Used once revenue exceeds small-entity simplified threshold |
| App store commission | **15%** | Apple Small Business Program + Google Play first-$1M/subscription fee assumption |
| RevenueCat | **₮0 while under $2,500 monthly tracked revenue** | [RevenueCat pricing](https://www.revenuecat.com/pricing) |
| QPay / local payment fee | **1–2%; model uses 2% incl. refund buffer** | [QPay card payment](https://qr.qpay.mn/card-payment), [TDB QPay merchant](https://www.tdbm.mn/en/retail/cards/qpay-merchant), [UniPay fees](https://www.unipay.mn/payment-processing-fee/) |
| On-site travel cost | **₮100,000/visit** | Working assumption for fuel + time |
| Monthly fixed opex, Y1 | **₮2.625M/month** | $700/month equivalent at ₮3,500/USD + local operating buffer |
| Monthly fixed opex, Y2 | **₮4.9M/month** | More marketing, ops support, infra, and bookkeeping |
| Monthly fixed opex, Y3 | **₮7.0M/month** | Paid ops + support + stronger marketing |

### Definitions

| Term | Meaning |
|---|---|
| **Gross revenue** | Customer cash collected, VAT-inclusive where VAT applies |
| **Sales net of VAT** | Gross revenue minus VAT collected/remitted |
| **Contribution after direct costs** | Sales net of VAT minus app-store fees, payment fees, refunds, and on-site travel |
| **Operating profit** | Contribution after direct costs minus fixed opex |
| **Owner income** | Cash that can safely be distributed after taxes and reinvestment. This is not the same as gross revenue |

---

## Research-Backed + Working Assumptions

| Assumption | Value | Source / Confidence | Model Use |
|---|---:|---|---|
| Total horses in Mongolia | **5.1M** | [MONTSAME / NSO preliminary 2025 livestock census](https://montsame.mn/en/read/386699) — high | Total herd context |
| Livestock-owning households | **247,900** | [MONTSAME / NSO](https://montsame.mn/en/read/386699) — high | Broad household TAM |
| Horse-owning households | **150K–180K** | Derived from livestock household base + horse herd share — medium | Domestic SAM |
| Tech-ready horse households | **45K–60K** | Working assumption: ~30% of horse-owning households | 3-year user ceiling |
| Avg household income | **~₮1.8M/month** | NSO/HSES via MONTSAME-style household income reports — medium/high | Pricing sensitivity |
| Avg herder household annual income | **~₮15.6M/year** | FAO / bne IntelliNews-style rural income estimates — medium | Share-of-wallet test |
| Smartphone penetration | **80%+** | Industry reports — medium | Mobile-first distribution |
| Digital banking readiness | **High** | Khan Bank digital transaction mix + QPay/SocialPay prevalence — medium/high | QPay-first payments |
| Mobile subscription download → paid | **0.6%–4.2%; base 1.7%** | [RevenueCat State of Subscription Apps 2024](https://www.revenuecat.com/state-of-subscription-apps-2024/) — high | Subscription conversion |
| SaaS free → paid conversion | **3%–5% good, 8% median in B2B sample** | [ChartMogul SaaS Conversion Report 2026](https://chartmogul.com/reports/saas-conversion-report/) — high, but less local | Upside benchmark only |
| Local SaaS pricing analog | **~$3.33/month popular tier** | [Motolog pricing](https://motolog.app/mn/pricing) — high | Validates Tamga Pro price band |
| Marketplace take-rate benchmark | **5%–10% B2B/open goods** | Global marketplace benchmarks — medium | Ceiling; Tamga uses lower visible transfer fee first |
| Horse-sale commission / transfer fee | **2.5% base for Tamga-verified transfers** | Working assumption below physical auction rates | Reduce bypass risk |

> **Important:** Rows marked as working assumptions should be replaced with real Tamga cohort data after 3–6 months. Do not use this document externally as “verified market data” unless every claim has a primary-source URL.

---

## Revenue Streams Overview — Base Case

| # | Stream | Formula Driver | Year 1 Gross | Year 2 Gross | Year 3 Gross | Confidence |
|---|---|---|---:|---:|---:|---|
| 1 | Subscriptions | Users × paid conversion × ₮14,900 ARPPU | **₮9.0M** | **₮46.9M** | **₮140.8M** | Medium |
| 2 | Marketplace listings / boosts / bundles | Paid listings × bundle/listing ARPU | **₮4.3M** | **₮17.3M** | **₮36.0M** | Medium |
| 3 | Tamga-verified transfer fees | Completed verified transfers × sale price × 2.5% | **₮3.6M** | **₮10.8M** | **₮24.3M** | Medium/Low |
| 4 | Digital certificates | Certificates × avg ₮4,000 | **₮3.8M** | **₮7.2M** | **₮12.0M** | Medium |
| 5 | On-site registration | Visits × 8 horses × ₮29,900 | **₮19.1M** | **₮23.0M** | **₮26.8M** | High if ops exists |
| 6 | Race organizer SaaS | Event software + results + verification | **₮4.8M** | **₮10.6M** | **₮22.5M** | Low/Medium |
| 7 | Vendor pre-sales / listings | Founding + standard vendors | **₮4.5M** | **₮3.0M** | **₮4.0M** | Medium |
| 8 | Other pilots | Vet, insurance, sponsorship, supply shop, data | **₮2.5M** | **₮20.0M** | **₮45.0M** | Low |
|  | **Total Gross Revenue** |  | **₮51.6M (~$14.7K)** | **₮138.8M (~$39.7K)** | **₮311.4M (~$89.0K)** |  |

**Why Year 1 increased from the old model:** the old subscription table double-discounted ARPU and mislabeled on-site registration profit as revenue. This revision separates gross revenue, contribution, and operating profit.

---

## Profit & Loss — Base Case

| Metric | Year 1 | Year 2 | Year 3 |
|---|---:|---:|---:|
| Gross revenue | **₮51.6M** | **₮138.8M** | **₮311.4M** |
| VAT reserve / VAT collected | ₮0M–₮1M late-year risk | **₮12.6M** | **₮28.3M** |
| Direct costs + payment fees + travel | **₮10.2M** | **₮17.7M** | **₮33.5M** |
| Contribution after direct costs | **₮41.4M** | **₮108.5M** | **₮249.6M** |
| Fixed operating costs | **₮31.5M** | **₮58.8M** | **₮84.0M** |
| Pre-tax operating profit | **₮9.9M** | **₮49.7M** | **₮165.6M** |
| Tax provision | **₮0.5M** | **₮1.4M** | **₮16.6M** |
| **After-tax operating profit** | **₮9.4M (~$2.7K)** | **₮48.3M (~$13.8K)** | **₮149.0M (~$42.6K)** |

### Owner Income Guidance

Do not divide gross revenue by two. Use after-tax profit after reinvestment.

| Year | After-Tax Profit | Recommended Reinvestment | Safe Owner Draw Pool | Approx. Per Founder, 2 People |
|---|---:|---:|---:|---:|
| Year 1 | ₮9.4M | 50%–100% | ₮0–₮4.7M | ₮0–₮2.35M ($0–$670) |
| Year 2 | ₮48.3M | 40%–50% | ₮24M–₮29M | ₮12M–₮14.5M ($3.4K–$4.1K) |
| Year 3 | ₮149.0M | 40%–50% | ₮75M–₮89M | ₮37.5M–₮44.5M ($10.7K–$12.7K) |

---

## Scenario Analysis — Year 1

| Scenario | Gross Revenue | Contribution After Direct Costs | After-Tax Profit / Loss | Break-Even Timing | Notes |
|---|---:|---:|---:|---|---|
| Conservative | **₮17.2M (~$4.9K)** | **₮13.8M** | **-₮10.2M** | Not in Year 1 | Weak sales execution; mostly subscriptions + small registration |
| Base | **₮51.6M (~$14.7K)** | **₮41.4M** | **₮9.4M** | Month 10–12 | Requires active registration, vendor, and race outreach |
| Optimistic | **₮85.8M (~$24.5K)** | **₮70.8M** | **₮28.0M** | Month 6–8 | Strong Naadam launch + active field sales |

### Scenario Inputs

| Stream | Conservative | Base | Optimistic |
|---|---:|---:|---:|
| Subscriptions | ₮5.3M | ₮9.0M | ₮15.9M |
| Marketplace listings / boosts / bundles | ₮2.0M | ₮4.3M | ₮8.0M |
| Tamga-verified transfer fees | ₮1.0M | ₮3.6M | ₮8.6M |
| Digital certificates | ₮1.2M | ₮3.8M | ₮5.0M |
| On-site registration | ₮5.7M | ₮19.1M | ₮26.8M |
| Race organizer SaaS | ₮0.5M | ₮4.8M | ₮8.0M |
| Vendor pre-sales | ₮1.0M | ₮4.5M | ₮7.5M |
| Other pilots | ₮0.5M | ₮2.5M | ₮6.0M |

---

## Stream Details

### 1. Subscriptions

Feature-gated freemium model. Free tier is useful, but paid tiers unlock capacity and advanced workflows.

| Tier | Price Monthly | Price Annual | Target Segment |
|---|---:|---:|---|
| Free | ₮0 | ₮0 | Casual owners; 1 horse; browsing + basic records |
| Pro | ₮9,900 | ₮99,000 | Active owners; unlimited horses, health records, reminders |
| Breeder | ₮24,900 | ₮249,000 | Breeders; pedigree, breeding records, certificates |
| Stable | ₮49,900 | ₮499,000 | Stables; multi-user, client portal, invoicing |

**Paid-user mix assumption:**

| Tier | Share of Paid Users | ARPPU Contribution |
|---|---:|---:|
| Pro | 75% | ₮7,425 |
| Breeder | 20% | ₮4,980 |
| Stable | 5% | ₮2,495 |
| **Blended paid ARPPU** |  | **₮14,900/month** |

**Base Year 1 monthly subscription model:**

| Month | Registered Users | Paid Conversion | Paid Users | MRR |
|---|---:|---:|---:|---:|
| Jun | 200 | 1.7% | 3 | ₮44,700 |
| Jul | 500 | 1.7% | 8 | ₮119,200 |
| Aug | 900 | 1.7% | 15 | ₮223,500 |
| Sep | 1,400 | 1.7% | 24 | ₮357,600 |
| Oct | 2,000 | 1.7% | 34 | ₮506,600 |
| Nov | 2,600 | 1.7% | 44 | ₮655,600 |
| Dec | 3,200 | 1.7% | 54 | ₮804,600 |
| Jan | 3,800 | 1.7% | 65 | ₮968,500 |
| Feb | 4,400 | 1.7% | 75 | ₮1,117,500 |
| Mar | 5,000 | 1.7% | 85 | ₮1,266,500 |
| Apr | 5,500 | 1.7% | 94 | ₮1,400,600 |
| May | 6,000 | 1.7% | 102 | ₮1,519,800 |
| **Year 1 total** |  |  |  | **₮8,984,700** |

> Conversion is intentionally based on mobile subscription benchmarks, not B2B SaaS benchmarks. If Tamga sees strong direct sales through herder communities, this can move toward 3%–5%.

### 2. Marketplace Listings, Boosts & Bundles

Free listings create supply. Paid visibility creates monetization.

| Product | Price | Base Volume Assumption |
|---|---:|---|
| Featured listing | ₮3,000/week | Entry paid listing |
| VIP listing | ₮8,000/week | Serious sellers |
| Boost | ₮2,000/day | High-margin promotion |
| Refresh | ₮1,000 | Low-friction add-on |
| Seller bundle | ₮8,000–₮40,000 | Best ARPU lever |

**Base formula:** average 30 paid listing/bundle purchases/month × ~₮12,000 blended ARPU × 12 months = **~₮4.3M Year 1**.

### 3. Tamga-Verified Transfer Fees

Use safer legal wording: Tamga does **not** make a sale legally valid. It can require a certificate only for a **Tamga-verified transfer inside Tamga**.

| Metric | Base Assumption |
|---|---:|
| Average verified sale value | ₮1.8M |
| Tamga verified transfer fee | 2.5% |
| Average verified transfers, Year 1 | 8/month |
| Year 1 gross | **₮3.6M** |

**Risk:** sellers can still find buyers on Tamga and transact off-platform. The mitigation is not “mandatory for legitimate sales”; it is “verified transfer, ownership history, certificate, and buyer trust require completing the transfer in Tamga.”

### 4. Digital Certificates

| Certificate | Price | When Needed |
|---|---:|---|
| Ownership Transfer Certificate | ₮5,000 | Tamga-verified transfer |
| Pedigree Certificate | ₮3,000 | Selling or breeding |
| Health Record Certificate | ₮2,500 | Selling, insurance, competition |
| Insurance Document Pack | ₮4,000 | Insurance application |
| Competition History Certificate | ₮2,000 | Race horse sale |
| Full Dossier | ₮10,000 | High-value horse sale |

**Base formula:** ~80 certificates/month × ₮4,000 blended price × 12 months = **~₮3.8M Year 1**.

### 5. On-Site Registration Service

This is the strongest Year 1 cashflow stream if one person actively sells and schedules visits.

| Metric | Value |
|---|---:|
| Price per horse | ₮29,900 |
| Horses per visit | 8 |
| Revenue per visit | ₮239,200 |
| Travel/time cost per visit | ₮100,000 |
| Contribution per visit before payment fees | ₮139,200 |
| Base visits/month | 10 |
| Active season | 8 months |
| **Year 1 gross revenue** | **₮19.1M** |
| **Year 1 travel/time COGS** | **₮8.0M** |
| **Year 1 contribution before payment fees** | **₮11.1M** |

The old model labeled ₮1.39M as monthly revenue. It is actually monthly contribution profit before payment fees.

### 6. Race Organizer SaaS

| Service | Price | Year 1 Base Volume | Gross |
|---|---:|---:|---:|
| Race registration platform | ₮500,000/event | 4 events | ₮2.0M |
| Results management | ₮200,000/event | 4 events | ₮0.8M |
| Horse verification | ₮10,000/horse | 200 horses | ₮2.0M |
| **Year 1 total** |  |  | **₮4.8M** |

The old section said ₮2M while the line items summed to ₮4.8M. This revision uses the formula total.

### 7. Vendor Pre-Sales

| Deal | Price | Year 1 Base Volume | Gross |
|---|---:|---:|---:|
| Founding vendor | ₮500,000/year | 5 | ₮2.5M |
| Standard vendor | ₮200,000/year | 10 | ₮2.0M |
| **Year 1 total** |  |  | **₮4.5M** |

This remains a key first-dollar stream because it can be sold before the supply shop is fully built.

### 8. Other Pilots

| Stream | Year 1 | Year 2 | Year 3 | Notes |
|---|---:|---:|---:|---|
| Vet marketplace | ₮0.5M | ₮2M | ₮5M | Verified listing fees + booking leads |
| Insurance referrals | ₮0.5M | ₮3M | ₮7M | Referral codes; do not sell insurance directly |
| Sponsorships / ads | ₮0.5M | ₮4M | ₮8M | Vet/feed brands |
| B2B partnerships | ₮0.5M | ₮3M | ₮6M | Clinics, pharma, associations |
| Supply shop | ₮0.5M | ₮7M | ₮16M | Seller commission / margin share |
| Data licensing | ₮0 | ₮1M | ₮3M | Only aggregate/consented data |
| **Total** | **₮2.5M** | **₮20M** | **₮45M** | Low confidence until validated |

---

## Break-Even Analysis

| Scenario | Break-Even Timing | Why |
|---|---|---|
| Conservative | Not in Year 1 | Too little field sales; subscriptions alone cannot cover fixed costs |
| Base | Month 10–12 | On-site registration + vendor pre-sales carry the first year |
| Optimistic | Month 6–8 | Strong Naadam launch, fast registration bookings, and event pilots |

**Fastest paths to break-even:**
1. On-site registration bookings
2. Vendor pre-sales
3. Race organizer pre-sales
4. Seller bundles
5. Subscriptions

Subscriptions matter, but they are not the fastest first-dollar path.

---

## Unit Economics

### Subscription Unit Economics

| Metric | Conservative | Base | Optimistic |
|---|---:|---:|---:|
| Registered → paid conversion | 1.0% | 1.7% | 3.0% |
| Paid ARPPU | ₮14,900 | ₮14,900 | ₮14,900 |
| App-store fee | 15% | 15% | 15% |
| Net revenue per paid user/month | ₮12,665 | ₮12,665 | ₮12,665 |
| Monthly churn | 10% | 7% | 5% |
| Implied gross LTV | ₮149,000 | ₮212,857 | ₮298,000 |
| CAC target | ≤₮20,000 | ≤₮15,000 | ≤₮12,000 |
| Target LTV:CAC | 7:1 | 14:1 | 25:1 |

### On-Site Registration Unit Economics

| Metric | Value |
|---|---:|
| Revenue per visit | ₮239,200 |
| Travel/time COGS | ₮100,000 |
| Payment/refund reserve, 2% | ₮4,784 |
| Contribution per visit | **₮134,416** |
| Contribution margin | **56%** |

---

## Costs

### Fixed Operating Costs

| Category | Year 1 / Month | Year 2 / Month | Year 3 / Month |
|---|---:|---:|---:|
| Infrastructure / Supabase / tools | ₮175K | ₮350K | ₮700K |
| Docs, domains, Apple/Google, SaaS | ₮100K | ₮150K | ₮250K |
| Marketing / events | ₮525K | ₮1.05M | ₮1.75M |
| Ops / sales support | ₮1.75M | ₮3.0M | ₮4.0M |
| Accounting / legal / admin buffer | ₮75K | ₮350K | ₮300K |
| **Total fixed opex** | **₮2.625M** | **₮4.9M** | **₮7.0M** |
| **Annual fixed opex** | **₮31.5M** | **₮58.8M** | **₮84.0M** |

### Direct Costs

| Cost | Rate | Applies To |
|---|---:|---|
| Apple / Google IAP | 15% | Subscriptions |
| RevenueCat | 0% in this model | Under $2,500 monthly tracked revenue until scale |
| QPay / SocialPay / UniPay + refund buffer | 2% | Listings, certificates, registration, vendor payments |
| On-site travel/time | ₮100,000/visit | Registration visits |
| VAT | 10% once registered | Modeled as VAT reserve from Year 2 onward |

---

## Seasonality

| Month | Season | Herder Activity | Revenue Impact |
|---|---|---|---|
| Jan–Feb | Deep winter | Feed animals, survive dzud | Low subscriptions, low marketplace, churn risk |
| Mar–Apr | Spring | Foaling, cashmere income | Better subscription/payment readiness |
| May–Jun | Pre-Naadam | Race prep, registration | Registration + certificate peak starts |
| Jul | Naadam | Peak race season | Highest event/certificate/marketplace attention |
| Aug–Sep | Late summer | Sell horses, breed | Marketplace + transfer fee peak |
| Oct–Nov | Autumn | Prepare for winter, sell excess | Moderate marketplace activity |
| Dec | Early winter | Move to winter camp | Low activity, collections harder |

**Cashflow implication:** bank enough May–October revenue to survive December–February.

---

## Collectability Risk

| Stream | Collectability | Risk | Mitigation |
|---|---|---|---|
| Subscriptions | High | App-store churn | Trigger upgrades only at clear value moments |
| VIP / Boost / Bundles | High | Low uptake | Pay-first, list-second; clear performance stats |
| Certificates | High | Users may not value them | Attach to verified transfer and race/sale trust |
| On-site registration | High | Scheduling/travel complexity | Collect deposit before visit |
| Vendor pre-sales | High | Sales effort required | Simple annual contract + founding badge |
| Tamga-verified transfer fee | Medium | Seller/buyer bypass | Verified transfer history, buyer trust, certificate bundle |
| Insurance referrals | Medium | Tracking leakage | Unique referral codes and partner reporting |
| Race organizer SaaS | Medium | Organizer may use spreadsheets | Pre-sell around pain: registration, results, verification |
| Data licensing | Low | Privacy/legal risk | Aggregate and consent-only; do not rely on it early |

---

## First-Dollar Plan

| Stream | When | What Is Needed | Year 1 Target |
|---|---|---|---:|
| On-site registration | Month 1 | Camera, travel, manual workflow, deposit collection | ₮19.1M gross |
| Vendor pre-sales | Month 1 | Pitch deck + contract + founding badge | ₮4.5M gross |
| Race organizer pre-sales | Month 2 | Demo + event contract | ₮4.8M gross |
| Seller bundles | Month 2 | Marketplace MVP + QPay | ₮4.3M gross incl. paid listings |
| Subscriptions | Month 3 | RevenueCat + app live | ₮9.0M gross |
| Certificates | Month 3 | PDF generator + QR verification | ₮3.8M gross |
| Verified transfer fee | Month 4 | Transfer flow + certificate + buyer trust | ₮3.6M gross |
| Supply shop | Month 8+ | Vendor onboarding + shop MVP | Part of other pilots |

**The first three streams require almost no product complexity. They require sales execution.**

---

## KPI Dashboard

| KPI | Month 6 Target | Month 12 Target | Why It Matters |
|---|---:|---:|---|
| Registered users | 2,000 | 6,000 | Top of funnel |
| Monthly active users | 800 | 2,400 | 40% active-rate target |
| Paid subscribers | 34 | 102 | Base 1.7% paid conversion |
| Marketplace listings | 100 | 300 | Marketplace liquidity |
| Paid listings / boosts / bundles | 20 | 60 | Marketplace monetization |
| Tamga-verified transfers | 5/month | 12/month | Transfer fee + certificate revenue |
| Certificates sold | 30/month | 100/month | Trust + document revenue |
| Registration bookings | 10/month in season | 20/month in season | Fastest cashflow stream |
| Vendor contracts signed | 5 | 15 | Pre-sale revenue |
| Race organizer pilots | 2 | 4 | B2B validation |
| Gross monthly revenue | ₮2M | ₮6M | Revenue traction |
| CAC | ≤₮15,000 | ≤₮12,000 | Acquisition efficiency |
| Monthly churn | ≤7% | ≤5% | Retention |

---

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Free competitor expectations | Users resist paid plans | Keep free useful; monetize trust, transactions, and field services |
| Subscription conversion below 1% | Recurring revenue weak | Lean harder on registration, certificates, vendor sales |
| Marketplace bypass | Transfer fees leak | Tamga-verified transfer history, certificates, buyer trust, seller analytics |
| VAT threshold crossed earlier than expected | Net revenue drops if prices VAT-inclusive | Decide in advance which prices are VAT-inclusive vs VAT-added |
| Field sales not executed | Base case fails | Assign one person to ops/sales/events with weekly quotas |
| Race organizers do not pay | B2B line delayed | Treat as pilot upside, not core survival revenue |
| Winter churn | Revenue dip | Annual plans, seasonal billing, pre-winter retention campaigns |
| Legal overclaiming | Liability risk | Use “Tamga-verified transfer,” never “legal registry” |

---

## What Not to Build Yet

| Do Not Build Yet | Why |
|---|---|
| Complex government registry integrations | Too slow and legally risky |
| Data licensing as a core revenue stream | Requires scale, consent, and trust |
| GPS/AI hardware features | Distracts from first-dollar revenue |
| Complex marketplace slot auctions | Wait until marketplace liquidity exists |
| More subscription tiers | Four tiers are already enough |
| High-friction paid onboarding | Free competitor expectations are strong |

---

## Financial To-Do List

### Immediate — Before Launch

- [ ] Register ХХК and open business bank account
- [ ] Decide VAT-inclusive vs VAT-added display by product type
- [ ] Contact QPay and SocialPay/Golomt for actual merchant contracts
- [ ] Create RevenueCat account and Apple/Google subscription products
- [ ] Create bookkeeping spreadsheet with gross, VAT, fees, COGS, opex, tax, owner draw
- [ ] Create one-page vendor pre-sale offer
- [ ] Create on-site registration booking/deposit workflow

### Before Monetization

- [ ] Integrate QPay/SocialPay or bank-transfer confirmation for non-subscription purchases
- [ ] Integrate RevenueCat for subscriptions
- [ ] Create invoice and receipt templates
- [ ] Consult accountant on VAT registration timing and small-entity CIT eligibility
- [ ] Draft contracts for vendor listings and race organizer pilots

### Ongoing

- [ ] Monthly finance review: gross, net, contribution, opex, tax reserve, runway
- [ ] Monthly cohort review: registered → active → paid → retained
- [ ] Quarterly pricing review against real conversion and churn
- [ ] Annual financial statements and tax filings

---

## Related

- [Product](../product/index.md) — feature inventory and tier definitions
- [Pricing](../product/pricing.md) — detailed pricing psychology
- [Competitor](../market/competitor.md) — Uyach positioning and pricing comparison
- [Legal](./legal.md) — tax obligations and compliance
- [Market](../market/index.md) — GTM strategy and market context
