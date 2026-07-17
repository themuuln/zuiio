# GPS Tracking Hardware — Deep Research Report

**Date:** 2026-07-16  
**Source:** Deep research run (9 workers, ~120 sources, 4 rounds)  
**Research dir:** `~/.omp/research/2026-07-16-horse-gps-mongolia-countryside/`

---

## TL;DR

1. **AirTag will NOT work** in rural Mongolia — no Find My relay density, won't survive −30°C winters, no developer API.
2. **SmartOne C via Spotter International (Ulaanbaatar)** is the proven solution — 30,000+ satellite collars deployed since 2014, **~$98/unit, ~$140/yr service**.
3. **No cheaper Chinese satellite alternative exists** — PD28 (Beidou short-message) costs $480 (5× SmartOne C). Cheap Chinese 4G trackers ($38–47) need cellular.
4. **Battery life in Mongolian winter at 6 tx/day: ~100–120 days** (4 months). At 2 tx/day: ~250–350 days.
5. **Integration path**: Spotter has NO public API → use **Flespi middleware** → Supabase Edge Function → Postgres → Realtime → Flutter.

---

## 1. AirTag — NOT VIABLE

Three independent fatal flaws:

| Flaw | Detail | Confidence |
|---|---|---|
| **No Find My relay density** | Rural Mongolia: 0.4–2 people/km², 61% Android. AirTag needs iPhones within 10m to relay. | HIGH |
| **Won't survive winter** | AirTag: −20°C min. Mongolia: −30°C to −45°C. CR2032 battery at −40°C: ~51% capacity. | HIGH |
| **No developer API** | MFi Program only (hardware manufacturers). No public API for location queries. | HIGH |

Airpinpoint (the only AirTag livestock vendor) explicitly states: "Not suitable for remote, sparse areas."

---

## 2. Winner: SmartOne C via Spotter International

### Why Spotter

- **30,000+ collars deployed** across Mongolia, Kazakhstan, Kyrgyzstan since 2014
- Globalstar press release confirms milestone ([source](https://investors.globalstar.com/news-releases/news-release-details/globalstar-partner-spotter-achieves-milestone-over-30000))
- Mongolian company based in Ulaanbaatar
- Sells in MNT, handles certification/customs, Mongolian-language platform

### SmartOne C Specs

| Spec | Value |
|---|---|
| Satellite network | Globalstar LEO |
| Waterproof | IP68 / NEMA 4X |
| Operating temp | −30°C to +60°C (extended: −40°C) |
| Weight | 102g |
| Battery | 4× Energizer L92 AAA Li/FeS₂ |
| Battery life (room temp) | 1 tx/day: ~750d; 6 tx/day: ~200d; 24 tx/day: ~80d |
| **Battery life (Mongolian winter)** | **6 tx/day: ~100–120d; 2 tx/day: ~250–350d** |
| Reporting | 12 programmable times per day |
| Features | Motion sensing, geofence alerts |

### Spotter Pricing (Mongolia)

| Item | Price (MNT) | Price (USD) |
|---|---|---|
| SmartOne C hardware | ₮350,000 | ~$98 |
| Spot Trace hardware | ₮260,000 | ~$73 |
| Activation fee | ₮110,000 | ~$31 |
| Monthly (3 tx/day) | ₮40,000 | ~$11 |
| Monthly (6 tx/day) | ₮45,000 | ~$13 |
| Monthly (24 tx/day) | ₮70,000 | ~$20 |

**3-year TCO for 10 SmartOne C units: ~$4,090** ($136/unit/year).

### Battery Life in Mongolian Winter (Resolved)

The "1.5+ years" claim assumes 1–2 tx/day at room temperature. Real-world in Mongolian winter:

| tx/day | Room temp | Mongolian winter |
|---|---|---|
| 1 | ~750 days | ~375–500 days |
| 6 | ~200 days | **~100–120 days** |
| 24 | ~80 days | **~40–50 days** |

Source: SmartOne C User Manual Appendix L (FCC filing) + Energizer L92 datasheet cold derating (~51% capacity at −40°C).

---

## 3. Integration Architecture — Flespi → Supabase → Flutter

### The Problem

**Spotter has NO public API, SDK, or developer documentation.** Their platform is a closed consumer app. SmartOne C is an uplink-only device — data goes to Spotter's back office with no third-party access.

### The Solution: Flespi Middleware

[Flespi](https://flespi.com) natively supports Globalstar/SmartOne C protocol and provides REST + MQTT APIs.

```
SmartOne C collar
    ↓ (Globalstar satellite uplink)
Globalstar network
    ↓ (protocol translation)
Flespi middleware (REST/MQTT API)
    ↓ (webhook push)
Supabase Edge Function
    ↓ (RPC insert)
Supabase Postgres (horse_locations table)
    ↓ (Realtime subscription)
Flutter app (Tamga)
```

### Integration Options Evaluated

| Path | Feasibility | Notes |
|---|---|---|
| **Flespi middleware** | ✅ Best option | Native Globalstar support. REST + MQTT. ~€30/mo per channel. |
| Traccar self-hosted | ⚠️ Risky | Protocol mismatch with SmartOne C (SAXParseException on port 5185). |
| Garmin IPC | ⚠️ Overkill | Best documented API but requires enterprise account. 3–4× cost. |
| Spotter direct | ❌ No API | Closed platform. |
| Globalstar direct | ❌ Gatekept | Commercial API license or VAR status required. |

### Flutter Packages

- `traccar_sdk` — typed Dart client for Traccar REST + WebSocket
- `tracelet` + `tracelet_supabase` — background geolocation with direct Supabase sync
- `flutter_background_geolocation` — production-grade background location tracking

### Data Pattern

Store-and-forward with minutes-to-hours latency. Acceptable for horse tracking — real-time positioning is not needed; periodic updates every 5–10 minutes suffice.

---

## 4. Chinese Market Analysis

### Critical Distinction

**Most "satellite GPS trackers" from Chinese manufacturers use Beidou for POSITIONING but 4G for DATA TRANSMISSION.** Only RDSS short-message models provide true satellite uplink.

### Chinese Satellite Trackers (True Off-Grid)

| Product | Network | Price | Battery | Temp | Mongolia? |
|---|---|---|---|---|---|
| **PD28** (Pangu Smart) | Beidou-3 RDSS | ¥3,500 (~$480) | ≥10,000mAh, 8+ months | −20°C to +60°C | ⚠️ Coverage unverified |
| **Inner Mongolia Starlink** | Beidou short msg | System pricing | Multi-year | Steppe-proven | ✅ Deployed since 2018 |
| **TrackPro TR130** | Iridium 9602 SBD | $390–430 | Li-Po backup | −40°C to +65°C | ✅ Iridium global |

**The PD28 at $480 is 5× the SmartOne C price ($98). No cheaper Chinese satellite tracker exists.**

### Chinese 4G Trackers (NOT Off-Grid, But Cheap)

| Product | Price | Battery | Notes |
|---|---|---|---|
| WE-GT080 | $38–47 | 20,000mAh + solar | Best price/spec ratio |
| Q19 Solar | $40–70 | Solar-powered | Collar form factor |
| Veeloc G55N | $38–47 | Lithium + solar | IP67, proven |
| UniGuard Ear Tag | ~$30 | Solar + USB-C | 28g ultra-light |

**These are great value but only work where 4G exists.** Could enable a hybrid approach: SmartOne C remote + cheap 4G where cellular exists.

### Beidou Livestock Ecosystem

- 8+ Chinese manufacturers: Datarun, Zhongnong Zhilian, Xinyue Tech, Wuhe/Xingdou, Wenheng Beidou, Zhida IoT, Pangu Smart, Inner Mongolia Starlink
- 20,000+ Beidou smart grazing collars deployed across Chinese provinces
- FAO Global Technology Recognition awarded to Inner Mongolia Starlink (2025)
- APIs exist: NexAgri offers HTTP callbacks + developer docs
- Known issues: cold-weather battery loss 20–40%, initial 15% collar dropout

### Import from China to Mongolia

- **Customs**: 5% duty + 10% VAT on CIF value
- **Certifications**: ASM Conformity Certificate + CRC Type Approval (Resolution No. 24/2026)
- **Shipping**: Rail 10–15 days ($1–2K/container), Air 3–7 days ($5–12/kg)
- **Trade agents**: Carra Globe, Wigmore Trading, KGK LLC (UB), Senghor Logistics

---

## 5. Comparison Matrix

| Solution | Hardware | Annual | 3yr TCO (10) | Off-Grid? | Proven in MN? |
|---|---|---|---|---|---|
| **SmartOne C via Spotter** | **$98** | **$140** | **$4,090** | ✅ | ✅ 30K+ |
| Spot Trace via Spotter | $73 | $140 | $3,910 | ✅ | ✅ |
| PD28 (Beidou RDSS) | $480 | TBD | ~$5,800+ | ✅ | ⚠️ Unverified |
| TrackPro TR130 (Iridium) | $390–430 | Iridium plan | ~$6,000+ | ✅ | ⚠️ Vehicle form |
| GSatSolar | $217 | $72 | $3,898 | ✅ | ⚠️ No distributor |
| SmartOne Solar | $299–550 | $360–1,176 | $4,620–6,220 | ✅ | ⚠️ No pricing |
| Chinese 4G (WE-GT080) | $38–47 | $60–150 | $570–910 | ❌ | ❌ |
| Garmin inReach | $300–400 | $136–640 | $10,740 | ✅ | ⚠️ Not for animals |
| Apple AirTag | $29 | ~$1 | $400 | ❌ | ❌ |

---

## 6. Recommendation

### Primary: SmartOne C via Spotter + Flespi

1. **Contact Spotter** (smartspotter.net, contact@smartspotter.net, phone 77113315) for bulk pricing
2. **Set up Flespi** (flespi.com) with a Globalstar channel
3. **Build Supabase integration**: Edge Function → Flespi webhook → Postgres → Realtime → Flutter

### Secondary: Investigate Chinese partnerships

1. **Contact Inner Mongolia Starlink** (bdszhcy.net) — deployed in Mongolia since 2018, may offer wholesale
2. **Contact NexAgri** (dignx.com) — has developer API, may integrate with Tamga
3. **Consider hybrid**: SmartOne C remote + cheap 4G Chinese trackers where cellular exists

### What NOT to do

- ❌ AirTag — non-functional
- ❌ Chinese 4G-only trackers for remote areas — no coverage
- ❌ PD28 at $480 — 5× cost with unverified Mongolia coverage
- ❌ Import directly when Spotter handles everything locally

---

## 7. Open Questions

1. **Spotter API access**: Will they provide data export for a partner app?
2. **Beidou RDSS coverage in Mongolia**: Is short-message uplink reliable?
3. **Inner Mongolia Starlink pricing**: Wholesale partnership possible?
4. **Flespi pricing at scale**: €30/mo per channel for 10+ devices?
5. **GSatSolar cold-weather solar performance**: Unknown
6. **Hunu hardware details**: What tracker do they use?

---

## Sources

Full source index: `~/.omp/research/2026-07-16-horse-gps-mongolia-countryside/sources.md` (93+ sources)

**Critical sources**:
- [Globalstar 30K press release](https://investors.globalstar.com/news-releases/news-release-details/globalstar-partner-spotter-achieves-milestone-over-30000) — deployment proof
- [SmartOne C User Manual (FCC)](https://fcc.report/FCC-ID/L2V-S1C/5640002.pdf) — battery life truth
- [Energizer L92 Datasheet](https://data.energizer.com/pdfs/l92.pdf) — cold derating
- [Flespi SmartOne C docs](https://flespi.com/devices/globalstar-smartone-c) — integration path
- [Spotter pricing](https://smartspotter.net/?lang=en) — Mongolia costs
- [Beidou.gov.cn](http://www.beidou.gov.cn/yw/xydt/201710/t20171023_3100.html) — Chinese deployment in Mongolia
- [Inner Mongolia Starlink](http://en.bdszhcy.net/) — Beidou grazing system
